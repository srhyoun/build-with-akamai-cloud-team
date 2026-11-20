# Status — Surya

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Surya
**Agent:** Claude Code (surya-prasanna)
**Branch:** `surya/boss-save`
**Last updated:** 2026-11-20 13:04

## surya-prasanna

### Working on right now
Boss level fully on main (PR #31 game, PR #34 save path). Nothing claimed; free for the next task.

### Files / folders I'm touching (hands off)
- `.agents/status/surya.md` (always mine)
- `docs/SPEC.md` (owner; changes by PR)
- `db/` (owner), `app/Stats.tsx`, `app/stats.css`, `stats.html`
- `SCENARIOS` in `game/content.ts` (handed over by claude@sarah)
- `app/classCode.ts` (new); class-code field in `app/StartScreen.tsx`
- `app/Codex.tsx`, `app/codex.css`, `codex.html`; one link row in `app/StartScreen.tsx` (codex@jamie's, done)
- `game/quiz.ts`, `app/Quiz.tsx`, `app/quiz.css`, `quiz.html`, one line in `vite.config.ts` (quiz entry)
- `game/referee.ts`, `game/radar.ts`, `app/UnderTheHood.tsx`, `app/refereeLog.ts` (owner)

### Just finished
- Boss level (level 3, decision 003): `REPORTER` + `IMPOSTOR` personas, `init(seed, 3)` always makes the impostor a bot and the real reporter human, impostor's Account Age reads "Joined 2 days ago · same name and photo as @DanaReports", impostor frames the real reporter. Levels 1 and 2 unchanged (same games per seed). 4 tests; played in the browser.
- 3 more scenarios (boil-water notice, south-side blackout, Main St grocery closing), 3 rounds each, escalating. Tests over every scenario: unique ids, no banned terms, every seed range reaches each one, scripted lines pass the referee, a human repeating the false story is caught (that caught one wording bug). Seen in the browser: a boil-water game with scripted lines.
- End-to-end check on main after ethanL30's #25 and claude@sarah's #26: a Level 1 game started from `/?class=7b`, saved from the reveal as "Ada", shows up in `GET /api/stats/class/7b` (1 game, player Ada); the reveal links to `/codex.html#<tactic>` and `/quiz.html?phase=post`. Throwaway server with the real store/ + db/ handlers on PGlite, local files outside the repo.
- Under the Hood hides (drawer + toggle) during the meeting, so it can't cover the vote buttons; `useRefereeLog` got a server snapshot so it renders in tests. Checked in a real game at 375 px: all 7 vote buttons clickable with the drawer opened beforehand, drawer back after the meeting.
- Class dashboard: `app/classCode.ts` (code from the start screen or a `/?class=` link, kept in localStorage), class-code field on the start screen, `GET /api/stats/class/:code` (same stats query filtered by class + avg score + players), `/stats.html?class=7B`. 4 new tests; browser-checked at 375 px with 5 simulated class games.
- Tactic Codex: `/codex.html` (`app/Codex.tsx`), six tactics with example, how to spot it, counter tool and what it shows; `#<tacticId>` anchors; links to Codex + pre-quiz on the start screen. Render test; browser-checked at 375 px.
- P7 quiz: `game/quiz.ts` (6 fictional items, 3 bot tactics + 3 humans, `scoreQuiz`), `quiz_responses` table, `POST /api/quiz` (strict validation, server-side scoring, first response per session + phase counts) and `GET /api/quiz/results` (pre/post accuracy with n, paired change) in `handleDb`, page `/quiz.html?phase=pre|post` and `?view=results`. 7 new tests (SQL on PGlite, every item passes `checkLine`). Browser-checked at 375 px, light + dark, on a throwaway PGlite server.
- P2 + P4: `db/db.ts` (`saveGame` in one atomic SQL statement, `globalStats` cached 5 s, `dbHealth`, `handleDb` for GET /api/stats/global), `db/schema.sql` (auto-applied), `/stats.html` page. 8 tests run the real SQL on PGlite (Postgres in WASM). Checked the page in the browser with 14 simulated games. Deps: `pg`; dev: `@electric-sql/pglite`, `@types/pg`.
- R3 Under the Hood: `app/refereeLog.ts` (store: `logCheck`, `getRefereeLog`, `useRefereeLog`), director logs a check per line and runs `checkLine` in the browser when the server sends no `check` (blocked → scripted line), `app/UnderTheHood.tsx` drawer (names/rules hidden until game over). Tested in the browser with a fake model that leaks every 3rd line: leaks never reached the chat.
- R1 `game/referee.ts`: `checkLine()`, `blocked()`, `toCheck()`, 8 rules, 11 tests (incl. every scripted line passes). R2 `game/radar.ts`: `radar(state)` → score + Bot Radar, 6 tests. 4 decision-002 types in `shared/types.ts`. CONTRACTS: claude@jinmin's env vars + status codes.
- `docs/SPEC.md` (build spec aligned with decision 001), decision 002 (Managed PostgreSQL + Object Storage + referee), CONTRACTS.md updated, spec tasks added to BOARD Open.
- Setup: npm install + npm test (10/10 pass), read AGENTS.md and every coordination file.

### Missing / I need from someone
- Humans: run the quiz on 5–10 people once the DB is live; `/quiz.html?view=results` shows the real n.
- Humans: create the Managed PostgreSQL cluster, allow the Linode's IP, put PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE in `.env` on the Linode.

### Heads up for other agents
- My tag is `surya-prasanna`. Branches will be `surya/<short-task>`.

## codex@surya

### Working on right now
- [V11] Scene polish complete on `surya/scene-polish`, ready for review.
- Offline demo launcher complete on `surya/offline-demo`. V9 physical-phone testing remains in the separate QA draft (#43).

### Files / folders I own for this task
- `app/town/TownScene.tsx`, `app/town/scene-labels.css`, `app/town/town.test.tsx`, and coordination entries. V10 owns `app/town/town.css`.

### Just finished
- [V11] Build and all 6 town tests passed. Chrome verified full handles and attached bubbles at 320, 375, and 768 px, then showed full sunshine after a Level 1 win at 20% infection. Bubbles stayed inside the merged V10 DM strip. Windows suite: 130 passes and the 2 known server failures.
- Offline demo launcher: type-check and production build passed. Chrome at 375 px completed a game, saved it, and opened the local replay. A launcher smoke test verified all built entries, no cloud calls with dummy credentials, and cleanup on shutdown. Windows suite: 125 passed with the two known server failures.
- End-to-end local demo QA on main at `8ac42b0`. Chrome passed the Level 2 game, reveal, replay and QR render, leaderboard, global and class stats, paired quiz, Codex anchor, and service health.
- Retested class persistence and reveal navigation after the fixes merged. Production build passed. The Windows suite passed 107/109 with two existing server platform failures.
- StatusPill shipped in PR #17. The server health fields were mounted in PR #19.

### Missing / I need from someone
- claude@sarah: the reveal can retain the last chat scroll position. See the reveal-scroll handoff for the 375 px repro.
- surya-prasanna: align Stats copy with its assigned-tactic sample or update the metric. The repro is in the demo QA handoff.
- Deployment owners: verify the same flow against the deployed Managed PostgreSQL and Object Storage services.
