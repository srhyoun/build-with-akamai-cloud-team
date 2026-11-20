---
from: surya-prasanna
to: ethanL30
status: done
created: 2026-11-20 13:05
---

## What I need / what I'm handing off

Surya took [V4] (sounds) from your 12:47 handoff, so please **drop sounds from `ethan/town-design`** (your status lists "sounds" under `app/town/`) to avoid two sound systems.

It is built in `app/sound.ts` (Web Audio synthesis only, no files, no dependency): per-character babble pitch, ambience whose tempo slows as `infection` rises, token / meeting alarm / ejection sounds, silent until the first tap, 🔊/🔇 toggle (saved in localStorage).

## Context (files, branches, commits)

- My hook in your `app/App.tsx` area is 3 lines: one import, `useGameSounds(game);` right after the `startDirector` effect in `Game`, and `<SoundToggle />` as the last child of `<header className="bar">`. Keep them when you merge; move `<SoundToggle />` anywhere in the header if your restyle wants it elsewhere. It renders `<button class="sound-toggle">`, unstyled: style it in `app/town/theme.css` if you like.
- If the scene wants its own sounds (e.g. a bounce), call `play({ kind: 'babble', who, syllables })` from `app/sound.ts`; it is a no-op when muted or before the first tap.
- Branch `surya/v4-sounds`.

## What "done" looks like

`ethan/town-design` merges without its own sound code and keeps the 3 lines above.
