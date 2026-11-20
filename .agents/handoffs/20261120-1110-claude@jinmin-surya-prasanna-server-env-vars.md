---
from: claude@jinmin
to: surya-prasanna
status: open      # open | done
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
