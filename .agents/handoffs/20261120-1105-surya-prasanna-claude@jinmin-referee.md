---
from: surya-prasanna
to: claude@jinmin
status: done
created: 2026-11-20 11:05
---

## What I need / what I'm handing off

From the build spec (`docs/SPEC.md`) and decision 002, for `server/`:

1. **Referee in /api/line.** I'm writing pure `checkLine(state, character, say, kind) → RefereeIssue[]` in `game/referee.ts`. Please call it on every model line: block → retry once → `422 { check }`; pass → `200 { ...say, check: RefereeCheck }`. Types in SPEC §10. Until it lands, treat it as returning `[]`.
2. **Mount lines.** `store/` (ethanL30, handoff coming from him) and `db/` (Managed PostgreSQL + `/api/stats/global` + `/api/health`, owner still open) will each export a request handler. Please mount each with one line in `server/index.ts`.
3. Sanitize DM text (300 chars, strip control chars) before it reaches the prompt (SPEC §8 rule 8).

## Context (files, branches, commits)

Branch `surya/spec`: `docs/SPEC.md` §9 (referee), §12 (API), §19 (lanes); `.agents/decisions/002-akamai-services-and-referee.md`; CONTRACTS.md updated.

## Update 2026-11-20 11:35 (surya-prasanna)

`checkLine` is ready on branch `surya/referee` (PR coming). At your hook in `server/line.ts`:

```ts
import { blocked, checkLine, toCheck } from '../game/referee.ts';
// after parseLine:  const issues = checkLine(state, c, say, kind);
// pass → { status: 200, body: { ...say, check: toCheck(state, c.id, kind, issues, attempt, ms, cfg.model) } }
// blocked on attempt 1 → call the model again; blocked on attempt 2 → { status: 422, body: { check } }
```

Truncate `say.text` when an `R_LENGTH` warning comes back. Your env vars are in CONTRACTS.md now (on the same branch).

## Update 2026-11-20 12:02 (surya-prasanna)

The app now runs `checkLine` itself on any 200 that has no `check` (and falls back to a scripted line if it blocks), so nothing breaks before you wire it. Once `/api/line` sends `check`, the app logs yours instead and the retry happens on the server.

## What "done" looks like

`/api/line` returns `check` once `game/referee.ts` is on main, and `/api/replays` + `/api/stats/global` reach their handlers.

## Update 2026-11-20 11:23 (claude@jinmin)

On PR #4 (`jamie/llm-endpoint`), tested with a fake model and in the browser (Under the Hood shows the server's checks):
1. **Referee: done.** `checkLine()` on every model line. Blocked → one retry, with a note telling the model what was wrong → `422 { check }`. Pass → `200 { ...say, check: toCheck(…, attempt, ms, cfg.model) }`. `say.text` is shortened when `R_LENGTH` warns.
2. **Mounts: waiting.** `store/` once `ethan/replay-storage` is on main (Ethan's one-liner). `db/` once it has an owner and an export.
3. **DM sanitizing: done.** Player posts and DMs ≤ 300 chars with control characters stripped; persona and scenario fields capped too.

Leaving this open until the mounts land.

## Update 2026-11-20 11:56 (claude@jinmin)

Done in PR #19 (`jamie/server-mounts`): `handleStore` and `handleDb` mounted before the `/api/` 404, `/api/health` → `{ ok, model, db, storage }`, `hooks.saveGame = saveGame` (only object entries of the player-sent referee log go on). Tested with `npm start`: leaderboard 200, stats 503 with no DB. Status set to done; it goes live when #19 merges.
