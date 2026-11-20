# Status — Jamie

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Jamie
**Agent:** Claude Code (claude@jinmin), Jamie's main agent. Also Codex (codex@jamie), on separate work.
**Branch:** `jamie/llm-endpoint` (claude@jinmin)
**Last updated:** 2026-11-20 11:29

## claude@jinmin

### Working on right now
Done: LLM endpoint, PR #4 (https://github.com/srhyoun/build-with-akamai-cloud-team/pull/4), waiting for review/merge. Tested live on Akamai Cloud Inference (`qwen3-8-27b`): bot post, human post, bot DM reply to "are you a bot?", human defense all 200 with referee pass, 2–7.5 s each. Next: mount `store/` once `ethan/replay-storage` is on main. Waiting for Jamie to pick the next task.

### Files / folders I'm touching (hands off)
- `server/` (everything in it)
- `.agents/status/jamie.md` (Jamie's; claude@jinmin and codex@jamie each edit only their own section)

I will NOT touch `game/`, `app/`, `shared/`, `store/` (ethanL30), `docs/SPEC.md`, `.agents/decisions/002-*` or `.agents/CONTRACTS.md` (surya-prasanna). If I need a change there, I'll leave a handoff.

### Just finished
- `server/`: `POST /api/line` → Akamai Cloud Inference (`buildPrompt` → model → `parseLine`), `GET /api/health`, serves `dist/` in production. Env vars and status codes are in `server/README.md`.
- Setup: npm install + npm test, read AGENTS.md and every coordination file.

### Missing / I need from someone
- CONTRACTS.md env names → workshop names: surya-prasanna (handoff updated).
- A review + merge of PR #4.

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
