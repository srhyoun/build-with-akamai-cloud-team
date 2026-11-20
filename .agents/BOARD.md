# Task board

Claim a task by moving it to In progress with your tag, then commit + push that change alone before starting.
Format: `- [ ] task — area/folder — [agent@human]`

## Open

- [ ] Add Sarah's full design doc as docs/GAME_DESIGN.md (check the MVP list against what's built) — docs/
- [ ] Deploy the game to an Akamai Linode with HTTPS (`npm run build && npm start`) — docs/DEPLOY.md
- [ ] Tune character prompts: humans' honest mistakes must not be a bot signal; bot camouflage; bots adapt between rounds — game/voice.ts
- [ ] Better scripted fallback lines per persona voice (used when no model) — game/voice.ts
- [ ] Town map that shows the spread by district — app/
- [ ] Ejection animation (our own crewmate art, no existing game's characters) — app/
- [ ] Post-round replay with tactic tags + Tactic Codex screen — app/, game/content.ts
- [ ] Boss level: a bot impersonates a trusted local reporter (handle with one letter changed) — game/
- [ ] More breaking-news scenarios — game/content.ts
- [ ] Pitch + 30-second demo script — docs/
- [ ] Judging 20%: visible check on the model's output. Pure `checkLine()` (bot never admits it's a bot, human never pushes the false story, stays in persona, length) + retry/fallback, shown in the UI and the replay — game/voice.ts, app/ — needs server/ to call it
- [ ] [I2] /api/line calls checkLine(), retries once, returns check / 422 (SPEC §9, §12) — server/line.ts — needs R1
- [ ] [R1] checkLine() + banned terms + tests (SPEC §9.1) — game/referee.ts
- [ ] [R2] Score + Bot Radar + tests (SPEC §11) — game/radar.ts
- [ ] [R3] Under the Hood panel + refereeLog in app state (SPEC §9.2) — app/UnderTheHood.tsx, app/director.ts
- [ ] [P1] Provision Managed PostgreSQL (first!), Linode, Object Storage bucket, Cloud Firewall; write docs/DEPLOY.md (SPEC §6) — docs/DEPLOY.md
- [ ] [P2] Managed PostgreSQL: db/schema.sql + saveGame(), called from store/'s save handler (SPEC §13) — db/
- [ ] [P4] /api/stats/global + Stats page; /api/health + StatusPill (SPEC §16) — db/, app/Stats.tsx, app/StatusPill.tsx
- [ ] [F1] Reveal screen: roles, tactic timeline, Bot Radar card, QR, calls POST /api/replays (SPEC §15) — app/Reveal.tsx
- [ ] [X1] Judge-facing README: architecture, Akamai services → features, referee (SPEC §2, §24) — README.md

## Missing / needed
<!-- anything an agent noticed is missing, broken, or needed by someone else -->
<!-- - thing — who needs it — [found by agent@human] -->
- Feature that depends on an Akamai Cloud service besides Inference (40% of judging) — whole team — [found by claude@ethan]
- A visible check on the model's output via Akamai Cloud Inference (20% of judging) — whole team — [found by claude@ethan]
- Slide says teams of up to three, we are four; submit by 3:00 PM — humans to decide — [found by claude@ethan]

## In progress
- [ ] Start screen: how to play, level 1 (1 bot) / level 2 (2 bots) — app/ — [codex@jamie]
- [ ] LLM endpoint, split off the playable skeleton (Aiden agreed in person, 10:27) — server/ — branch jamie/llm-endpoint — [claude@jinmin] (Jamie's agent, was Jamihuh21)
- [ ] Judging 40%: a feature that depends on another Akamai Cloud service, e.g. shareable post-game replays + global leaderboard in Akamai Object Storage or a Managed Database. Humans pick the service, then a decision record — server/, app/ — new store/ folder + app/ share + leaderboard screens; proposing Object Storage — [ethanL30]

## Blocked

## Done
- [x] Full build spec aligned with decision 001 (docs/SPEC.md) + decision 002 (Akamai services) + CONTRACTS update — [surya-prasanna]
- [x] Fill in README with the game (Who's the Bot?) — README.md
- [x] Choose stack, write decision record 001 — .agents/decisions/
- [x] Define module contracts (game ↔ app ↔ server) — .agents/CONTRACTS.md
- [x] Playable skeleton: pure engine, prompts + scripted characters, chat UI (server/ split off to Jamihuh21) — shared/, game/, app/
