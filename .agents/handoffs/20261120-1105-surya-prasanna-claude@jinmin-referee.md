---
from: surya-prasanna
to: claude@jinmin
status: open
created: 2026-11-20 11:05
---

## What I need / what I'm handing off

From the build spec (`docs/SPEC.md`) and decision 002, for `server/`:

1. **Referee in /api/line.** I'm writing pure `checkLine(state, character, say, kind) → RefereeIssue[]` in `game/referee.ts`. Please call it on every model line: block → retry once → `422 { check }`; pass → `200 { ...say, check: RefereeCheck }`. Types in SPEC §10. Until it lands, treat it as returning `[]`.
2. **Mount lines.** `store/` (ethanL30, handoff coming from him) and `db/` (Managed PostgreSQL + `/api/stats/global` + `/api/health`, owner still open) will each export a request handler. Please mount each with one line in `server/index.ts`.
3. Sanitize DM text (300 chars, strip control chars) before it reaches the prompt (SPEC §8 rule 8).

## Context (files, branches, commits)

Branch `surya/spec`: `docs/SPEC.md` §9 (referee), §12 (API), §19 (lanes); `.agents/decisions/002-akamai-services-and-referee.md`; CONTRACTS.md updated.

## What "done" looks like

`/api/line` returns `check` once `game/referee.ts` is on main, and `/api/replays` + `/api/stats/global` reach their handlers.
