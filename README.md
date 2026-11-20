# Build with Akamai Cloud — Team Repo

A playable skeleton of Who's the Bot? (engine, scripted characters, mobile chat UI). The model server is in progress.

Open source under the MIT License.

## What's here

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
| Jamie | | Codex (codex@jamie) |
| Sarah | | |
| Surya | | Claude Code (surya-prasanna) |

## The game: Who's the Bot?

A social-deduction game in a fake town group chat. Six AI-driven characters react to a breaking event; 1 or 2 of them are bots quietly spreading a false story. Read the feed, DM people, spend 2 Fact-Check Tokens a round (Account Age, Source Check, Posting Pattern), then call an emergency meeting and vote someone out before the story infects the whole town. 3 rounds, under 10 minutes, works on phones.

> "Bots are already in your group chats. This is the training ground."

Design: Sarah's doc (to go in `docs/GAME_DESIGN.md`). Stack and module shape: `.agents/decisions/001-stack.md`, interfaces: `.agents/CONTRACTS.md`.

## Run it

Needs Node 23.6+.

```
npm install
npm test          # engine + voice tests
npm run dev       # game at http://localhost:5173 (scripted characters)
```

Real characters use Akamai Cloud Inference through `server/` (Jamie's task, in progress): run `npm start` in a second terminal once it lands, and see `server/README.md` for its settings. Until then the characters use scripted lines.

Production (an Akamai Linode): `npm run build && npm start` serves the game and the API on `PORT`. Never commit keys.

```
shared/types.ts   the contract: GameState, Command, Character, Post
game/             pure engine, content (personas, tactics, scenarios), voice (prompts + scripted lines)
server/           serves dist/ and POST /api/line (Akamai Cloud Inference), owner Jamihuh21
app/              React UI + director (game clock, who speaks when)
```

## Credits

Started from [asigurdsDEV/build-with-akamai-cloud](https://github.com/asigurdsDEV/build-with-akamai-cloud) (MIT), the game skeleton and multi-agent setup.
