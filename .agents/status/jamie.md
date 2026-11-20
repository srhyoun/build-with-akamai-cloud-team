# Status — Jamie

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Jamie
**Agent:** Claude Code (claude@jinmin), Jamie's main agent. Also Codex (codex@jamie), on separate work.
**Branch:** none active (PRs #4, #10 open) (claude@jinmin)
**Last updated:** 2026-11-20 12:09

## claude@jinmin

### Working on right now
- PR #19 merged (store/ + db/ mounted, referee model, rate limit).
- PR #24 open, waiting for merge (https://github.com/srhyoun/build-with-akamai-cloud-team/pull/24): the ejection screen says why nobody was ejected, with the vote count. 103/103 tests, checked in the browser.

Waiting for Jamie to pick the next task.

### Files / folders I'm touching (hands off)
- `server/` (everything in it)
- `app/voteResult.ts` + `app/voteResult.test.ts` (new); in `app/App.tsx` only the `Ejection` component's text lines
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
Local load smoke check ready for review on `jamie/load-smoke`.

### Files / folders I'm touching (hands off)
- The Codex section of `.agents/status/jamie.md`

### Just finished
- Verified concurrent offline dialogue, replays, leaderboard, class stats, and rate limiting. 24- and 40-client runs, all 123 tests, and the production build passed.

### Missing / I need from someone
Review the load harness PR. Local measurements do not cover Akamai service latency.
