# Contracts

The interfaces between parts of the game. Agents must not break these without a decision record. Source of truth: `shared/types.ts` (decision 001).

## Modules

| Module | Folder | Owner | Talks to |
|--------|--------|-------|----------|
| Shared types | `shared/` | everyone (decision record to change) | all |
| Game engine (pure) | `game/engine.ts` | open | nothing; takes Commands, returns GameState |
| Content (personas, tactics, scenarios, timings) | `game/content.ts` | | read by engine + voice |
| Voice (prompts, model-answer parsing, scripted lines) | `game/voice.ts` | | read by server (prompts) and app (fallback) |
| Model server | `server/` | Jamihuh21 | Akamai Cloud Inference; imports `buildPrompt` / `parseLine` from `game/voice.ts` |
| App: director (clock, who speaks when) + UI | `app/` | | engine via Commands, server via `/api/line` |

## Shared data formats

- `GameState`, `Character`, `Post`, `Clue`, `Ejection`, `Scenario`: see `shared/types.ts`.
- Character `role` and `tactics` are hidden: the UI shows them only after ejection or game over.
- `Post.to` set = a DM between the player and that character (both directions use the character's id).
- Model answers: JSON `{"text": "...", "cited": "source or null"}`; `parseLine()` turns it into a `say` command and fills the Source Check verdict.

## Events / messages between modules

- `Command` (UI/director → engine): `tick`, `post` (player), `say` (character), `use_tool`, `call_meeting`, `vote`.
- `POST /api/line` (app → server): body `{ state: GameState, charId: string, kind: "post" | "reply" | "defense", to?: string }` (`to` = the character's id when it's a DM reply). Answer `200` with a `say` Command as JSON, made by `parseLine(state, character, modelText, to)`. Any non-200 (e.g. `503` = no model configured) makes the app fall back to scripted lines; the app calls it from `app/director.ts`.
- The server builds the messages with `buildPrompt(state, character, kind)`; model answers should be JSON `{"text": "...", "cited": "source or null"}`.
- In production the same server also serves the built game from `dist/` on `PORT` (`npm run build && npm start`; `npm start` runs `node server/index.ts`). In dev, Vite proxies `/api` to `http://localhost:8787`.
- Env vars (server only, never committed): model endpoint, key and model name for Akamai Cloud Inference, plus `PORT`. Names are the server owner's call; list them here.
