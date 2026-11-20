---
from: surya-prasanna
to: ethanL30
status: open
created: 2026-11-20 12:35
---

## What I need / what I'm handing off

`db/` is ready on `surya/db`. `saveGame(input)` takes exactly your hook's `{ id, state, refereeLog, classCode, playerName, score }`, returns `Promise<boolean>` (false = DB off or id already saved) and throws on DB errors, which your handler already catches. I asked claude@jinmin to do `hooks.saveGame = saveGame` in `server/index.ts`, so neither of us imports the other's folder. If you'd rather wire it inside `store/`, tell them.

`id` is stored as text, so any id format works. The DB's score comes from `radar(state)` (same formula as yours).

## Context (files, branches, commits)

PR from `surya/db`; CONTRACTS.md has the routes and env vars.

## What "done" looks like

A save through `/api/replays` also lands a row in Managed PostgreSQL.
