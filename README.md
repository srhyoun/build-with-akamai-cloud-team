# Who’s the Bot?

A social-deduction game for high-school media-literacy classes. A breaking story hits a fictional town group chat. Six accounts weigh in, and one or two bots quietly push a false rumor. Compare stories, spend two Fact-Check Tokens per round, and vote out a suspect. The class can then discuss which evidence changed their minds and which claims they would have shared.

> Bots are already in your group chats. This is the training ground.

## Play locally

Use Node.js 24 or later. The browser can run the full deduction game with scripted dialogue and no service credentials.

```sh
npm ci
npm test
npm run dev
```

Open [localhost:5173](http://localhost:5173). Read the news alert, use **Source Check** on a post or DM an account to inspect **Account Age** and **Posting Pattern**, then call an emergency meeting and vote. Open **Under the Hood** to see the referee log.

## Architecture and Akamai services

React and Vite render the chat and investigation tools. A seeded TypeScript engine owns the game rules. The Node server handles model calls and storage so service credentials stay server-side. The service map below describes the integrated build. The local browser flow above works independently.

| Akamai service | Feature it supports |
|---|---|
| Cloud Inference | Generates in-character group posts, private replies, and meeting defenses. The team verified `qwen3-8-27b` with all three kinds of dialogue. We chose a workshop-provided chat model so we could use the supported endpoint and test short, structured responses. |
| Object Storage | Keeps replay data in a private bucket. The share link or QR opens the same replay on another device, with public chat and outcomes available for class discussion. |
| Managed PostgreSQL | Stores completed game results for Live Tactics Stats, including how often particular tactics survive. Ask how many games contributed before interpreting a rate. |
| Linode and Cloud Firewall | Host the game and API behind HTTPS in the deployment plan. The firewall controls inbound access to the host. |

## How we check model dialogue

`checkLine()` runs deterministic rules on each generated line. It can block a role leak, a human account asserting the scenario’s false story, or an empty reply. The server retries a blocked model response once and falls back to a scripted line if the retry still fails. The browser also checks a response when the server has not sent a verdict. **Under the Hood** shows passes, blocks, and fallbacks, with character names and rule details revealed after the game.

For a known-good result, the tests accept a character asking for the county source. For a known failure, they reject a line that openly identifies the speaker as an AI. These rules check whether dialogue fits the game. The fictional scenario supplies the ground truth. [Referee tests](game/referee.test.ts) · [Inference integration and live checks](https://github.com/srhyoun/build-with-akamai-cloud-team/pull/4)

## Judge walkthrough

1. Pick a suspicious message, tap **Source Check**, and point to the clue you used when voting.
2. Open **Under the Hood** and show one accepted line and a labeled failure case. If dialogue is scripted, say so and use the deterministic test to demonstrate the failure.
3. On a configured deployment, scan a completed game’s replay QR and open it on another device. Confirm the replay came from Object Storage. If the database is connected, open `/stats.html` and show the completed-game count.

**Known limits.** The client owns the game state, so a player inspecting browser internals can see hidden roles and a submitted score is not suitable for a competitive leaderboard. Live dialogue, cloud replay sharing, and live stats require their respective services to be configured. The local path uses scripted dialogue.

[Build spec](docs/SPEC.md) · [Module contracts and environment settings](.agents/CONTRACTS.md)

## Repository coordination


This repo is set up so every teammate's AI agent (Claude Code, Codex, Copilot, Gemini, whatever you use) can coordinate with the others through files in the repo, instead of stepping on each other.

```
AGENTS.md            rules every AI agent reads first (CLAUDE.md points here)
.agents/
  status/            one file per teammate: what their agent is doing, touching, missing
  BOARD.md           shared task board — claim tasks here before working
  LOG.md             append-only activity log, one line per meaningful action
  CONTRACTS.md       interfaces between parts of the project (fill in on day 1)
  handoffs/          notes one agent leaves for the next
  decisions/         short records of design decisions
docs/                challenge brief, research, pitch notes
.github/             PR + issue templates
```

## How it works (humans)

0. First thing at 9: fill in your `.agents/status/<yourname>.md` and your row in the team table.
1. Pull before you prompt your agent. Push when it's done a chunk.
2. Point your agent at `AGENTS.md` (Claude Code reads `CLAUDE.md` automatically, which links there).
3. Each person works on their own branch: `<name>/<task>` e.g. `sarah/start-screen`.
4. Merge to `main` through PRs so the other agents see clean history.

## Team

| Name | Role | Agent |
|------|------|-------|
| Ethan | | Claude Code (ethanL30) |
| Jamie | | Claude Code (claude@jinmin) = main agent. Codex (codex@jamie) = side work |
| Sarah | | |
| Surya | | Claude Code (surya-prasanna) |

## Credits


Started from [asigurdsDEV/build-with-akamai-cloud](https://github.com/asigurdsDEV/build-with-akamai-cloud) (MIT), the game skeleton and multi-agent setup.
