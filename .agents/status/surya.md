# Status — Surya

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Surya
**Agent:** Claude Code (surya-prasanna)
**Branch:** `surya/db`
**Last updated:** 2026-11-20 12:35

## surya-prasanna

### Working on right now
P2 + P4 (db/ lane) done, PR open from `surya/db`. Waiting for Surya. Needs the humans to provision the Managed PostgreSQL DB and put the PG* vars in `.env` on the Linode.

### Files / folders I'm touching (hands off)
- `.agents/status/surya.md` (always mine)
- `docs/SPEC.md` (owner; changes by PR)
- `db/` (owner), `app/Stats.tsx`, `app/stats.css`, `stats.html`
- `game/referee.ts`, `game/radar.ts`, `app/UnderTheHood.tsx`, `app/refereeLog.ts` (owner)

### Just finished
- P2 + P4: `db/db.ts` (`saveGame` in one atomic SQL statement, `globalStats` cached 5 s, `dbHealth`, `handleDb` for GET /api/stats/global), `db/schema.sql` (auto-applied), `/stats.html` page. 8 tests run the real SQL on PGlite (Postgres in WASM). Checked the page in the browser with 14 simulated games. Deps: `pg`; dev: `@electric-sql/pglite`, `@types/pg`.
- R3 Under the Hood: `app/refereeLog.ts` (store: `logCheck`, `getRefereeLog`, `useRefereeLog`), director logs a check per line and runs `checkLine` in the browser when the server sends no `check` (blocked → scripted line), `app/UnderTheHood.tsx` drawer (names/rules hidden until game over). Tested in the browser with a fake model that leaks every 3rd line: leaks never reached the chat.
- R1 `game/referee.ts`: `checkLine()`, `blocked()`, `toCheck()`, 8 rules, 11 tests (incl. every scripted line passes). R2 `game/radar.ts`: `radar(state)` → score + Bot Radar, 6 tests. 4 decision-002 types in `shared/types.ts`. CONTRACTS: claude@jinmin's env vars + status codes.
- `docs/SPEC.md` (build spec aligned with decision 001), decision 002 (Managed PostgreSQL + Object Storage + referee), CONTRACTS.md updated, spec tasks added to BOARD Open.
- Setup: npm install + npm test (10/10 pass), read AGENTS.md and every coordination file.

### Missing / I need from someone
- claude@jinmin: mount `handleDb`, register `hooks.saveGame = saveGame`, add `db: await dbHealth()` to /api/health (handoff 20261120-1235).
- Humans: create the Managed PostgreSQL cluster, allow the Linode's IP, put PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE in `.env` on the Linode.
- Whoever owns `game/voice.ts`: tactic tags on model lines (BOARD Missing).

### Heads up for other agents
- My tag is `surya-prasanna`. Branches will be `surya/<short-task>`.

## codex@surya

### Working on right now
StatusPill on `surya/status-pill`. The board claim is on main.

### Files / folders I'm touching (hands off)
- `app/StatusPill.tsx` and `app/status-pill.css`.
- `app/App.tsx`: one import and one render in the shared game header, per Surya.
- Only this section of `.agents/status/surya.md`.

### Missing / I need from someone
- claude@jinmin: add the existing DB and Storage health checks to `/api/health` when the service branches are available. Missing fields will display as unknown.
