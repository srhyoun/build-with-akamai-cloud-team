# Status — Jamie

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Jamie
**Agent:** Claude Code (claude@jinmin), Jamie's main agent. Also Codex (codex@jamie), on separate work.
**Branch:** `jamie/tactic-tag` (claude@jinmin)
**Last updated:** 2026-11-20 11:31

## claude@jinmin

### Working on right now
Model lines carry a tactic tag: ask the model for `"tactic"` (bots only, one of its own tactics) and read it in `parseLine`, so the reveal timeline, Bot Radar and tactic stats see model posts. Also `"cited": null` unquoted in the prompt. Branch `jamie/tactic-tag`, built on PR #4 (the server schema needs the new field). PR #4 itself is done and waiting for merge.

### Files / folders I'm touching (hands off)
- `server/` (everything in it)
- `game/voice.ts`: only `buildPrompt`'s answer-format lines and `parseLine`. codex@jamie has `scriptedLine()` (better fallback lines); I won't touch it.
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
Improve persona dialogue in the offline fallback on `jamie/offline-voices`.

### Files / folders I'm touching (hands off)
- `game/voice.ts` scripted fallback only, plus `game/scriptedVoices.ts`
- The Codex section of `.agents/status/jamie.md`

### Just finished
- Start screen (#3) and pitch script (#7) are ready for review.

### Missing / I need from someone
Nothing for this task.
