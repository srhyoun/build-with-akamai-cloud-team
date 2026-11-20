# Contracts

The interfaces between parts of the game. Agents must not break these without a decision record. Source of truth: `shared/types.ts` (decision 001).

## Modules

| Module | Folder | Owner | Talks to |
|--------|--------|-------|----------|
| Shared types | `shared/` | everyone (decision record to change) | all |
| Game engine (pure) | `game/engine.ts` | open | nothing; takes Commands, returns GameState |
| Content (personas, tactics, scenarios, timings) | `game/content.ts` | | read by engine + voice |
| Voice (prompts, model-answer parsing, scripted lines) | `game/voice.ts` | | read by server (prompts) and app (fallback) |
| Referee (pure) | `game/referee.ts` | surya-prasanna | `checkLine()`; read by server (`/api/line`) and tests (decision 002) |
| Score + Bot Radar (pure) | `game/radar.ts` | surya-prasanna | read by app (reveal) and server (`/api/replays`) |
| Model server | `server/` (`index.ts`, `line.ts`) | claude@jinmin | Akamai Cloud Inference; imports `buildPrompt` / `parseLine` from `game/voice.ts`, `checkLine` from `game/referee.ts` |
| Replays + share (Object Storage) | `store/`, `app/share.ts`, `app/Share.tsx`, `app/Leaderboard.tsx` | ethanL30 | Object Storage; handler mounted by one line in `server/index.ts` (decision 002) |
| Game rows + stats (Managed PostgreSQL) | `db/`, `game/quiz.ts`, `app/Stats.tsx`, `app/stats.css`, `stats.html`, `app/Quiz.tsx`, `app/quiz.css`, `quiz.html` | surya-prasanna | Managed PostgreSQL. `db/db.ts` exports `saveGame` (for `hooks.saveGame` in `store/`), `handleDb(req, res)` (mounted in `server/index.ts`), `dbHealth()` → `'up'`, `'down'` or `'off'` |
| App: director (clock, who speaks when) + UI | `app/` | | engine via Commands, server via `/api/line` |

## Shared data formats

- `GameState`, `Character`, `Post`, `Clue`, `Ejection`, `Scenario`: see `shared/types.ts`.
- `GameState.level`: `1 | 2 | 3`; 3 = boss level (decision 003): 2 bots, one poses as the town reporter (`IMPOSTOR` vs the real `REPORTER` in `game/content.ts`). Replays and the leaderboard carry level 3 once `store/replay.ts` accepts it.
- Character `role` and `tactics` are hidden: the UI shows them only after ejection or game over.
- `Post.to` set = a DM between the player and that character (both directions use the character's id).
- Model answers: JSON `{"text": "...", "cited": "source or null"}`; `parseLine()` turns it into a `say` command and fills the Source Check verdict.

## Events / messages between modules

- `Command` (UI/director → engine): `tick`, `post` (player), `say` (character), `use_tool`, `call_meeting`, `vote`.
- `POST /api/line` (app → server): body `{ state: GameState, charId: string, kind: "post" | "reply" | "defense", to?: string }` (`to` = the character's id when it's a DM reply). Answer `200` with a `say` Command as JSON, made by `parseLine(state, character, modelText, to)`, plus `check: RefereeCheck` (decision 002). The server runs `checkLine()` first; on a block it retries once, then answers `422 { check }`. Any non-200 (e.g. `503` = no model configured, `422` = blocked twice) makes the app fall back to scripted lines; the app calls it from `app/director.ts` and appends every `check` (or a `stage: "fallback"` entry) to its `refereeLog`, kept next to `GameState`, not inside it.
- `POST /api/replays` (app → server, once at `phase === "over"`; handler `handleStore(req, res)` in `store/handler.ts`, ethanL30): body `{ state: GameState, refereeLog?: RefereeCheck[], classCode?: string, playerName?: string }`, ≤ 1 MB. Answer `200 { id: string, shareUrl: string | null, score: number }`; `400` bad shape or game not over, `413` too big, `429` too many saves. `shareUrl` = `<PUBLIC_APP_URL or request origin>/?replay=<id>`, `null` if the upload failed (app hides the QR). The app sends `refereeLog: getRefereeLog()` from `app/refereeLog.ts`.
- `GET /api/replays/:id` → `200 { replay: Replay, source: "object-storage" | "local" }`, `404` unknown id. `Replay` type in `store/replay.ts` (whitelisted public fields, no DMs). The bucket stays **private**; the server reads objects and passes them on.
- `GET /api/leaderboard` → `200 { entries: { id, name, score, result, level, infection, at }[], source }`, top 10 by score, cached 10 s.
- `db/` hook: `import { hooks } from '../store/handler.ts'; hooks.saveGame = saveGame;` called once per save with `{ id, state, refereeLog, classCode, playerName, score }`; if it throws, the replay is still uploaded. `storageHealth()` from `store/handler.ts` → `'up' | 'down'` for `/api/health`.
- `GET /api/stats/global` → `200 GlobalStats` (cached 5 s), `503` no database configured, `502` database unreachable. Page: `/stats.html` (its own Vite entry). `GET /api/health` → `{ ok, model, db?, storage? }`.
- `POST /api/quiz` (also in `handleDb`, surya-prasanna): body `{ sessionId: string (1-64 of [A-Za-z0-9_-]), phase: 'pre' | 'post', answers: { itemId, guess: 'bot' | 'human', confidence: 1-5 }[] }`, exactly one answer per item in `QUIZ` (`game/quiz.ts`), ≤ 8 KB. Scored on the server → `200 { correct, total }`; the first response per session + phase is stored, a retake is scored but not stored. `400` bad body, `503` no database, `502` database unreachable.
- `GET /api/quiz/results` → `200 QuizResults` (`db/db.ts`): `{ pre: { n, accuracy }, post: { n, accuracy }, paired: { n, pre, post, change } }`, accuracy 0-1 or `null` when n = 0, `change` = mean (post - pre) over sessions that did both. `503` / `502` as above. Page: `/quiz.html?phase=pre|post`, `?view=results` (its own Vite entry).
- `GET /api/stats/class/:code` (in `handleDb`): `200 ClassStats` (`db/db.ts`) = `GlobalStats` for games saved with that class code (case-insensitive) + `{ classCode, avgScore, players: { name, score, result }[] }` (top 100 by score), cached 5 s. `400` code empty, > 24 chars or with `/`; `503` / `502` as stats. Page: `/stats.html?class=<code>`. The app keeps the code in `app/classCode.ts` (`getClassCode()`, typed on the start screen or from a `/?class=<code>` link) and sends it as `classCode` on `POST /api/replays`.
- Tactic Codex (surya-prasanna): `/codex.html` (own Vite entry, `app/Codex.tsx`); `/codex.html#<TacticId>` scrolls to and highlights that tactic. Static: no API.
- New types (decision 002, additive only): `RefereeIssue`, `RefereeCheck`, `BotRadar`, `GlobalStats` in `shared/types.ts`; definitions in `docs/SPEC.md` §10.
- The server builds the messages with `buildPrompt(state, character, kind)`; model answers should be JSON `{"text": "...", "cited": "source or null"}`.
- In production the same server also serves the built game from `dist/` on `PORT` (`npm run build && npm start`; `npm start` runs `node server/index.ts`). In dev, Vite proxies `/api` to `http://localhost:8787`.
- Env vars (server only, never committed): model endpoint, key and model name for Akamai Cloud Inference, plus `PORT`. Names are the server owner's call; list them here.
- Inference (claude@jinmin, PR #4): `AKAMAI_INFERENCE_URL` (OpenAI-compatible base URL, or a full `…/chat/completions` URL), `AKAMAI_INFERENCE_KEY` (sent as `Authorization: Bearer …`), `AKAMAI_INFERENCE_MODEL`, `AKAMAI_INFERENCE_TIMEOUT_MS` (optional, default 10000), `PORT` (default 8787).
- `/api/line` status codes: `400` bad body, `422` blocked twice by the referee, `502` model failed or timed out (scripted line this once), `503` no model configured (scripted lines for the rest of the game).
- `GET /api/health` is served by `server/` (`{ ok, model }`); `db/` and `store/` add their `db` / `storage` fields to it.
- Database (`db/`, confirmed): the workshop's `PGHOST`, `PGPORT`, `PGUSER` (`akmadmin`), `PGPASSWORD`, `PGDATABASE` (`defaultdb`), or one `DATABASE_URL`. SSL is always on; optional `PG_CA_CERT_PATH` verifies the DB's CA, `PGSSLMODE=disable` turns SSL off (local Postgres only). Neither set → DB off. The Linode's IP must be on the DB's allowed-IP list.
- Object Storage (ethanL30, confirmed; details in `store/README.md`): `S3_ENDPOINT` (workshop bucket is in Chicago: `https://us-ord-10.linodeobjects.com`), `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, optional `S3_REGION` (default `us-east-1`) and `PUBLIC_APP_URL`. The workshop's `OBJ_*` names work too. With none set, `store/` saves to local files.
