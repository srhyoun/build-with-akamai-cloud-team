# Deploy: Who's the Bot? on Akamai Cloud

One Linode runs Caddy (HTTPS) in front of `node server/index.ts`, which serves the game and `/api/*`. The server talks to three Akamai services. Click-by-click help for each one is in the organisers' workshop: [akamai-workshop-seattle-hackathon](https://github.com/akamai-developers/akamai-workshop-seattle-hackathon) (Lab 02 Linode, Lab 03 PostgreSQL, Lab 04 Object Storage). This page lists only our settings and the steps that differ from the workshop.

| Service | Region | What uses it |
|---|---|---|
| Cloud Inference | (event endpoint) | every character line, `/api/line` |
| Managed PostgreSQL | Seattle `us-sea` | finished games, `/stats.html` |
| Object Storage | Chicago `us-ord` (E3) | replay JSON behind the QR share card |
| Linode + Cloud Firewall | Seattle `us-sea` | the public HTTPS URL |

Regions follow the workshop's rule: everything in Seattle, except buckets, which go in Chicago. That overrides the "Chicago" hint in SPEC §6.

Files: [`deploy/cloud-init.yaml`](../deploy/cloud-init.yaml), [`deploy/whosthebot.service`](../deploy/whosthebot.service), [`deploy/whosthebot.env.example`](../deploy/whosthebot.env.example).

## 1. PostgreSQL first (it takes 10–30 minutes)

Cloud Manager → **Databases** → create a **PostgreSQL** cluster in **Seattle**, the smallest shared plan, 1 node. Start it now and do steps 2–4 while it provisions. Later you'll copy host, port and password from its connection details into the env file (step 6).

## 2. Object Storage bucket

Follow Lab 04. Use a bucket in **Chicago** (`us-ord-10.linodeobjects.com`), and leave it **private**: the server reads replays and passes them on. Create an access key **limited to that bucket** with read/write. Save the access key and secret; the secret is shown once.

## 3. Linode

Cloud Manager → **Create** → **Linode**:

| Field | Value |
|---|---|
| Region | Seattle, WA |
| Distribution | Ubuntu 24.04 LTS |
| Plan | Shared CPU, **Linode 4 GB**. The 1 GB Nanode from the workshop can run out of memory during `npm run build`. |
| Label | `sea-whosthebot-web` |
| SSH Keys | your laptop key (`cat ~/.ssh/id_ed25519.pub`) |
| Add User Data | the whole of `deploy/cloud-init.yaml` |

Note its IPv4 address. Then go back to the database from step 1 and add this IPv4 to its **allowed IPs**. Without that, every DB query times out.

## 4. Cloud Firewall

Create a custom firewall, default inbound **Drop**, outbound **Accept**, attached to the Linode, with two inbound rules:

| Label | Ports | Sources |
|---|---|---|
| `ssh` | TCP `22` | your address only: `echo "$(curl -s https://api.ipify.org)/32"` |
| `web` | TCP `80, 443` | **All IPv4 + All IPv6** |

This differs from the workshop, which limits port 80 to your own address. Ports 80 and 443 must be open to everyone: Let's Encrypt has to reach port 80 to issue the certificate, and judges' phones open the QR link. Port 8080 (Node) stays closed; only Caddy reaches it.

## 5. Ship the code

From the repo on your laptop. This sends what is committed on `main`, so `.env` and `node_modules` never leave your machine:

```bash
IP=PASTE_YOUR_LINODE_IP
```
```bash
git fetch origin && git archive origin/main | ssh root@$IP 'rm -rf /opt/whosthebot && mkdir /opt/whosthebot && tar -x -C /opt/whosthebot'
```

## 6. Set up the Linode

Log in with `ssh root@$IP`. All of the following runs on the Linode.

1. Wait for cloud-init, then check Node. It must print v24 or newer:
   ```bash
   cloud-init status --wait && node --version
   ```
2. Install and build:
   ```bash
   cd /opt/whosthebot && npm ci && npm run build
   ```
3. Work out the hostname. Use `<ip-with-dashes>.sslip.io` unless someone has a real domain:
   ```bash
   HOST=$(hostname -I | awk '{print $1}' | tr . -).sslip.io && echo $HOST
   ```
4. Create the env file from the template, then fill it in. Set `PUBLIC_APP_URL=https://` followed by `$HOST`, and add the team inference key, the DB details from step 1 and the bucket key from step 2:
   ```bash
   install -m 600 deploy/whosthebot.env.example /etc/whosthebot.env && nano /etc/whosthebot.env
   ```
5. Start the game server:
   ```bash
   cp deploy/whosthebot.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now whosthebot && journalctl -u whosthebot -n 20
   ```
6. Put Caddy in front of it (it fetches the certificate on its own):
   ```bash
   printf '%s {\n\treverse_proxy localhost:8080\n}\n' "$HOST" > /etc/caddy/Caddyfile && systemctl reload caddy
   ```

## 7. Check it works

- From the Linode: `curl -s https://$HOST/api/health`. It should report the model name, not `null`.
- On a phone, open `https://<HOST>` and play one game. Under the Hood should show model lines that passed the referee, and the reveal should show a QR code.
- Scan the QR on another phone: the replay card should load. It comes from Object Storage.
- Open `https://<HOST>/stats.html`: it should list the game you just played. That data comes from PostgreSQL.

Logs: `journalctl -u whosthebot -n 50` (game server) and `journalctl -u caddy -n 50` (HTTPS).

## Update during build time

From your laptop, with `IP` set. The game is down for about a minute while it builds, so don't run this during the demo:

```bash
git fetch origin && git archive origin/main | ssh root@$IP 'rm -rf /opt/whosthebot && mkdir /opt/whosthebot && tar -x -C /opt/whosthebot && cd /opt/whosthebot && npm ci && npm run build && systemctl restart whosthebot'
```

The env file lives in `/etc`, so it survives this.

## Problems

| What you see | What to do |
|---|---|
| `ssh` times out | Firewall rule `ssh` must have your current address (it changes when you switch Wi-Fi). |
| Browser says the certificate is invalid, or the connection is refused | Ports 80 and 443 must be open to **all** sources; read `journalctl -u caddy -n 50`. If sslip.io hits a Let's Encrypt limit, Caddy retries with ZeroSSL by itself. As a last resort, plain HTTP: put `:80` in place of the hostname in `/etc/caddy/Caddyfile`. |
| `502` from Caddy | Node isn't running: `journalctl -u whosthebot -n 50`. |
| `/api/health` shows `model: null` | `AKAMAI_BASE_URL`, `AKAMAI_API_KEY` or `CHAT_MODEL` is empty or wrong in `/etc/whosthebot.env`; then `systemctl restart whosthebot`. |
| `/stats.html` fails, or DB timeouts in the log | The Linode's IPv4 is not on the database's allowed IPs, or a `PG*` value is wrong. |
| No QR at the reveal | An `OBJ_*` value is wrong, or the key can't write to that bucket. Without bucket settings the server can't save replays: the service user can't write to disk on purpose. |
| `npm run build` is killed | Out of memory: resize the Linode to 4 GB or more. |

## After the event: delete everything

Delete the Linode, the database cluster, the firewall, the bucket and its access key. A **stopped** Linode still bills. Deleting the bucket does **not** cancel Object Storage: cancel it under Account → Settings. The workshop's `docs/cleanup.md` has the full list.
