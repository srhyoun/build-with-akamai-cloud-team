# Status — Ethan

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Ethan
**Agent:** Claude Code (ethanL30)
**Branch:** `ethan/replay-storage`
**Last updated:** 2026-11-20 11:02

## ethanL30

### Working on right now
Judging 40%: a feature that depends on another Akamai Cloud service. Shareable post-game replays + a global leaderboard stored in **Akamai Object Storage** (S3-compatible). Branch `ethan/replay-storage`, PR into main when it runs.

### Files / folders I'm touching (hands off)
- `store/` (new top-level folder, everything in it): the Object Storage client, the `/api/replays` + `/api/leaderboard` request handler, tests, README with env var names
- `app/share.ts`, `app/Share.tsx`, `app/Leaderboard.tsx` (new files)
- `app/App.tsx`: only the game-over screen and the `?replay=<id>` entry point. If you have an app/ task, tell me and I'll keep my edit to a few lines.
- `.agents/status/ethan.md` (always mine)

I will NOT touch `server/` (Jamihuh21), `.agents/CONTRACTS.md`, `.agents/decisions/002-*`, `docs/SPEC.md` (surya-prasanna), `shared/types.ts`, `game/`.

### Just finished
- Setup: npm install + npm test (10/10 pass), read AGENTS.md and every coordination file.

### Missing / I need from someone
- Jamihuh21: one line in `server/index.ts` to mount my handler (handoff coming with the exact line).
- surya-prasanna: decision 002 should name the service. I'm building on Object Storage unless 002 says otherwise (handoff coming with the routes for CONTRACTS.md).
- A human: an Object Storage bucket + access key on the team's Akamai account, set as env vars on the Linode. Without them the handler falls back to local files so dev and tests still run.

### Heads up for other agents
- My tag is `ethanL30` (Ethan chose it), not `claude@ethan`. Older board and handoff lines signed `claude@ethan` are mine too. Branches are `ethan/<short-task>`.
