---
from: ethanL30
to: all
status: open      # open | done
created: 2026-11-20 13:06
---

## What I need / what I'm handing off

Ethan had a Linode running, so on his instruction I deployed main there, following `docs/DEPLOY.md`.

- **URL (once the firewall is open):** https://172-232-188-135.sslip.io
- **IPv4:** 172.232.188.135 (Seattle, Ubuntu 24.04, Nanode 1 GB)
- **Deployed commit:** main at `0a3e55a`
- **State right now:** `whosthebot` and Caddy are running; on the server `/api/health` answers `{"ok":true,"model":null,"db":"off","storage":"up"}`.
  - **HTTPS is not up yet.** The Cloud Firewall still blocks 80/443 from the internet, so Let's Encrypt times out. Ethan has to add the `web` rule (TCP 80, 443, all sources) in Cloud Manager. Caddy retries by itself.
  - **No keys yet.** `/etc/whosthebot.env` exists with `PORT` and `PUBLIC_APP_URL` set and every key empty: characters are scripted, the DB is off. A human with the keys has to fill it in on the server (`nano /etc/whosthebot.env`, then `systemctl restart whosthebot`). Keys never go in the repo or in chat.

**claude@jinmin:** you hold [P1]. This is not meant to take it from you: if Jamie's own Linode, database and bucket are coming, deploy there and we point everyone at whichever is complete. If not, this one is ready for the keys. Tell me which.

Two things differ from `docs/DEPLOY.md`, both because of the 1 GB plan and the missing bucket:
1. **Built on the laptop, not on the Linode.** `npm run build` ran on Ethan's laptop and `dist/` was copied over; the server only ran `npm ci --omit=dev`. The doc's "Update during build time" command builds on the server and may run out of memory there.
2. **Replays are saved on the server's disk for now.** A systemd drop-in (`/etc/systemd/system/whosthebot.service.d/local-store.conf`) gives the service a writable `/var/lib/whosthebot` and sets `STORE_DIR` to it, so Save & share and the QR work without bucket keys. Once `OBJ_*` is filled in, the bucket is used instead and the drop-in does nothing.

## Context (files, branches, commits)

To update the deployment from a laptop whose SSH key is on the server (today only Ethan's):

```bash
IP=172.232.188.135
npm ci && npm run build
git archive origin/main | ssh root@$IP 'rm -rf /opt/whosthebot && mkdir /opt/whosthebot && tar -x -C /opt/whosthebot'
tar -c dist | ssh root@$IP 'tar -x -C /opt/whosthebot && cd /opt/whosthebot && npm ci --omit=dev && systemctl restart whosthebot'
```

Teammates who want SSH access: send Ethan your public key line and your IP; he adds the IP to the firewall's `ssh` rule and I add the key.

## What "done" looks like

`curl https://172-232-188-135.sslip.io/api/health` shows a model name, `db: "up"` and `storage: "up"`, and `node store/selftest.ts` on the server prints PASS.
