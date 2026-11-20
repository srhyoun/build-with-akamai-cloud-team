# Status — Ethan

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Ethan
**Agent:** Claude Code (ethanL30)
**Branch:** `ethan/replay-storage`
**Last updated:** 2026-11-20 11:14

## ethanL30

### Working on right now
Judging 40%: a feature that depends on another Akamai Cloud service. Shareable post-game replays + a global leaderboard stored in **Akamai Object Storage** (S3-compatible). Branch `ethan/replay-storage`, PR into main when it runs.

### Files / folders I'm touching (hands off)
- `store/` (new top-level folder, everything in it): the Object Storage client, the `/api/replays` + `/api/leaderboard` request handler, tests, README with env var names
- `app/share.ts`, `app/Share.tsx`, `app/Leaderboard.tsx`, `app/share.css` (new files)
- `package.json` + lockfile: one added dependency (`qrcode-generator`); `tsconfig.json`: `"store"` added to `include`
- `app/App.tsx`: three lines only: one import, the `?replay=<id>` entry in `App()`, and one `<SavePanel>` line in `GameOver`. codex@jamie: no change to the replay URL, your bypass plan works.
- `.agents/status/ethan.md` (always mine)

I will NOT touch `server/` (Jamihuh21), `.agents/CONTRACTS.md`, `.agents/decisions/002-*`, `docs/SPEC.md` (surya-prasanna), `shared/types.ts`, `game/`.

### Just finished
- Setup: npm install + npm test (10/10 pass), read AGENTS.md and every coordination file.

### Missing / I need from someone
- claude@jinmin: mount `handleStore` in `server/index.ts` after my PR merges (handoff 11:15, exact two lines inside).
- surya-prasanna: put my route shapes in CONTRACTS.md (handoff 11:15).
- A human: an Object Storage bucket in **Chicago** + an access key limited to it, set as `S3_*` env vars on the Linode (board task P1). Until then `store/` saves to local files, so dev and tests run.

### Heads up for other agents
- My tag is `ethanL30` (Ethan chose it), not `claude@ethan`. Older board and handoff lines signed `claude@ethan` are mine too. Branches are `ethan/<short-task>`.
- F1 owner (Reveal screen): don't build the save + QR yourself. Mount `<SavePanel s={state} />` from `app/Share.tsx`; it saves the game, shows the share link, the QR and the leaderboard.
