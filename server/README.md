# server/

The small Node server behind Who's the Bot? Owner: claude@jinmin (Jamie).

- `POST /api/line`: one character line from **Akamai Cloud Inference**. Contract in `.agents/CONTRACTS.md`.
- `GET /api/health`: `{ "ok": true, "model": "<model name or null>" }`. Shows whether a model is configured.
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

No quotes, no comments after a value. On the Linode, set them in the service's environment (e.g. a systemd `EnvironmentFile=` outside the repo). The startup log says which setting is missing or malformed, never the key itself.

## How a line is made

1. The app (`app/director.ts`) posts `{ state, charId, kind, to? }`.
2. `server/line.ts` checks the body (400 if it isn't a GameState and a known character).
3. `buildPrompt(state, character, kind)` from `game/voice.ts` makes the messages.
4. `server/inference.ts` calls `<AKAMAI_BASE_URL>/chat/completions` with `max_tokens` 300, temperature 0.9, and **structured output**: `response_format` = the `{ text: string, cited: string | null }` JSON schema (`LINE_SCHEMA` in `server/line.ts`). If the endpoint refuses `response_format` (400/422), it retries once without it and stops sending it for the rest of the process. For Qwen3 models it adds `/no_think`, so the model doesn't spend the token budget thinking.
5. Output checks before anything reaches the player: an answer cut off by `max_tokens` (`finish_reason: "length"`) is rejected, `<think>` blocks (closed, unclosed or a lone `</think>`) are dropped, `parseLine()` turns the JSON into a `say` Command, an empty line is rejected, and a `cited` of `"null"`/`"none"` is dropped so Source Check can't flag a source nobody cited. Any rejection = 502 = a scripted line for that one turn.

| Status | Means | The app then |
|--------|-------|--------------|
| 200 | a `say` Command | dispatches it |
| 400 | bad request body | uses a scripted line |
| 502 | the model failed, timed out, hit the shared per-minute token budget (429), was cut off, or said nothing | uses a scripted line for this one |
| 503 | no model configured | uses scripted lines for the rest of the game |

The content check (Judging 20%, `checkLine()` on BOARD.md: bot never admits it's a bot, human never pushes the false story, stays in persona) plugs in at the marked spot in `server/line.ts`, between these format checks and the 200.

Anyone who can reach `/api/line` can spend the team's token budget (up to 300 tokens a call). Fine for the demo; don't leave it up after the event.

## Adding another API route

`createApp()` in `server/index.ts` routes by path. To add `/api/replays` or `/api/leaderboard` (Ethan's `store/`), add a branch next to `/api/line` that calls the handler.

## Tests

`server/server.test.ts` (part of `npm test`, 17 tests) uses a fake model endpoint: env names and validation, 400/413/405/502/503, the schema and `/no_think` that go to the model, the response_format fallback, cut-off and thinking-only answers, a real timeout, the key never being logged, static files (HEAD, unreadable file = 500, path traversal), and starting `node server/index.ts` through a symlinked path.
