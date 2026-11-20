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
| Game rows + stats (Managed PostgreSQL) | `db/`, `app/Stats.tsx` | open | Managed PostgreSQL; `saveGame()` called from `store/`'s save handler; stats handler mounted in `server/index.ts` |
| App: director (clock, who speaks when) + UI | `app/` | | engine via Commands, server via `/api/line` |

## Shared data formats

- `GameState`, `Character`, `Post`, `Clue`, `Ejection`, `Scenario`: see `shared/types.ts`.
- Character `role` and `tactics` are hidden: the UI shows them only after ejection or game over.
- `Post.to` set = a DM between the player and that character (both directions use the character's id).
- Model answers: JSON `{"text": "...", "cited": "source or null"}`; `parseLine()` turns it into a `say` command and fills the Source Check verdict.

## Events / messages between modules

- `Command` (UI/director → engine): `tick`, `post` (player), `say` (character), `use_tool`, `call_meeting`, `vote`.
- `POST /api/line` (app → server): body `{ state: GameState, charId: string, kind: "post" | "reply" | "defense", to?: string }` (`to` = the character's id when it's a DM reply). Answer `200` with a `say` Command as JSON, made by `parseLine(state, character, modelText, to)`, plus `check: RefereeCheck` (decision 002). The server runs `checkLine()` first; on a block it retries once, then answers `422 { check }`. Any non-200 (e.g. `503` = no model configured, `422` = blocked twice) makes the app fall back to scripted lines; the app calls it from `app/director.ts` and appends every `check` (or a `stage: "fallback"` entry) to its `refereeLog`, kept next to `GameState`, not inside it.
- `POST /api/replays` (app → server, once at `phase === "over"`): body `{ state: GameState, refereeLog: RefereeCheck[], classCode?: string, playerName?: string }`, ≤ 1 MB. Answer `200 { id: string, shareUrl: string | null }`. Writes Managed PostgreSQL rows via `db/` (schema: `docs/SPEC.md` §13) and uploads `replays/{id}.json` to Object Storage (§14). Handler lives in `store/` (ethanL30), calls `saveGame()` from `db/`; ethanL30's handoff sets the final shape.
- `GET /api/stats/global` → `GlobalStats` (cached 5 s). `GET /api/health` → `{ ok, inference, db, storage: "up" | "down" }`.
- New types (decision 002, additive only): `RefereeIssue`, `RefereeCheck`, `BotRadar`, `GlobalStats` in `shared/types.ts`; definitions in `docs/SPEC.md` §10.
- The server builds the messages with `buildPrompt(state, character, kind)`; model answers should be JSON `{"text": "...", "cited": "source or null"}`.
- In production the same server also serves the built game from `dist/` on `PORT` (`npm run build && npm start`; `npm start` runs `node server/index.ts`). In dev, Vite proxies `/api` to `http://localhost:8787`.
- Env vars (server only, never committed): model endpoint, key and model name for Akamai Cloud Inference, plus `PORT`. Names are the server owner's call; list them here.
- Proposed names for the decision-002 services (ethanL30 confirms the `S3_*` ones in `store/README.md`; the `db/` owner confirms `DATABASE_URL`): `DATABASE_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `PUBLIC_APP_URL`.
