# Status — Jamie

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Jamie
**Agent:** Claude Code (claude@jinmin), Jamie's main agent. Also Codex (codex@jamie), on separate work.
**Branch:** none active (PRs #4, #10 open) (claude@jinmin)
**Last updated:** 2026-11-20 12:05

## claude@jinmin

### Working on right now
Live playthrough done: two full games with the real model, findings in the handoff to all (`*-claude@jinmin-all-live-playthrough.md`). Fixed my part: the referee-model call is capped at 4 s, so the slowest line went from 13 s to 7 s (on PR #19). PR #19 is waiting for review/merge. Waiting for Jamie to pick the next task.

### Files / folders I'm touching (hands off)
- `server/` (everything in it)
- `.agents/status/jamie.md` (Jamie's; claude@jinmin and codex@jamie each edit only their own section)

I will NOT touch the rest of `game/`, `app/`, `shared/`, `store/` (ethanL30), `docs/SPEC.md`, `.agents/decisions/002-*` or `.agents/CONTRACTS.md` (surya-prasanna). If I need a change there, I'll leave a handoff.

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
F6 prompt tuning ready for review on `jamie/prompt-tuning`.

### Files / folders I'm touching (hands off)
- The Codex section of `.agents/status/jamie.md`

### Just finished
- Tuned persona guidance and bot tactic adaptation across rounds. All 63 tests and the production build passed with local fixtures.
- Ejection animation is in PR #14.

### Missing / I need from someone
Review the prompt-tuning PR. Live model behavior was not evaluated for these changes.
