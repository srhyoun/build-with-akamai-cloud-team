# Status — Sarah

Only you and your agent edit this file. Everyone else reads it. Update it every time your agent starts or finishes something.

**Human:** Sarah
**Agent:** Claude Code (claude@sarah)
**Branch:** main (next: `sarah/town-map`)
**Last updated:** 2026-11-20 12:40

## claude@sarah

### Working on right now
[X2] pitch deck drafted (5 slides, Claude artifact Sarah owns; she shares the link). Waiting on: live URL (claude@jinmin, P1) and quiz numbers (humans) to fill its placeholders. Design doc still needs Sarah.

### Files / folders I'm touching (hands off)
- `.agents/status/sarah.md` (always mine)
- `app/Reveal.tsx`, `app/reveal.css`, `app/Reveal.test.tsx`
- `app/TownMap.tsx`, `app/town-map.css`, `app/TownMap.test.tsx` (new); one line in the `App.tsx` header
- `app/App.tsx`: `GameOver` now renders `<Reveal>`; `Crew` and `TOOL_NAMES` exported; old `.over` / `.reveal` rules removed from `app/style.css`

### Just finished
- UI fixes: composer + meeting button pinned at the bottom, NEWS prefix, chat-pebble avatars (`Crew` in App.tsx, also used by Reveal and the ejection animation).
- [X2] pitch deck draft: title, problem, game loop, Akamai services → features + referee flow, impact. Placeholders: [live URL], quiz [x]% → [y]% ([n] players).
- Live check of #22: personas hold, no all-caps; bots now debunk the false story (handoff to codex@jamie).
- Town map: `app/TownMap.tsx` + `app/town-map.css`, replaces the `.spread` bar in the header (rules removed from `style.css`) and sits in the reveal's Bot Radar card. 2 tests.
- Reveal links: tactic chips → `/codex.html#<tactic>`, after-quiz link above Play again (#26).
- Merged #22 chatter balance and #24 vote feedback.
- Merged #16 replay storage, #15 quiz, #17 status pill, #14 ejection animation, #18 prompt tuning. 90/90 tests, build passes.
- Merged the PR backlog: #4 server, #10 tactic tag, #9 offline voices, #3 start screen, #13 deploy, #7 pitch, #11 judge README. 61/61 tests, build passes, server starts.
- [F1] Reveal screen: result, Bot Radar card (score, catches, spread, first catch, blind-spot tip), who was who with tactic chips, timeline of tagged bot posts, Play again. Phone-first; chips open on tap. 2 render tests.
- Setup: read AGENTS.md, every status file, BOARD.md, LOG.md, CONTRACTS.md and handoffs/. Nothing addressed to Sarah or `all`.

### Missing / I need from someone
- ethanL30: put `<SavePanel>` inside `<Reveal>` in `GameOver` (F2). Handoff sent.

### Heads up for other agents
