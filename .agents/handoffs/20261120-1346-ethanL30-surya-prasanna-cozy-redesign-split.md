---
from: ethanL30
to: surya-prasanna
status: open      # open | done
created: 2026-11-20 13:46
---

## What I need / what I'm handing off

Ethan sent a second design brief at 13:45 and asked me to hand more of it to Surya's agents (surya-prasanna, codex@surya). Full text: `docs/DESIGN_BRIEF.md`, "Part 2". It is a bright daytime redesign: no dark backgrounds anywhere, animal villagers, three vote-result screens, walking around, desktop full-window. **45 minutes to the 14:30 freeze**, so it is split into pieces that each land alone. Open your PR by **14:15**; whatever isn't ready then is dropped.

**I'm doing (claimed, branch `ethan/cozy-villagers`):**
- **[C1] Animal villagers** — redraw `app/town/Villager.tsx` as six original animal species with outfits, blink, bob, ejected reaction. **The props stay the same** (`color`, `mood`, `talking`, `size`, `ejected`): the species comes from the color, so your [V7] avatars and anything else using `<Villager>` change by themselves. Don't redraw it.
- **[C2] Daytime look everywhere** — `app/town/theme.css` + `app/town/town.css`: one bright palette (no dark mode, no dark tense mood), Fredoka rounded font in place of Alfa Slab One, chat posts as cream speech bubbles with a nameplate, pill buttons, less text on the start screen.

**For you (Open on the board, suggested owners):**
- **[C3] Vote results as three screens** — surya-prasanna. New `app/VoteResults.tsx` replacing the body of `Ejection` in `app/App.tsx`: (1) the result with an animation, (2) your vote: your pick or "Skip", (3) everyone's votes: `<Villager>` portraits with tallies, the majority highlighted. Smooth transitions, auto-advancing inside the engine's 10 s ejection phase (about 3 s each), tap to skip ahead. Bright background, not the dark spotlight (I am not restyling `.eject`; it is yours with this task). Reuse `voteResult(s)` for the wording. Respect `prefers-reduced-motion`.
- **[C4] Walk your villager around during intermissions** — surya-prasanna or codex@surya. A player villager in the square that moves with WASD / arrow keys and tap-to-move, only during the `event` and `ejection` phases (and never while typing in an input). New file `app/town/Walker.tsx` + its own css, mounted through `TownScene`'s `children` slot or one line in `TownScene.tsx`. Purely visual: no engine change. Lowest priority of the four; skip it if time is short.
- **[C5] Desktop fills the browser window** — codex@surya. At 900 px and wider: the town scene large on the left, the chat log and controls in a column on the right, full height, no page scroll. New stylesheet `app/town/desktop.css` imported after `theme.css` so it does not collide with my [C2] edits. Mobile unchanged.
- **[C6] Screenshot every screen** at 1440×900 and 375×812 after the merges (start, game, intermission, the three result screens, end), and list anything off under Missing — codex@surya, with [V9] / [L1].

Changes to what I handed you earlier:
- **[V11] scene polish:** skip the name-tag and bubble tweaks inside `Villager.tsx`; I'm redrawing it. The win-sunshine check still stands.
- **[V12] / README:** when [C2] merges, the font is Fredoka (OFL), not Alfa Slab One, and there is no dark mood any more. Please fix those lines in `README.md` and `docs/PITCH.md`.

## Context (files, branches, commits)

- Original work only: a bright cozy life-sim style of our own. Do not copy or imitate any existing game's characters, logos, art, UI or screens.
- Live site: https://172-232-188-135.sslip.io. I redeploy from Ethan's laptop after merges; last redeploy right after the freeze.

## What "done" looks like

[C3]–[C6] each merged or explicitly dropped by 14:30, with [C6]'s screenshots listed.
