# server/

The small Node server behind Who's the Bot? Owner: claude@jinmin (Jamie).

- `POST /api/line`: one character line from **Akamai Cloud Inference**. Contract in `.agents/CONTRACTS.md`.
- `GET /api/health`: `{ ok, model, db, storage }`: model name or null, `db` = `up`/`down`/`off`, `storage` = `up`/`down`.
- Mounted from other folders: `/api/replays` + `/api/leaderboard` (`store/`, Object Storage, ethanL30) and `/api/stats/global` (`db/`, Managed PostgreSQL, surya-prasanna). Every saved replay also goes to `saveGame()` in `db/`.
- Everything else: the built game from `dist/` (production). Client routes like `/?replay=…` get `index.html`.

The key stays on the server. The browser never sees it.

## Run it

```
npm run dev     # terminal 1: the game on http://localhost:5173 (Vite proxies /api to :8787)
npm start       # terminal 2: this server on :8787
```

Production on a Linode: `npm run build && npm start`. That serves the game and the API on `PORT`.

With no model configured, `/api/line` answers `503` and the game plays with scripted lines.

## Settings (env vars, never committed)

The same names as the event workshop's `.env` ([akamai-workshop-seattle-hackathon](https://github.com/akamai-developers/akamai-workshop-seattle-hackathon), `.env.example`), so you can copy its Inference block as is.

| Name | Required | What |
|------|----------|------|
| `AKAMAI_BASE_URL` | yes | `https://api.akamai-inference.com/v1` (must end in `/v1`; a full `…/chat/completions` URL works too) |
| `AKAMAI_API_KEY` | yes | The team key from event staff, starts with `sk_aka_`. Sent as `Authorization: Bearer …`. |
| `CHAT_MODEL` | yes | `qwen3-8-27b`. Event keys only work with `qwen3-8-27b`, `gemma-4-26b-a4b-it`, `qwen3-embedding-8b`. |
| `CHAT_TIMEOUT_MS` | no | Per-line timeout, default `10000`, max `60000`. A timeout makes that one line scripted. |
| `PORT` | no | Default `8787` (what the Vite dev proxy expects). `0` = any free port. |

For local dev, put them in a `.env` file in the repo root (it's gitignored). `npm start` loads it if it's there:

```
AKAMAI_BASE_URL=https://api.akamai-inference.com/v1
AKAMAI_API_KEY=<team key, sk_aka_…>
CHAT_MODEL=qwen3-8-27b
```

The first-version names `AKAMAI_INFERENCE_URL` / `_KEY` / `_MODEL` / `_TIMEOUT_MS` still work, but use the workshop names. No quotes, no comments after a value. On the Linode, set them in the service's environment (e.g. a systemd `EnvironmentFile=` outside the repo). The startup log says which setting is missing or malformed, never the key itself.

## How a line is made

1. The app (`app/director.ts`) posts `{ state, charId, kind, to? }`.
2. `server/line.ts` checks the body (400 if it isn't a GameState and a known character), then cleans untrusted text: player posts and DMs ≤ 300 chars with no control characters (SPEC §8 rule 8), persona and scenario fields capped too.
3. `buildPrompt(state, character, kind)` from `game/voice.ts` makes the messages.
4. `server/inference.ts` calls `<AKAMAI_BASE_URL>/chat/completions` with `max_tokens` 300, temperature 0.9, and **structured output**: `response_format` = the `{ text: string, cited: string | null }` JSON schema (`LINE_SCHEMA` in `server/line.ts`). If the endpoint refuses `response_format` (400/422), it retries once without it and stops sending it for the rest of the process. For Qwen3 models it adds `/no_think`, so the model doesn't spend the token budget thinking.
5. Format checks: an answer cut off by `max_tokens` (`finish_reason: "length"`) or with no text is retried once. `<think>` blocks (closed, unclosed or a lone `</think>`) are dropped, `parseLine()` turns the JSON into a `say` Command, and a `cited` of `"null"`/`"none"` is dropped so Source Check can't flag a source nobody cited.
6. **Referee** (Judging 20%, decision 002): `checkLine()` from `game/referee.ts` runs on every model line. It blocks a bot confessing, a human pushing the false story, AI/model leaks, banned real-world topics and empty lines, and warns on length and fourth-wall breaks. Blocked → one retry, with a note telling the model what was wrong → blocked again = `422 { check }`. Passed → `200 { ...say, check }`, cut to 220 chars (200 for a defense) if `R_LENGTH` warned. Then the **referee model** (I3, `server/refereeModel.ts`, SPEC §8.1) grades the line with a second call: issues (`MODEL_ROLE_LEAK`, `MODEL_REAL_WORLD`, …) and 1–5 scores for bot subtlety, human realism and tactic clarity. Its blocks count for posts and defenses (same retry → 422); on DMs they're logged as warnings only. If the referee call fails or takes over 4 s, the line goes out on the rules alone. In a live game (several characters talking at once) about half the referee calls hit that 4 s cap, so roughly half the lines show scores; lines take 4.5–7 s. The app shows every `check`, with scores, in Under the Hood.

| Status | Means | The app then |
|--------|-------|--------------|
| 200 | a `say` Command plus `check` (the referee's verdict) | logs the check, dispatches the line |
| 400 | bad request body | uses a scripted line |
| 422 | `{ check }`: the referee blocked the line twice | logs the check, uses a scripted line |
| 429 | this player IP asked for more than 40 lines this minute | uses a scripted line |
| 502 | the model failed, timed out, hit the shared per-minute token budget (429), was cut off, or said nothing | uses a scripted line for this one |
| 503 | no model configured | uses scripted lines for the rest of the game |

**Rate limit:** 40 `/api/line` calls a minute per player IP (`429`, then the app uses a scripted line). Behind Caddy, the IP comes from `X-Forwarded-For`, trusted only from localhost. It's in memory and per process. Anyone can still spend some of the team's token budget, so don't leave it up after the event.

## Adding another API route

`createApp()` in `server/index.ts` routes by path. Ethan's `store/` (`/api/replays`, `/api/leaderboard`) gets mounted with `if (await handleStore(req, res)) return;` before the `/api/` 404 once `ethan/replay-storage` is on main; the `db/` handler the same way.

## Tests

`server/server.test.ts` (part of `npm test`, 23 tests) uses a fake model endpoint: env names and validation, 400/413/405/502/503, the schema and `/no_think` that go to the model, referee pass / retry-with-reason / 422 / shortening, player-text cleaning, the old env names, the response_format fallback, cut-off and thinking-only answers, a real timeout, the key never being logged, static files (HEAD, unreadable file = 500, path traversal), and starting `node server/index.ts` through a symlinked path.
