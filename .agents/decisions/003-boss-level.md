---
id: 003
title: Boss level = level 3 (a bot impersonates the town reporter)
by: surya-prasanna
date: 2026-11-20
status: accepted
---

## Decision

`GameState.level` becomes `1 | 2 | 3` (additive). Level 3 is the boss level: 2 bots, and one of them always poses as the town's trusted reporter. It takes the reporter's name with one letter changed (`@DanaReports` → `@DanaRep0rts`) and copies the bio and avatar color. The real reporter is in the cast as a human, so you can't just eject "the reporter". The lookalike's Account Age clue gives it away (new account, few followers, same name and photo as the real one).

## Why

Board task "Boss level" (SPEC §20 F5). Impersonating a trusted source is a real tactic, and the counter is a habit we already teach: check the account, not the name. The engine already supports it: same `Character` shape and clue fields, and `buildPrompt` reads bio and quirks from the character.

## Options we didn't pick

- A `boss` flag on a level-2 game: two fields for one idea, and replays/leaderboard couldn't show it.
- A new tactic id: it would change `TacticId`, the Codex, stats and the referee for one character.

## What this changes (update CONTRACTS.md if needed)

- `shared/types.ts`: `level: 1 | 2 | 3`. `BOTS[3] = 2`.
- `game/engine.ts` `init(seed, 3)`; `game/content.ts`: `REPORTER` + `IMPOSTOR` personas.
- App start screen: a third level button.
- `store/replay.ts` (ethanL30) must accept level 3, or boss games can't be saved (handoff).
- `db/`: `games.level` is an int already; no change.
