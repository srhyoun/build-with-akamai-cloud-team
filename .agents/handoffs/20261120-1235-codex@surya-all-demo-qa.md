---
from: codex@surya
to: all
status: open
created: 2026-11-20 12:35
---

## What I need / what I'm handing off

**The local demo flow passes on main at `8ac42b0`.** At 375 px in Chrome, I took the pre-quiz, entered class code `QA-7B`, started Level 2, used Account Age and sent a DM, then played all three rounds through meetings and ejections. The reveal showed Bot Radar and tagged lines. Under the Hood hid during voting and revealed details after the game.

- Saving the game rendered a QR and a share URL. I followed the URL to the replay. Its API payload contained three tactic-tagged public posts and excluded the test DM. The same save appeared on the leaderboard and both global and class stats.
- The reveal's after-quiz link opened the post quiz, and Results showed one paired response in the isolated database. A Codex tactic anchor opened the correct card.
- The health route showed Inference Off, DB Up and Storage Up with the local database and file storage. Without a database it showed DB Off and the stats and quiz-results APIs returned HTTP 503. A separate simulated Inference response verified that a role leak was blocked, the retry passed, and the returned line included its tactic tag and referee scores.
- In the earlier snapshot `389858d`, the class dashboard stayed empty after save and the reveal lacked quiz and Codex links. I retested both after PRs #25 and #26 merged and confirmed the class game, player row, and reveal links.

### Remaining findings

1. **Stats wording suggests actual uses, while SQL counts rounds with a tactic assigned.** The fresh test game on `8ac42b0` reported emotional outrage at `n = 6` and fake consensus at `n = 3` even though neither had a tagged public bot round. Coordinated amplification reported `n = 6` for three tagged public bot rounds. The board says “Bots using it,” and §13 describes the assigned-tactic method from before model tagging shipped. `surya-prasanna` owns the metric and copy.
2. **Live cloud verification remains with deployment.** This run used in-memory PGlite and temporary file storage. Storage Up can appear in local mode, so the replay source and configured bucket need checking on the deployed URL before the cloud-service demo.
3. **Two server tests fail on Windows.** The unreadable-file test gets 200 where it expects 500, and the symlink test gets EPERM. The production build, browser run and 107 of 109 automated tests passed. The two server failures also reproduced on a clean checkout of main during the earlier StatusPill work.

## Context (files, branches, commits)

QA branch `surya/demo-qa`. Product code is from `8ac42b0`; the mount candidate was verified separately at `44dd5b7`. The game clock was accelerated in the QA browser. All responses and saved games were test data in a temporary checkout and were deleted after the run.

To reproduce the stats wording issue, finish and save a game using a fresh test database. Compare `GET /api/stats/global` tactic `uses` with the tagged public bot rounds in that same database:

```sql
SELECT tactic, count(DISTINCT (game_id, author, round)) AS tagged_public_bot_rounds
FROM posts
WHERE role = 'bot' AND tactic IS NOT NULL AND NOT is_dm
GROUP BY tactic;
```

A tactic can have a nonzero `uses` value and no row in this query. `db/db.ts` builds the sample from `characters.tactics`, while `app/Stats.tsx` labels the result as use.

## What "done" looks like

The tactic labels describe their actual sample. The deployed demo is verified with Managed PostgreSQL and the private Object Storage bucket. Local playthrough QA is complete.


## Finding 1 handled by surya-prasanna (13:58)

Tactic stats now come from tagged public bot posts: one count per game, bot, round and tactic, DMs excluded (`db/db.ts` STATS, test in `db/db.test.ts`). Copy on `/stats.html` and SPEC §13 say so. Findings 2 (live cloud verification) and 3 (Windows server tests) are not mine, so this handoff stays open.
