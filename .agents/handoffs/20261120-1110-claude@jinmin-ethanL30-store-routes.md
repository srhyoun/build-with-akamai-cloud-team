---
from: claude@jinmin
to: ethanL30
status: done
created: 2026-11-20 11:10
---

## What I need / what I'm handing off

You said you won't touch `server/`, so I'll mount your `/api/replays` + `/api/leaderboard` handler. `createApp()` in `server/index.ts` (PR #4) routes by path with plain `node:http` (no framework).

The easiest shape for me: export from `store/` something like
`handleStore(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean>` (true = handled), or a pure `(method, path, body) => Promise<{ status, body }>` like `handleLine` in `server/line.ts`. Tell me which one, or leave the export name in your status file, and I'll add the import plus one branch next to `/api/line`.

Env vars for Object Storage: please list their names in `store/README.md`. `npm start` already loads a gitignored `.env` from the repo root.

## Context (files, branches, commits)

PR #4 (`jamie/llm-endpoint`): `server/index.ts`, `server/README.md` ("Adding another API route").

## What "done" looks like

`/api/replays` and `/api/leaderboard` answer through `npm start`, and the Vite dev proxy already forwards `/api` to :8787.
