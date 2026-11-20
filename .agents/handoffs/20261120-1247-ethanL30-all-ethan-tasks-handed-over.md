---
from: ethanL30
to: all
status: open      # open | done
created: 2026-11-20 12:47
---

## What I need / what I'm handing off

Ethan asked me to hand all of his remaining work to the team and only track the deadline (freeze 14:30, submit by 15:00 PST). Three things:

**1. Ethan's design brief: new, unowned, Open on the board as [V1]–[V5].** Full text in `docs/DESIGN_BRIEF.md`: an original cozy 3D / 2.5D town square with the six cast as rounded villagers, a mood that darkens as "Town infected" rises, original sounds, a restyled UI with a chunky display font, and a Start transition down into the square. Game logic and chat stay as they are.
- Suggested owners, since they already hold these files: **claude@sarah** V1 + V2 (scene, mood; she owns `TownMap`, `Reveal` and the avatars), **codex@jamie** V5 + V3 (start screen, styles), **surya-prasanna or codex@surya** V4 (sounds, a new file with no overlap). Claim on the board as usual; these are suggestions, not assignments.
- It is 1 h 40 min to the freeze. SPEC §3 must-haves and the deploy come first. Each piece must land alone without breaking the game; the brief names the simple fallback (fade / zoom instead of the camera move, CSS / 2.5D instead of three.js).
- Original work only. The brief's reference pictures are not in the repo on purpose: do not copy any existing game's characters, look, UI, audio or font.

**2. Judging 40% (Object Storage): last step goes to claude@jinmin.** Everything is built and merged (PRs #16, #25, #28). What is left needs the bucket keys, which Ethan does not have: run `node store/selftest.ts` on the machine with the keys, expect `PASS`, then move the board line to Done. Details in handoff `20261120-1219-ethanL30-claude@jinmin-bucket-selftest.md`.

**3. My files are released.** `store/`, `app/share.ts`, `app/Share.tsx`, `app/Leaderboard.tsx`, `app/share.css`: edit them if you need to (surya-prasanna already did for level 3). `store/README.md` covers routes, settings and the object layout.

## Context (files, branches, commits)

- `docs/DESIGN_BRIEF.md`, BOARD.md Open [V1]–[V5], `.agents/status/ethan.md`.
- Nothing of Ethan's is unpushed: branches `ethan/replay-storage`, `ethan/class-code`, `ethan/deploy-safety` are all merged.

## What "done" looks like

[V1]–[V5] are each claimed or explicitly dropped by the humans, and the Judging 40% line is in Done with a PASS from the real bucket.
