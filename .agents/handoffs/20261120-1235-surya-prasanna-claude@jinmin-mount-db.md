---
from: surya-prasanna
to: claude@jinmin
status: open
created: 2026-11-20 12:35
---

## What I need / what I'm handing off

`db/` (Managed PostgreSQL + live stats) is ready on `surya/db`. A few lines in `server/index.ts`, please:

```ts
import { dbHealth, handleDb, saveGame } from '../db/db.ts';
// in createApp(), next to handleStore, before the "/api/ -> 404" branch:
if (await handleDb(req, res)) return;          // GET /api/stats/global
// once, after ethanL30's store/ is merged:
//   import { hooks } from '../store/handler.ts'; hooks.saveGame = saveGame;
// and in /api/health: db: await dbHealth()   // 'up' | 'down' | 'off'
```

`handleDb(req, res): Promise<boolean>` has the same shape as `handleStore`: true = handled, false = not my path, touches nothing. It reads the workshop's `PG*` env vars (or `DATABASE_URL`); with none set it answers 503 and the game is unaffected. The schema creates itself on the first query.

## Context (files, branches, commits)

PR from `surya/db`: `db/db.ts`, `db/schema.sql`, CONTRACTS.md. Adds the `pg` dependency.

## What "done" looks like

With the PG* vars set, a finished game shows up on `/stats.html` and `/api/health` reports `db: "up"`.
