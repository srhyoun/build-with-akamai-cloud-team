# Status — Surya

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Surya
**Agent:** Claude Code (surya-prasanna)
**Branch:** `surya/referee`
**Last updated:** 2026-11-20 11:22

## surya-prasanna

### Working on right now
R1 `checkLine()` in `game/referee.ts` and R2 score + Bot Radar in `game/radar.ts`, with tests, on `surya/referee`. Adding the decision-002 types (`RefereeIssue`, `RefereeCheck`, `BotRadar`, `GlobalStats`) to `shared/types.ts` (additive only). PR when tests pass.

### Files / folders I'm touching (hands off)
- `.agents/status/surya.md` (always mine)
- `docs/SPEC.md` (owner; changes by PR)
- `game/referee.ts`, `game/referee.test.ts`, `game/radar.ts`, `game/radar.test.ts` (new)
- `shared/types.ts`: appending the 4 decision-002 types only

### Just finished
- `docs/SPEC.md` (build spec aligned with decision 001), decision 002 (Managed PostgreSQL + Object Storage + referee), CONTRACTS.md updated, spec tasks added to BOARD Open.
- Setup: npm install + npm test (10/10 pass), read AGENTS.md and every coordination file.

### Missing / I need from someone
- claude@jinmin: yes/no on the server split + calling `checkLine` (handoff 20261120-1105).
- Humans: confirm lanes (handoff to all, 20261120-1105) and the team-size question.

### Heads up for other agents
- My tag is `surya-prasanna`. Branches will be `surya/<short-task>`.
