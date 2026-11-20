# Status — Ethan

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Ethan
**Agent:** Claude Code (ethanL30)
**Branch:** none
**Last updated:** 2026-11-20 12:22

## ethanL30

### Working on right now
Nothing in flight. Waiting for Ethan to pick the next task, and for `node store/selftest.ts` to print PASS on a real bucket (handoff to claude@jinmin, 12:19). That result closes the Judging 40% line on the board.

### Files / folders I'm touching (hands off)
- `store/` (everything in it), incl. new `store/boot.test.ts`, `store/selftest.ts`
- `app/share.ts`, `app/Share.tsx`, `app/Leaderboard.tsx`, `app/share.css`
- `.agents/status/ethan.md` (always mine)

### Just finished
- PR #28 merged: `store/boot.test.ts` (starts `node server/index.ts`), `verbatimModuleSyntax` in `tsconfig.json`, `node store/selftest.ts`. Use `import type` for types from now on, or `tsc` fails.
- PR #25 merged (`ethan/class-code`): `saveReplay` sends `classCode: getClassCode()` (surya-prasanna's handoff 12:02, marked done). surya-prasanna: your board Missing line about it can go.
- PR #16 is merged; `store/` is mounted by PR #19.
- `store/`: `POST /api/replays`, `GET /api/replays/:id`, `GET /api/leaderboard` behind `handleStore(req, res)`. S3 client with Signature V4 (checked against AWS's published examples and a fake S3), private bucket, one object per game so the leaderboard needs no read-modify-write. Posted state is validated and whitelisted; score from `radar()`.
- `app/`: `<SavePanel>` inside `<Reveal>` (saves once, link, QR, leaderboard, sends `getRefereeLog()`), `<ShareView>` at `/?replay=<id>` with every bot post labelled.
- Checked: 57/57 tests, tsc, vite build, and a full game in the browser at phone width → save → share view.
- Handoffs from claude@sarah (Reveal slot), surya-prasanna (referee log, db hook) and claude@jinmin (routes) are handled and marked done.

### Missing / I need from someone
- **A human / P1 owner (claude@jinmin):** an Object Storage bucket in **Chicago** (`https://us-ord-10.linodeobjects.com`) and an access key limited to it, set on the Linode as `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (the workshop's `OBJ_*` names work too). Not tested against a real bucket yet.
- **claude@jinmin:** after PR #4 and #16 are on main, in `server/index.ts`: `if (await handleStore(req, res)) return;` before the `/api/` 404 branch, and `hooks.saveGame = saveGame` (both imports in my 11:14 handoff and `store/README.md`).
- **surya-prasanna:** `storageHealth()` from `store/handler.ts` is ready for `/api/health`.

### Heads up for other agents
- My tag is `ethanL30` (Ethan chose it), not `claude@ethan`. Branches are `ethan/<short-task>`.
- The share link in the QR is built in the browser from the page's own origin, so it is right behind Caddy without `PUBLIC_APP_URL`.
- `SavedGame.state` handed to `hooks.saveGame` is shape-checked but not a cleaned copy: use query parameters and your own caps in `db/`.
- The player's own posts and all DMs are left out of the stored replay on purpose (we don't host free-form player text).
