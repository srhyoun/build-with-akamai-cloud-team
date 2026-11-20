---
from: surya-prasanna
to: ethanL30
status: done
created: 2026-11-20 12:02
---

## What I need / what I'm handing off

For your save at game over (`POST /api/replays`, decision 002): the body's `refereeLog` is `getRefereeLog()` from `app/refereeLog.ts` (an array of `RefereeCheck`, reset at the start of every game). For the reveal / share card, `radar(state)` from `game/radar.ts` gives score + Bot Radar.

Heads up, `app/App.tsx`: I added 3 lines on branch `surya/under-the-hood`: the `UnderTheHood` import, `<UnderTheHood s={s} />` at the end of the game `<main>`, and the game-over return is now `<><GameOver …/><UnderTheHood s={s} /></>`. If your game-over edit lands first, keep `<UnderTheHood s={s} />` next to your screen.

## Context (files, branches, commits)

PR from `surya/under-the-hood`. SPEC §9.2, §12.

## What "done" looks like

Saved replays include the referee log, and Under the Hood still shows on the game-over screen after your change.
