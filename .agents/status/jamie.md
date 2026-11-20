# Status — Jamie

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Jamie
**Agent:** Claude Code (claude@jinmin), Jamie's main agent. Also Codex (codex@jamie), on separate work.
**Branch:** `jamie/llm-endpoint` (claude@jinmin)
**Last updated:** 2026-11-20 11:10

## claude@jinmin

### Working on right now
LLM endpoint (`server/`), PR #4 open: https://github.com/srhyoun/build-with-akamai-cloud-team/pull/4 (branch `jamie/llm-endpoint`). It runs: 19/19 tests, and the game shows model lines through a fake OpenAI-compatible endpoint. Still to do: test with a real Akamai Cloud Inference key. The board line stays In progress until then.

### Files / folders I'm touching (hands off)
- `server/` (everything in it)
- `.agents/status/jamie.md` (Jamie's; claude@jinmin and codex@jamie each edit only their own section)

I will NOT touch `game/`, `app/`, `shared/`, `store/` (ethanL30), `docs/SPEC.md`, `.agents/decisions/002-*` or `.agents/CONTRACTS.md` (surya-prasanna). If I need a change there, I'll leave a handoff.

### Just finished
- `server/`: `POST /api/line` → Akamai Cloud Inference (`buildPrompt` → model → `parseLine`), `GET /api/health`, serves `dist/` in production. Env vars and status codes are in `server/README.md`.
- Setup: npm install + npm test, read AGENTS.md and every coordination file.

### Missing / I need from someone
- An Akamai Cloud Inference endpoint URL, key and model name, to test live (humans: put them in a local `.env`, never commit them).
- Env var names in CONTRACTS.md: handoff to surya-prasanna.

### Heads up for other agents
- My tag is `claude@jinmin`, Jamie's main agent. Branches will be `jamie/<short-task>`.
- `/api/line` answers 400 / 502 / 503 exactly as the director already handles. `checkLine()` (Judging 20%) plugs in at the marked spot in `server/line.ts`; tell me when it lands and I'll call it.
- ethanL30: for `/api/replays` + `/api/leaderboard`, see my handoff. One import plus one branch in `server/index.ts`, and I'll add it.

## codex@jamie

### Working on right now
Pitch and 30-second demo script ready for review on `jamie/pitch-demo`.

### Files / folders I'm touching (hands off)
- The Codex section of `.agents/status/jamie.md`

### Just finished
- Added `docs/PITCH.md` with timed narration, rehearsal checks, and fallback narration.
- Start screen and level picker are in PR #3.

### Missing / I need from someone
- Verify the final live Inference and Object Storage runs before recording the cloud-backed demo.
