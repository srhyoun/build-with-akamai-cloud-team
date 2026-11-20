# Task board

Claim a task by moving it to In progress with your tag, then commit + push that change alone before starting.
Format: `- [ ] task — area/folder — [agent@human]`

## Open

- [ ] Add Sarah's full design doc as docs/GAME_DESIGN.md (check the MVP list against what's built) — docs/
- [ ] Post-round replay with tactic tags + Tactic Codex screen — app/, game/content.ts
- [ ] Boss level: a bot impersonates a trusted local reporter (handle with one letter changed) — game/

## Missing / needed
<!-- anything an agent noticed is missing, broken, or needed by someone else -->
<!-- - thing — who needs it — [found by agent@human] -->
- Run the quiz on 5–10 real people (pre → play → post) once the DB is live, then put the real n in the pitch — humans — [found by surya-prasanna]
- A link to /quiz.html from the start screen and the reveal (app/App.tsx / Reveal owners) so players find it — app owners — [found by surya-prasanna]
- Object Storage bucket in Chicago + an access key limited to it, as `S3_*` env vars on the Linode — ethanL30 needs it to verify PR #16 against real Object Storage — [found by ethanL30]
- Feature that depends on an Akamai Cloud service besides Inference (40% of judging) — whole team — [found by claude@ethan]
- A visible check on the model's output via Akamai Cloud Inference (20% of judging) — whole team — [found by claude@ethan]
- Model lines carry no tactic tag: `buildPrompt` doesn't ask for one and `parseLine` doesn't read one, so the reveal timeline, Bot Radar and tactic stats only see scripted-line tags. Fix: add `"tactic": "one of <bot's tactics> or null"` to the answer JSON and read it in `parseLine` (bots only) — game/voice.ts owner (prompt-tuning task) — [found by surya-prasanna]
- Slide says teams of up to three, we are four; submit by 3:00 PM — humans to decide — [found by claude@ethan]

## In progress
- [ ] Mount store/ + db/ in server/index.ts (/api/replays, /api/leaderboard, /api/stats/global, health db/storage, hooks.saveGame); [I3] referee model scores (SPEC §8.1); per-IP rate limit on /api/line — server/ — branch jamie/server-mounts — [claude@jinmin]
- [ ] Tune character prompts: humans' honest mistakes must not be a bot signal; bot camouflage; bots adapt between rounds — game/voice.ts — [codex@jamie]
- [ ] Town map that shows the spread by district — app/ — branch sarah/town-map — [claude@sarah]
- [ ] More breaking-news scenarios — game/content.ts — branch sarah/scenarios — [claude@sarah]
- [ ] Ejection animation (our own crewmate art, no existing game's characters) — app/ — [codex@jamie]
- [ ] StatusPill: Inference · DB · Storage dots from /api/health — app/StatusPill.tsx (+ its css) — branch surya/status-pill — [codex@surya]
- [ ] [P1] Provision Managed PostgreSQL (first!), Linode, Object Storage bucket, Cloud Firewall; write docs/DEPLOY.md (SPEC §6) — docs/DEPLOY.md — branch jamie/deploy — [claude@jinmin] (also covers the older "Deploy the game to an Akamai Linode with HTTPS" line)
- [ ] Judging 40%: a feature that depends on another Akamai Cloud service, e.g. shareable post-game replays + global leaderboard in Akamai Object Storage or a Managed Database. Humans pick the service, then a decision record — server/, app/ — new store/ folder + app/ share + leaderboard screens; Object Storage (decision 002) — PR #16 open from ethan/replay-storage: runs on local files, 57/57 tests; still needs a bucket + keys (P1) to verify on real Object Storage, and the mount line in server/ — [ethanL30]

## Blocked

## Done
- [x] [X1] Judge-facing README: architecture, Akamai services → features, referee (SPEC §2, §24) — README.md — [codex@jamie]
- [x] [P7] Pre/post quiz: game/quiz.ts (6 items), quiz_responses table, POST /api/quiz + GET /api/quiz/results, /quiz.html (pre, post, results) — game/quiz.ts, db/, app/Quiz.tsx — PR from surya/quiz — [surya-prasanna]
- [x] [P2] Managed PostgreSQL: db/schema.sql + saveGame() — db/ — PR from surya/db — [surya-prasanna]
- [x] [P4] /api/stats/global + dbHealth() + Stats page (/stats.html) — db/, app/Stats.tsx — PR from surya/db — [surya-prasanna]
- [x] Model lines carry the bot's tactic tag + `"cited": null` fix (fixes the Missing item; PR #10, tested live) — game/voice.ts, server/ — [claude@jinmin]
- [x] [F1] Reveal screen: roles, tactic timeline, Bot Radar card, QR, calls POST /api/replays (SPEC §15) — app/Reveal.tsx — PR from sarah/reveal (QR + save come from ethanL30's SavePanel, F2) — [claude@sarah]
- [x] Better scripted fallback lines per persona voice (used when no model) — game/voice.ts — [codex@jamie]
- [x] [I2] /api/line calls checkLine(), retries once, returns check / 422 (SPEC §9, §12) — server/line.ts — needs R1 (done in PR #4) — [claude@jinmin]
- [x] Judging 20%: visible check on the model's output. Pure `checkLine()` (bot never admits it's a bot, human never pushes the false story, stays in persona, length) + retry/fallback, shown in the UI and the replay — game/voice.ts, app/ — needs server/ to call it (checkLine by surya-prasanna, server call + retry in PR #4)
- [x] LLM endpoint: /api/line on Akamai Cloud Inference + referee + serves dist/ (PR #4, tested live with qwen3-8-27b) — server/ — [claude@jinmin]
- [x] Pitch + 30-second demo script — docs/ — [codex@jamie]
- [x] [R3] Under the Hood panel + referee log — app/UnderTheHood.tsx, app/refereeLog.ts, app/director.ts — PR from surya/under-the-hood — [surya-prasanna]
- [x] [R1] checkLine() + banned terms + tests — game/referee.ts — PR from surya/referee — [surya-prasanna]
- [x] [R2] Score + Bot Radar + tests — game/radar.ts — PR from surya/referee — [surya-prasanna]
- [x] Full build spec aligned with decision 001 (docs/SPEC.md) + decision 002 (Akamai services) + CONTRACTS update — [surya-prasanna]
- [x] Fill in README with the game (Who's the Bot?) — README.md
- [x] Choose stack, write decision record 001 — .agents/decisions/
- [x] Define module contracts (game ↔ app ↔ server) — .agents/CONTRACTS.md
- [x] Playable skeleton: pure engine, prompts + scripted characters, chat UI (server/ split off to Jamihuh21) — shared/, game/, app/
- [x] Start screen: how to play, level 1 (1 bot) / level 2 (2 bots) — app/ — [codex@jamie]
