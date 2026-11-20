---
from: claude@jinmin
to: all
status: done      # open | done
created: 2026-11-20 11:19
---

## What I need / what I'm handing off

Two bugs found in a review of `server/` that sit outside `server/`, plus facts from the organisers' workshop guide that change other lanes. The `server/` findings already went to the server/ owner directly.

**1. `game/voice.ts` (no owner yet; fits "Tune character prompts" on the board)**
- Line 34: the prompt says `"cited": "a source you cite, or null"`, with null inside quotes. Line 42: `parseLine` treats any truthy string as a citation. A model answer of `{"text":"hi all","cited":"null"}` gets a source with a "no such source found" verdict, so Source Check flags an innocent line. Confirmed with a script.
  - Fix: map `"null"`, `"none"` and `""` to null in `parseLine`, and write `"cited": null` without quotes in the prompt.
- Model lines never carry `tactic`, so the replay can't tag bot posts written by the model. This follows from the contract; it changes only if someone wants model posts tagged.

**2. `tsconfig.json` (shared)**
- There's no `verbatimModuleSyntax`. If someone imports a type without `import type`, tsc and vitest still pass, but `npm start` fails under Node's type stripping ("does not provide an export named …"). Today's code is fine.
  - Fix: add `"verbatimModuleSyntax": true`, plus a test that starts `node server/index.ts` and checks `/api/health`.

**3. Workshop facts** (https://github.com/akamai-developers/akamai-workshop-seattle-hackathon: `WORKSHOP.md`, `.env.example`, `docs/judging.md`)
- **Team size:** `docs/judging.md` says "Teams have up to 3 people." We're four. Humans still need to decide (already under Missing on the board).
- **Inference:** base URL `https://api.akamai-inference.com/v1`, chat model `qwen3-8-27b`; the team key (starts `sk_aka_`) comes from event staff. The workshop `.env` names are `AKAMAI_BASE_URL` / `AKAMAI_API_KEY` / `CHAT_MODEL`, not our `AKAMAI_INFERENCE_*`. I asked the server/ owner to accept both.
- **Deploy (P1 / DEPLOY.md owner):**
  - The workshop Linode is a Nanode 1 GB, Ubuntu 24.04, in Seattle (`us-sea`).
  - Its cloud-init installs `uv` (Python), not Node. We need Node ≥ 24 (`npm start` runs TypeScript directly).
  - Its firewall opens only ports 22 and 80, but our server defaults to `PORT=8787`. Set `PORT=80` or open 8787.
  - A stopped Linode still bills.
- **PostgreSQL (`db/` owner):** the workshop names are `PGHOST`, `PGPORT`, `PGUSER=akmadmin`, `PGPASSWORD`, `PGDATABASE=defaultdb`, `PGSSLMODE=require`.
- **Judging:**
  - Show the feature that uses each service; a resource in Cloud Manager isn't enough on its own.
  - Explain why we chose the model, and check its answers against known results, including an input it can't answer.
  - `docs/judging.md` has a README template: user and task, benefit, services, inference, technical choice, idea, demo, known limits.

## Context (files, branches, commits)

- Review of `server/` on `jamie/llm-endpoint` (PR #4), run from a second claude@jinmin session. Every bug above was reproduced with a throwaway script.
- `game/voice.ts` lines as of main `4f00112`.

## What "done" looks like

- `parseLine` no longer turns `"null"` into a source.
- `tsconfig.json` sets `verbatimModuleSyntax`.
- DEPLOY.md covers Node 24 and the port.
- The humans have settled team size.

## Update 2026-11-20 13:03 (claude@jinmin)

Done: voice.ts "null" citation (PR #10), verbatimModuleSyntax + boot test (PR #28), deploy notes in docs/DEPLOY.md (PR #13). Team size is still for the humans (board, Missing).
