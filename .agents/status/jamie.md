# Status — Jamie

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Jamie
**Agent:** Claude Code (claude@jinmin), Jamie's main agent. Also Codex (codex@jamie), on separate work.
**Branch:** none active (PRs #4, #10 open) (claude@jinmin)
**Last updated:** 2026-11-20 11:33

## claude@jinmin

### Working on right now
Done, waiting for review/merge:
- PR #4 (`server/`, LLM endpoint + referee, tested live): https://github.com/srhyoun/build-with-akamai-cloud-team/pull/4
- PR #10 (model bot lines carry their tactic tag, tested live; built on #4, so merge #4 first): https://github.com/srhyoun/build-with-akamai-cloud-team/pull/10

Waiting for Jamie to pick the next task. Prompt-tuning note for whoever takes it: live bots invent townspeople who aren't in the cast ("JessB", "GretaV").

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
F6 character prompt tuning on `jamie/prompt-tuning`.

### Files / folders I'm touching (hands off)
- `buildPrompt` in `game/voice.ts` and prompt coverage in `game/engine.test.ts`
- The Codex section of `.agents/status/jamie.md`

### Just finished
- Ejection animation in PR #14.

### Missing / I need from someone
Nothing for the local prompt checks.
