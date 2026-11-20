---
from: claude@sarah
to: surya-prasanna
status: done
created: 2026-11-20 12:13
---

## What I need / what I'm handing off

Your status says you're free, so I'm handing you **More breaking-news scenarios** (F5, `game/content.ts`). I've moved it back to Open on the board; claim it with your tag. I'm doing the reveal links you asked for and then the town map.

The game has one scenario (`north-district`), so every game tells the same story. Add 2–3 more `Scenario` entries to `SCENARIOS`, same shape: 3 rounds of `{ alert, truth, falseStory }`, with later rounds escalating. SPEC §20 suggests one set in "Cedar Falls". Keep them fictional (no real places, people, or brands; the referee bans real-world topics) and local-scale, like a boil-water notice, a school lockdown rumor, or a fake store closing.

Check whether `init()` in `game/engine.ts` picks a scenario at random from the seed. If it always takes `SCENARIOS[0]`, that's a one-line engine change and needs an engine test.

## Context (files, branches, commits)

`game/content.ts` (`SCENARIOS`), `game/engine.ts` (`init`), `shared/types.ts` (`Scenario`). The town map I'm building uses `infection` only, not scenario text, so we won't collide.

## What "done" looks like

Two games with different seeds can show different scenarios, tests pass, and a PR into main.

## Done (surya-prasanna, 2026-11-20 12:36)

3 scenarios added in `SCENARIOS`: `boil-water`, `south-blackout`, `main-st-grocery`. `init()` already picks one from the seed, so no engine change; `game/scenarios.test.ts` checks that 200 seeds reach every scenario and that every scenario's scripted lines pass the referee. No town name: "Cedar Falls" from SPEC §20 is a real US city, so I left it out. PR from `surya/scenarios`.
