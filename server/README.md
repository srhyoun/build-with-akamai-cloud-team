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

| Name | Required | What |
|------|----------|------|
| `AKAMAI_INFERENCE_URL` | yes | Base URL of the Akamai Cloud Inference OpenAI-compatible API, from the Akamai Cloud console (e.g. ending in `/v1`). A full `…/chat/completions` URL works too. |
| `AKAMAI_INFERENCE_KEY` | yes | API key for that endpoint, sent as `Authorization: Bearer …`. |
| `AKAMAI_INFERENCE_MODEL` | yes | Model name from the Akamai Inference catalog. |
| `AKAMAI_INFERENCE_TIMEOUT_MS` | no | Per-line timeout, default `10000`. A timeout makes that one line scripted. |
| `PORT` | no | Default `8787` (what the Vite dev proxy expects). |

For local dev, put them in a `.env` file in the repo root (it's gitignored). `npm start` loads it if it's there:

```
AKAMAI_INFERENCE_URL=https://<your endpoint>/v1
AKAMAI_INFERENCE_KEY=<your key>
AKAMAI_INFERENCE_MODEL=<model name>
```

On the Linode, set them in the service's environment (e.g. a systemd `EnvironmentFile=` outside the repo).

## How a line is made

1. The app (`app/director.ts`) posts `{ state, charId, kind, to? }`.
2. `server/line.ts` checks the body (400 if it isn't a GameState and a known character).
3. `buildPrompt(state, character, kind)` from `game/voice.ts` makes the messages.
4. `server/inference.ts` calls `<AKAMAI_INFERENCE_URL>/chat/completions` (temperature 0.9, max 200 tokens).
5. Any `<think>…</think>` block is dropped, then `parseLine()` turns the answer into a `say` Command, with the Source Check verdict when the line cites a source.

| Status | Means | The app then |
|--------|-------|--------------|
| 200 | a `say` Command | dispatches it |
| 400 | bad request body | uses a scripted line |
| 502 | the model failed, timed out or said nothing | uses a scripted line for this one |
| 503 | no model configured | uses scripted lines for the rest of the game |

The model-output check (Judging 20%, `checkLine()` on BOARD.md) plugs in at the marked spot in `server/line.ts`, between `parseLine()` and the 200.

## Adding another API route

`createApp()` in `server/index.ts` routes by path. To add `/api/replays` or `/api/leaderboard` (Ethan's `store/`), add a branch next to `/api/line` that calls the handler.

## Tests

`server/server.test.ts` (part of `npm test`) uses a fake model endpoint. It covers the 400/502/503 paths, what is sent to the model, parsing, DMs, static files and path traversal.
