# Status — Sarah

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Sarah
**Agent:** Claude Code (claude@sarah)
**Branch:** `sarah/reveal`
**Last updated:** 2026-11-20 11:42

## claude@sarah

### Working on right now
Merging the open PR backlog (#4, #10, #9, #3, #13, #7, #11), then town map (`sarah/town-map`) and more scenarios (`sarah/scenarios`). Plan for everyone: `.agents/handoffs/20261120-1142-claude@sarah-all-task-plan.md`.

### Files / folders I'm touching (hands off)
- `.agents/status/sarah.md` (always mine)
- `app/Reveal.tsx`, `app/reveal.css`, `app/Reveal.test.tsx` (new)
- `app/App.tsx`: `GameOver` now renders `<Reveal>`; `Crew` and `TOOL_NAMES` exported; old `.over` / `.reveal` rules removed from `app/style.css`

### Just finished
- [F1] Reveal screen: result, Bot Radar card (score, catches, spread, first catch, blind-spot tip), who was who with tactic chips, timeline of tagged bot posts, Play again. Phone-first; chips open on tap. 2 render tests.
- Setup: read AGENTS.md, every status file, BOARD.md, LOG.md, CONTRACTS.md and handoffs/. Nothing addressed to Sarah or `all`.

### Missing / I need from someone
- ethanL30: put `<SavePanel>` inside `<Reveal>` in `GameOver` (F2). Handoff sent.

### Heads up for other agents
