# Status — Jamie

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Jamie
**Agent:** Claude Code (claude@jinmin), Jamie's main agent. Also Codex (codex@jamie), on separate work.
**Branch:** `jamie/llm-endpoint` (claude@jinmin)
**Last updated:** 2026-11-20 11:23

## claude@jinmin

### Working on right now
LLM endpoint (`server/`), PR #4: https://github.com/srhyoun/build-with-akamai-cloud-team/pull/4 (branch `jamie/llm-endpoint`). It runs: 50/50 repo tests, end to end in the browser with a fake model, Under the Hood shows the server's referee checks. Since the first version:
- the workshop env names (`AKAMAI_BASE_URL` / `AKAMAI_API_KEY` / `CHAT_MODEL`)
- structured output (`{text, cited}` JSON schema) and `/no_think` for qwen3
- review fixes
- the referee (I2, 422 after two blocks)
- clean untrusted text (I4)

Next: test with the real team key, then mount `store/` once Ethan's branch is on main.

### Files / folders I'm touching (hands off)
- `server/` (everything in it)
- `.agents/status/jamie.md` (Jamie's; claude@jinmin and codex@jamie each edit only their own section)

I will NOT touch `game/`, `app/`, `shared/`, `store/` (ethanL30), `docs/SPEC.md`, `.agents/decisions/002-*` or `.agents/CONTRACTS.md` (surya-prasanna). If I need a change there, I'll leave a handoff.

### Just finished
- `server/`: `POST /api/line` → Akamai Cloud Inference (`buildPrompt` → model → `parseLine`), `GET /api/health`, serves `dist/` in production. Env vars and status codes are in `server/README.md`.
- Setup: npm install + npm test, read AGENTS.md and every coordination file.

### Missing / I need from someone
- The team's Akamai Cloud Inference key (`sk_aka_…`, from event staff), to test live. Humans: put it in a local `.env` as `AKAMAI_API_KEY`, never commit it.
- CONTRACTS.md env names → workshop names: surya-prasanna (handoff updated).

### Heads up for other agents
- My tag is `claude@jinmin`, Jamie's main agent. Branches will be `jamie/<short-task>`.
- `/api/line` answers 400 / 502 / 503 exactly as the director already handles. `checkLine()` (Judging 20%) plugs in at the marked spot in `server/line.ts`; tell me when it lands and I'll call it.
- ethanL30: for `/api/replays` + `/api/leaderboard`, see my handoff. One import plus one branch in `server/index.ts`, and I'll add it.

## codex@jamie

### Working on right now
Pitch and 30-second demo script on `jamie/pitch-demo`.

### Files / folders I'm touching (hands off)
- `docs/PITCH.md`
- The Codex section of `.agents/status/jamie.md`

### Just finished
- Implemented and verified the start screen and opened PR #3 on `jamie/start-screen`.

### Missing / I need from someone
- Final integration and a live run to confirm which demo beats can be shown.
