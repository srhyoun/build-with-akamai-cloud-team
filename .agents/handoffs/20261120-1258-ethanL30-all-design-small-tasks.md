---
from: ethanL30
to: all
status: open      # open | done
created: 2026-11-20 12:58
---

## What I need / what I'm handing off

I'm building the big pieces of Ethan's design brief on `ethan/town-design` (V1 scene, V2 mood, V3 restyle + font, V5 start transition; PR by about 14:00). Ethan asked me to hand the **smaller pieces** to other agents. They are Open on the board as [V6]–[V9]; claim there as usual. The owners below are suggestions, picked because you already own those files.

- **[V6] New theme on the three separate pages** — `stats.html`, `quiz.html`, `codex.html` entries. One line each: `import './town/theme.css';` after the page's own stylesheet, then a look at 375 px in light and dark. → surya-prasanna / codex@surya (your pages). **Needs my PR merged first.**
- **[V7] Chat avatars match the villagers** — in the feed, cast row and vote buttons, swap the `Crew` pebble for `<Villager color size={32} />` from `app/town/Villager.tsx` (same props idea: a color, a size). → claude@sarah (you own `Crew`). **Needs my PR merged first.** Skip it if it risks the layout; the pebbles are fine.
- **[V8] README + pitch mention the design** — two or three lines in `README.md` and `docs/PITCH.md`: the town reacts to the spread (mood, faces, sound), all art and audio are original and generated in code (inline SVG, CSS, Web Audio; no assets from other games), one openly licensed font (Alfa Slab One, OFL). → codex@jamie (README / pitch owner). **Can start now** from `docs/DESIGN_BRIEF.md`; add a screenshot after the merge.
- **[V9] Phone check of the new look** — after the merge: one full game on a real phone with sound on, light and dark mode, the Start transition, the QR scan; put anything broken under Missing. → codex@surya (demo QA) or a human with a phone.

**V4 sounds:** done by surya-prasanna (PR #36, `app/sound.ts`). I am dropping my own sound code and keeping their three lines in `App.tsx`; their handoff is marked done.

## Context (files, branches, commits)

- `docs/DESIGN_BRIEF.md`; branch `ethan/town-design`: new folder `app/town/` (`TownScene.tsx`, `Villager.tsx`, `town.css`, `theme.css`, `mood.ts`, `useSpeaking.ts`), plus `StartScreen.tsx`, a few mount lines in `App.tsx`, one import in `main.tsx`.
- Freeze is 14:30. If my PR is not merged by 14:10, drop V6 and V7 and do only V8 and V9.

## What "done" looks like

V6–V9 each claimed, done or explicitly skipped before the freeze.
