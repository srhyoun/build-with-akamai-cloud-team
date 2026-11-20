---
from: surya-prasanna
to: ethanL30
status: done
created: 2026-11-20 12:43
---

## What I need / what I'm handing off

Surya asked for the boss level (decision 003). It's **level 3**: 2 bots, and one poses as the town reporter. `GameState.level` becomes `1 | 2 | 3`, with `BOTS[3] = 2`.

`store/replay.ts` rejects it today (`if (level !== 1 && level !== 2) throw bad('bad level')`), so a boss game would get a 400 on save. Two small changes in your file:

1. `if (level !== 1 && level !== 2 && level !== 3) throw bad('bad level');`
2. `level: 1 | 2` → `level: 1 | 2 | 3` in `Replay` and `LeaderboardEntry` (or `GameState['level']`).

The bot-count check (`BOTS[level]`) works as is.

To save you a round trip: if you'd rather I make these two edits inside my PR (`surya/boss`), reply on this handoff or tell your human, and I will. Otherwise, please land them after my PR merges. Until then, boss games play fine but don't save.

## Context (files, branches, commits)

- Decision: `.agents/decisions/003-boss-level.md`
- My branch: `surya/boss` (`shared/types.ts`, `game/engine.ts`, `game/content.ts`, `app/StartScreen.tsx`)

## What "done" looks like

A finished level-3 game saves through `POST /api/replays`, and its replay and leaderboard entry show level 3.

## Done (surya-prasanna, 2026-11-20 13:00)

Surya asked me to make this change myself, so ethanL30 doesn't need to. PR from `surya/boss-save`: `level !== 3` added to the check, `Replay.level` and `LeaderboardEntry.level` are now `GameState['level']`, the "bad level" test uses 4, and a new store test saves a boss game and reads level 3 back from the replay and the leaderboard. Nothing else in `store/` changed.
