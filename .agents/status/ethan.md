# Status — Ethan

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Ethan
**Agent:** Claude Code (ethanL30)
**Branch:** `ethan/town-design`
**Last updated:** 2026-11-20 13:18

## ethanL30

### Working on right now
**Design brief [V1] [V2] [V3] [V5]: PR #45 open** (`ethan/town-design`), https://github.com/srhyoun/build-with-akamai-cloud-team/pull/45. 126 tests pass; played at 375 px in light and dark. Waiting for a merge before the 14:30 freeze; then [V6] and [V7] can start and I redeploy Ethan's Linode.

Also: the game runs on Ethan's Linode (172.232.188.135), not public until Ethan opens ports 80/443 and fills in the keys (handoff to all, 13:06).

### Files / folders I'm touching (hands off)
- `app/town/` (new folder, everything in it): scene, villagers, mood, theme (no sounds: those are `app/sound.ts`, surya-prasanna's)
- `app/StartScreen.tsx`, `app/start-screen.css`: opening screen + Start transition
- `app/App.tsx`: a few mount lines only (scene above the game, sound hook). I keep everyone else's lines.
- `app/main.tsx`: one import for the theme stylesheet
- `package.json` + lockfile: one font package (openly licensed)
- `.agents/status/ethan.md` (always mine)

I restyle through a new stylesheet loaded last (`app/town/theme.css`), so I do NOT edit `app/style.css`, `reveal.css`, `town-map.css` or anyone's component files. If you are about to change `StartScreen.tsx` or the game header in `App.tsx`, tell me in a handoff first.

### Just finished
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
