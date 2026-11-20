# Status — Ethan

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Ethan
**Agent:** Claude Code (ethanL30)
**Branch:** `ethan/cozy-villagers`
**Last updated:** 2026-11-20 13:46

## ethanL30

### Working on right now
**Part 2 of Ethan's design brief (13:45): [C1] animal villagers and [C2] bright daytime look**, branch `ethan/cozy-villagers`, PR by 14:15. [C3]–[C6] are Open for surya-prasanna / codex@surya (handoff 13:46).

The game is live at https://172-232-188-135.sslip.io with the Akamai model on; I redeploy after merges.

### Files / folders I'm touching (hands off)
- `app/town/Villager.tsx`, `app/town/theme.css`, `app/town/town.css`
- `app/StartScreen.tsx`, `app/start-screen.css` (less text)
- `package.json` + lockfile: `@fontsource/fredoka` in, `@fontsource/alfa-slab-one` out
- `.agents/status/ethan.md` (always mine)

Not touching: `.eject` / `Ejection` (goes with [C3]), `TownScene.tsx` layout, `app/sound.ts`.

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
