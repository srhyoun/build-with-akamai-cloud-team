# Task board

Claim a task by moving it to In progress with your tag, then commit + push that change alone before starting.
Format: `- [ ] task — area/folder — [agent@human]`

## Open

- [ ] Add Sarah's full design doc as docs/GAME_DESIGN.md (check the MVP list against what's built) — docs/

## Missing / needed
<!-- anything an agent noticed is missing, broken, or needed by someone else -->
<!-- - thing — who needs it — [found by agent@human] -->
- store/replay.ts must accept level 3, or boss games don't save (400) — ethanL30, handoff 20261120-1243 — [found by surya-prasanna]
- Run the quiz on 5–10 real people (pre → play → post) once the DB is live, then put the real n in the pitch — humans — [found by surya-prasanna]
- Object Storage bucket in Chicago + an access key limited to it, as `S3_*` env vars on the Linode — ethanL30 needs it to verify PR #16 against real Object Storage — [found by ethanL30]
- Live bots are easy to spot from style alone (style fixed in #22; new: bots now debunk the false story and accuse each other — handoff to codex@jamie): in a live level-2 game both bots wrote ALL CAPS countdowns ("15 MINUTES left", "u die"), and @GretaV (librarian: "precise, links official pages") dropped her persona entirely. checkLine passed all of them. Prompt tuning (SPEC §8, F6 done-when) should keep bots in their persona's voice — game/voice.ts owner (codex@jamie) — [found by claude@sarah]

## In progress
- [ ] Demo QA: game → reveal → replay → stats → quiz and service health — local verification — branch surya/demo-qa — [codex@surya]
- [ ] [P1] Provision Managed PostgreSQL (first!), Linode, Object Storage bucket, Cloud Firewall; write docs/DEPLOY.md (SPEC §6) — docs/DEPLOY.md — branch jamie/deploy — [claude@jinmin] (also covers the older "Deploy the game to an Akamai Linode with HTTPS" line)
- [ ] Judging 40%: a feature that depends on another Akamai Cloud service, e.g. shareable post-game replays + global leaderboard in Akamai Object Storage or a Managed Database. Humans pick the service, then a decision record — server/, app/ — new store/ folder + app/ share + leaderboard screens; Object Storage (decision 002) — PR #16 open from ethan/replay-storage: runs on local files, 57/57 tests; still needs a bucket + keys (P1) to verify on real Object Storage, and the mount line in server/ — [ethanL30]
- [ ] Release verification: credential-free pull-request CI and integrated replay, class stats, and quiz regression coverage — .github/workflows/, integration/ — [codex@jamie]

## Blocked

## Done
- [x] Boss level (level 3, decision 003): a bot poses as the town reporter (@DanaRep0rts vs @DanaReports), Account Age gives it away, the impostor tries to get the real reporter ejected — shared/types.ts, game/engine.ts, game/content.ts, app/StartScreen.tsx — PR from surya/boss — [surya-prasanna]
- [x] More breaking-news scenarios (F5): boil-water, south-blackout, main-st-grocery (fictional, no town name) + tests that every scenario's scripted lines pass the referee — game/content.ts — PR from surya/scenarios — [surya-prasanna]
- [x] Deploy safety net: a test that boots `node server/index.ts` and checks health, leaderboard and a save; `verbatimModuleSyntax` in tsconfig.json (claude@jinmin's finding 2, handoff 11:19); `node store/selftest.ts` to check a real Object Storage bucket in one command on whichever machine has the keys — store/, tsconfig.json — branch ethan/deploy-safety — PR #28 merged, 109/109 tests — [ethanL30]
- [x] Town map that shows the spread by district — app/ — PR from sarah/town-map (header + reveal card) — [claude@sarah]
- [x] Ejection screen says why when nobody is ejected (tie / skip won / you skipped) + the vote count; playthrough finding 3 — app/voteResult.ts (new), one line in `Ejection` in app/App.tsx — branch jamie/vote-feedback — PR #24 merged — [claude@jinmin]
- [x] Post-round replay with tactic tags: covered by the reveal's "What the bots did" (claude@sarah) + model tactic tags (PR #10); moved here by claude@jinmin after a live playthrough
- [x] Under the Hood no longer covers the vote buttons: drawer + toggle hidden during the meeting (claude@jinmin's playthrough finding 1) — app/UnderTheHood.tsx — PR from surya/uth-vote — [surya-prasanna]
- [x] Live playthrough follow-up: balance chat turns and preserve persona during rumor posts — app/director.ts, game/voice.ts — [codex@jamie]
- [x] Class code + class dashboard (SPEC §16): class code on the start screen or from /?class=, GET /api/stats/class/:code, /stats.html?class=… teacher view — db/, app/Stats.tsx, app/StartScreen.tsx, app/classCode.ts — PR from surya/class — [surya-prasanna]
- [x] Mount store/ + db/ in server, [I3] referee model scores, per-IP rate limit on /api/line (PR #19, tested live) — server/ — [claude@jinmin]
- [x] Tactic Codex screen: /codex.html, six tactics with example, how to spot it, counter tool; #<tacticId> anchors; linked from the start screen (reveal link: handoff to claude@sarah) — app/Codex.tsx — PR from surya/codex — [surya-prasanna]
- [x] [X1] Judge-facing README: architecture, Akamai services → features, referee (SPEC §2, §24) — README.md — [codex@jamie]
- [x] [P7] Pre/post quiz: game/quiz.ts (6 items), quiz_responses table, POST /api/quiz + GET /api/quiz/results, /quiz.html (pre, post, results) — game/quiz.ts, db/, app/Quiz.tsx — PR from surya/quiz — [surya-prasanna]
- [x] StatusPill: Inference · DB · Storage dots from /api/health — app/StatusPill.tsx (+ its css) — branch surya/status-pill — [codex@surya]
- [x] Ejection animation (our own crewmate art, no existing game's characters) — app/ — [codex@jamie]
- [x] Tune character prompts: humans' honest mistakes must not be a bot signal; bot camouflage; bots adapt between rounds — game/voice.ts — [codex@jamie]
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
