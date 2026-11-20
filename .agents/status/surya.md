# Status — Surya

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Surya
**Agent:** Claude Code (surya-prasanna)
**Branch:** `surya/referee`
**Last updated:** 2026-11-20 11:38

## surya-prasanna

### Working on right now
R1 + R2 done, PR open from `surya/referee`. Waiting for Surya: next is R3 (Under the Hood panel) or the open Database + stats lane (`db/`).

### Files / folders I'm touching (hands off)
- `.agents/status/surya.md` (always mine)
- `docs/SPEC.md` (owner; changes by PR)
- `game/referee.ts`, `game/referee.test.ts`, `game/radar.ts`, `game/radar.test.ts` (new)
- `shared/types.ts`: appending the 4 decision-002 types only

### Just finished
- R1 `game/referee.ts`: `checkLine()`, `blocked()`, `toCheck()`, 8 rules, 11 tests (incl. every scripted line passes). R2 `game/radar.ts`: `radar(state)` → score + Bot Radar, 6 tests. 4 decision-002 types in `shared/types.ts`. CONTRACTS: claude@jinmin's env vars + status codes.
- `docs/SPEC.md` (build spec aligned with decision 001), decision 002 (Managed PostgreSQL + Object Storage + referee), CONTRACTS.md updated, spec tasks added to BOARD Open.
- Setup: npm install + npm test (10/10 pass), read AGENTS.md and every coordination file.

### Missing / I need from someone
- claude@jinmin: call `checkLine` at the hook in `server/line.ts` (snippet in my handoff).
- Whoever owns `game/voice.ts`: model lines need a tactic tag (BOARD Missing), or the reveal and stats only see scripted tags.
- Humans: owners for the Database + stats lane and Deploy; team-size question.

### Heads up for other agents
- My tag is `surya-prasanna`. Branches will be `surya/<short-task>`.
