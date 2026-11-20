---
from: ethanL30
to: surya-prasanna
status: open      # open | done
created: 2026-11-20 11:14
---

## What I need / what I'm handing off

Final route shapes for `store/`, for CONTRACTS.md and SPEC §12/§14 (yours to edit). Building now on `ethan/replay-storage`.

- `POST /api/replays` body `{ state: GameState, refereeLog?: RefereeCheck[], classCode?: string, playerName?: string }`, ≤ 1 MB, only when `state.phase === "over"`.
  Answer `200 { id: string, shareUrl: string | null, score: number }`. `400` bad shape or game not over, `413` too big, `429` too many saves.
  `shareUrl` is `<PUBLIC_APP_URL or the request's origin>/?replay=<id>`; `null` when the upload failed (the app then hides the QR).
- `GET /api/replays/:id` → `200 { replay: Replay, source: "object-storage" | "local" }`, `404` unknown id.
  The server reads the object and passes it on. The bucket stays **private** (what the Akamai workshop recommends), so no public-read ACL and no bucket CORS are needed. Demo line stays true: the card's data is stored in and read from Akamai Object Storage.
- `GET /api/leaderboard` → `200 { entries: { id, name, score, result, level, infection, at }[], source }`, top 10 by score, cached 10 s.
- `Replay` (type in `store/replay.ts`): scenario alerts, characters with role + tactics, public posts with tactic tags (no DMs), ejections, result, infection, score, optional player name (≤ 24 chars). Built server-side from whitelisted fields; nothing else from the request is stored.

Objects: `replays/{id}.json` and `scores/{rank-key}-{id}.json` (one small object per game, so the leaderboard needs no read-modify-write).

## Context (files, branches, commits)

- **Score:** I compute `100·botsCaught − 75·humansEjected + (100 − finalSpread)` (SPEC §11) inside `store/` for now. When `game/radar.ts` lands I'll switch to your function and add the radar to the replay.
- **db/ hook:** `import { hooks } from '../store/handler.ts'; hooks.saveGame = saveGame;` It is called once per save with `{ id, state, refereeLog, classCode, playerName, score }`. If it throws, the replay is still uploaded (SPEC §18).
- **Env names:** I confirm `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `PUBLIC_APP_URL`. `S3_REGION` is optional (default `us-east-1`, what the workshop's client signs with). The workshop's `OBJ_*` names are accepted too. Per the workshop the bucket must be in **Chicago** (`https://us-ord-10.linodeobjects.com`), not Seattle.
- I add one dependency, `qrcode-generator` (QR on the share panel, works offline), and `"store"` to `tsconfig.json`'s `include`.

## What "done" looks like

CONTRACTS.md shows these shapes.
