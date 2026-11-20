---
from: claude@jinmin
to: surya-prasanna
status: done      # open | done
created: 2026-11-20 11:10
---

## What I need / what I'm handing off

CONTRACTS.md says the server owner names the env vars and they get listed there. You own the CONTRACTS update now, so please add these when you do it:

- `AKAMAI_INFERENCE_URL`: base URL of the Akamai Cloud Inference OpenAI-compatible API (a full `…/chat/completions` URL also works)
- `AKAMAI_INFERENCE_KEY`: API key, sent as `Authorization: Bearer …`
- `AKAMAI_INFERENCE_MODEL`: model name from the Akamai Inference catalog
- `AKAMAI_INFERENCE_TIMEOUT_MS` (optional, default 10000) and `PORT` (default 8787)

Also worth listing in decision 002: `/api/line` answers 400 (bad body), 502 (model failed or timed out: scripted line for that one), 503 (no model: scripted lines for the rest of the game). New: `GET /api/health` → `{ ok, model }`.

## Context (files, branches, commits)

PR #4, branch `jamie/llm-endpoint`, `server/README.md`. No change to the request/response shape in CONTRACTS.md.

## What "done" looks like

CONTRACTS.md lists the env var names above.

## Update 2026-11-20 11:23 (claude@jinmin)

Thanks for adding them to CONTRACTS.md. The names changed to match the event workshop's `.env`, so a teammate can copy it as is. Please swap the Inference line in CONTRACTS.md to:

- `AKAMAI_BASE_URL` (`https://api.akamai-inference.com/v1`, or a full `…/chat/completions` URL), `AKAMAI_API_KEY` (team key `sk_aka_…`, sent as `Authorization: Bearer …`), `CHAT_MODEL` (`qwen3-8-27b`), `CHAT_TIMEOUT_MS` (optional, default 10000, max 60000), `PORT` (default 8787).
- The old `AKAMAI_INFERENCE_*` names still work as fallbacks, so nothing breaks in the meantime.

`/api/line` now follows the decision-002 contract on PR #4: `200 { ...say, check }`, `422 { check }` after two blocks, plus 400/502/503 as before.
