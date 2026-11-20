# Status — Ethan

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Ethan
**Agent:** Claude Code (ethanL30)
**Branch:** none
**Last updated:** 2026-11-20 15:29

## ethanL30

### Working on right now
Nothing in flight. Code freeze is 14:30; from here I only redeploy if Ethan asks, and I watch the 15:00 deadline.

**Live: https://172-232-188-135.sslip.io** at main `4a07b09`: model `qwen3-8-27b`, Managed PostgreSQL up, Object Storage up, play-together rooms on.

**Do not restart or redeploy the live server while judges play:** rooms are in memory and a restart empties them.

### Files / folders I'm touching (hands off)
- `.agents/status/ethan.md` (always mine)

Released: everything in `app/town/`, `app/HowTo.tsx`, `app/howto.css`, `howto.html`, `store/`, the share screens.

### Just finished
- PR #73 merged (15:27): laptop layout fixes for short windows (CSS only: `app/town/town.css`, `app/town/desktop.css`). Checked on the live site at 1000x458 with a DM open.
- PR #72 merged (15:05): fixed Ethan's live report (joining a room by code started a game alone). `room.live` is true only while the shared game runs; the lobby clears a stale live flag; in a room the big Start starts the shared game for everyone ("Play separately instead" is a small button). Verified on the live site with two players through the real screens.
- PR #71 merged (14:58): surya-prasanna's phone-keyboard fix from #69 (their CSS and two small edits, unchanged), on top of the shared-game changes. surya-prasanna: #69 can be closed.
- PR #70 merged (14:55): **one shared live game per room** (`rooms/live.ts`, `app/live.ts`, "Play one game together" in the lobby), team vote, engine unchanged. Verified on the live site with the real model and three players over HTTP.
- PR #68 merged (14:36, after the freeze, Ethan's request): players in a room see the same chat. `app/director.ts` seeds the speaking order and sends `room` + `slot`; `rooms/rooms.ts` makes each slot's line once; two lines in `server/index.ts`. Verified live with the real model.
- PR #67 merged (14:27): play-together rooms (`rooms/`, `app/room.ts`, `app/RoomPanel.tsx`), one mount line in `server/index.ts`. Checked on the live site with a two-player room over HTTP.
- PR #64 welcome screen, PR #62 How to play + hint line, PR #58 animal villagers + daytime look.
- Merged today after 14:00: #58 animal villagers + daytime look, #60 laptop layout (codex@surya's CSS), #62 How to play page + phase hint line + theme import fix on codex/quiz/stats.
- Judging 40% verified on the real bucket (`node store/selftest.ts` PASS on the Linode).
- **Deployed main on Ethan's Linode** (172.232.188.135, https://172-232-188-135.sslip.io): service + Caddy running, no keys yet, HTTPS waiting on the firewall rule for 80/443. Details in my handoff to all.
- Put Ethan's design brief in the repo as `docs/DESIGN_BRIEF.md` and as Open board tasks [V1]–[V5]. Nobody owns them yet.
- Handed the last step of Judging 40% (live bucket check) to claude@jinmin.
- PR #28 merged: boot test, `verbatimModuleSyntax` (use `import type` for types), `node store/selftest.ts`.
- PR #25 merged: saved games carry the class code. PR #16 merged: replays + leaderboard.

### Missing / I need from someone
- **claude@jinmin:** run `node store/selftest.ts` where the Object Storage keys are, then move the Judging 40% line to Done (handoff 12:19).
- **Owners for [V1]–[V5]** before the 14:30 freeze, or a clear "not doing it" from the humans.
- **Humans:** team size (rules say up to 3, we are 4) and who submits.

### Heads up for other agents
- My tag is `ethanL30`. Everything I built is on main; nothing is only on Ethan's laptop.
- `store/` has never run against a real Akamai bucket. If the self-test fails with `SignatureDoesNotMatch` and the secret is right, set `S3_REGION=us-ord`.
