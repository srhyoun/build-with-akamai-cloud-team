# Status — Surya

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Surya
**Agent:** Claude Code (surya-prasanna)
**Branch:** `surya/quiz`
**Last updated:** 2026-11-20 11:45

## surya-prasanna

### Working on right now
P7 pre/post quiz merged into main (PR #15). Next per claude@sarah's plan: Tactic Codex screen.

### Files / folders I'm touching (hands off)
- `.agents/status/surya.md` (always mine)
- `docs/SPEC.md` (owner; changes by PR)
- `db/` (owner), `app/Stats.tsx`, `app/stats.css`, `stats.html`
- `game/quiz.ts`, `app/Quiz.tsx`, `app/quiz.css`, `quiz.html`, one line in `vite.config.ts` (quiz entry)
- `game/referee.ts`, `game/radar.ts`, `app/UnderTheHood.tsx`, `app/refereeLog.ts` (owner)

### Just finished
- P7 quiz: `game/quiz.ts` (6 fictional items, 3 bot tactics + 3 humans, `scoreQuiz`), `quiz_responses` table, `POST /api/quiz` (strict validation, server-side scoring, first response per session + phase counts) and `GET /api/quiz/results` (pre/post accuracy with n, paired change) in `handleDb`, page `/quiz.html?phase=pre|post` and `?view=results`. 7 new tests (SQL on PGlite, every item passes `checkLine`). Browser-checked at 375 px, light + dark, on a throwaway PGlite server.
- P2 + P4: `db/db.ts` (`saveGame` in one atomic SQL statement, `globalStats` cached 5 s, `dbHealth`, `handleDb` for GET /api/stats/global), `db/schema.sql` (auto-applied), `/stats.html` page. 8 tests run the real SQL on PGlite (Postgres in WASM). Checked the page in the browser with 14 simulated games. Deps: `pg`; dev: `@electric-sql/pglite`, `@types/pg`.
- R3 Under the Hood: `app/refereeLog.ts` (store: `logCheck`, `getRefereeLog`, `useRefereeLog`), director logs a check per line and runs `checkLine` in the browser when the server sends no `check` (blocked → scripted line), `app/UnderTheHood.tsx` drawer (names/rules hidden until game over). Tested in the browser with a fake model that leaks every 3rd line: leaks never reached the chat.
- R1 `game/referee.ts`: `checkLine()`, `blocked()`, `toCheck()`, 8 rules, 11 tests (incl. every scripted line passes). R2 `game/radar.ts`: `radar(state)` → score + Bot Radar, 6 tests. 4 decision-002 types in `shared/types.ts`. CONTRACTS: claude@jinmin's env vars + status codes.
- `docs/SPEC.md` (build spec aligned with decision 001), decision 002 (Managed PostgreSQL + Object Storage + referee), CONTRACTS.md updated, spec tasks added to BOARD Open.
- Setup: npm install + npm test (10/10 pass), read AGENTS.md and every coordination file.

### Missing / I need from someone
- Someone with the app screens (start / reveal): a link to `/quiz.html?phase=pre` before playing and `?phase=post` after. Not done by me: `app/App.tsx` is off-limits for this task.
- Humans: run the quiz on 5–10 people once the DB is live; `/quiz.html?view=results` shows the real n.
- claude@jinmin: mount `handleDb`, register `hooks.saveGame = saveGame`, add `db: await dbHealth()` to /api/health (handoff 20261120-1235).
- Humans: create the Managed PostgreSQL cluster, allow the Linode's IP, put PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE in `.env` on the Linode.
- Whoever owns `game/voice.ts`: tactic tags on model lines (BOARD Missing).

### Heads up for other agents
- My tag is `surya-prasanna`. Branches will be `surya/<short-task>`.
