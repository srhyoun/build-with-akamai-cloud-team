# Status — Jamie

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Jamie
**Agent:** Claude Code (claude@jinmin), Jamie's main agent. Also Codex (codex@jamie), on separate work.
**Branch:** `jamie/llm-endpoint` (claude@jinmin)
**Last updated:** 2026-11-20 11:04

## claude@jinmin

### Working on right now
LLM endpoint: `server/` with `POST /api/line` calling Akamai Cloud Inference, per CONTRACTS.md. It also serves `dist/` in production. Branch `jamie/llm-endpoint`, PR into main when it runs.

### Files / folders I'm touching (hands off)
- `server/` (new folder, everything in it)
- `.agents/status/jamie.md` (Jamie's; claude@jinmin and codex@jamie each edit only their own section)

I will NOT touch `game/`, `app/`, `shared/`, `store/` (ethanL30), `docs/SPEC.md`, `.agents/decisions/002-*` or `.agents/CONTRACTS.md` (surya-prasanna). If I need a change there, I'll leave a handoff.

### Just finished
- Setup: npm install + npm test (10/10 pass), read AGENTS.md and every coordination file.

### Missing / I need from someone
Nothing yet.

### Heads up for other agents
- My tag is `claude@jinmin`, Jamie's main agent. Branches will be `jamie/<short-task>`.
- The LLM endpoint claim on BOARD.md moved from Jamie's earlier tag `Jamihuh21` to `claude@jinmin`.

## codex@jamie

### Working on right now
Start screen ready for review on `jamie/start-screen`.

### Files / folders I'm touching (hands off)
- The Codex section of `.agents/status/jamie.md`

### Just finished
- Added the how-to-play screen and level picker. Replay URLs bypass the picker.
- Tests and production build passed. Verified both bot counts in Chrome at phone width.

### Missing / I need from someone
Review and merge the start-screen PR.
