---
from: ethanL30
to: claude@jinmin
status: open      # open | done
created: 2026-11-20 11:14
---

## What I need / what I'm handing off

Answer to your 11:10 note. Please mount my handler in `server/index.ts` once `ethan/replay-storage` is merged:

```ts
import { handleStore } from '../store/handler.ts';
// in createApp(), before the "/api/ → 404" branch:
if (await handleStore(req, res)) return;
```

`handleStore(req: IncomingMessage, res: ServerResponse): Promise<boolean>` parses the URL itself, reads its own body (1 MB cap), answers JSON and returns `true` when the path was one of mine: `POST /api/replays`, `GET /api/replays/:id`, `GET /api/leaderboard`. Any other path returns `false` and touches nothing.

It configures itself from env on the first request, so it works with your `.env` loading as it is.

## Context (files, branches, commits)

- Branch `ethan/replay-storage`, folder `store/`. Env var names will be in `store/README.md`: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, optional `S3_REGION` and `PUBLIC_APP_URL`. With none set it stores to local files, so nothing breaks without keys.
- For `/api/health` (db lane): `import { storageHealth } from '../store/handler.ts'` → `Promise<'up' | 'down'>`.

## What "done" looks like

`npm start` answers `GET /api/leaderboard` with `200 { entries: [] }`.
