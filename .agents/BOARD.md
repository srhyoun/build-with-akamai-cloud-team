# Task board

Claim a task by moving it to In progress with your tag, then commit + push that change alone before starting.
Format: `- [ ] task — area/folder — [agent@human]`

## Open

- [ ] Add Sarah's full design doc as docs/GAME_DESIGN.md (check the MVP list against what's built) — docs/
- [ ] [V7] Chat avatars match the villagers: swap the `Crew` pebble for `<Villager>` in feed, cast row, votes — app/App.tsx (`Crew`) — needs ethan/town-design merged — suggested: claude@sarah — skip if it risks the layout

## Missing / needed
<!-- anything an agent noticed is missing, broken, or needed by someone else -->
<!-- - thing — who needs it — [found by agent@human] -->
- Phone check (375×812 emulated, main before the town design): header is 182 px during "Breaking news" vs 154 px during Investigate — the longer label pushes the 🔊 button to a 2nd row, so the chat jumps at every round start. Fix: shorter label (e.g. "News") or let the toggle shrink — App.tsx header, claude@sarah or ethanL30's restyle — [found by surya-prasanna]
- Phone layout: with a DM open, pinned header + DM panel + composer + meeting button leave ~3 lines of public chat visible at 375×812 — worth keeping in mind for the V3 restyle — ethanL30 — [found by surya-prasanna]
- Deployed on Ethan's Linode, https://172-232-188-135.sslip.io (172.232.188.135), but not public yet: (1) Ethan must open TCP 80 + 443 to all sources in the Cloud Firewall, (2) a human with the keys must fill in `/etc/whosthebot.env` on the server (inference key, PG*, OBJ_*) — whole team — [found by ethanL30]
- Run the quiz on 5–10 real people (pre → play → post) once the DB is live, then put the real n in the pitch — humans — [found by surya-prasanna]
- Object Storage bucket in Chicago + an access key limited to it, as `S3_*` env vars on the Linode — ethanL30 needs it to verify PR #16 against real Object Storage — [found by ethanL30]
- Live bots are easy to spot from style alone (style fixed in #22; new: bots now debunk the false story and accuse each other — handoff to codex@jamie): in a live level-2 game both bots wrote ALL CAPS countdowns ("15 MINUTES left", "u die"), and @GretaV (librarian: "precise, links official pages") dropped her persona entirely. checkLine passed all of them. Prompt tuning (SPEC §8, F6 done-when) should keep bots in their persona's voice — game/voice.ts owner (codex@jamie) — [found by claude@sarah]

## In progress
- [ ] Scripted fallback fixes (offline lines, what the demo shows with no model): no back-to-back duplicate lines, a question no longer reads as a relayed "source", meeting defenses vary by persona and round, bot defenses carry no tactic tag (skewed the blind spot) — game/voice.ts, game/scriptedVoices.ts — codex@jamie on other work, handoff 12:56 from claude@sarah picked up — branch surya/scripted-lines — [surya-prasanna]
- [ ] [V9] Phone check of the new look after the merge: full game with sound, light + dark, Start transition, QR scan; findings under Missing — branch surya/v9-phone-qa — [codex@surya]
- [ ] [V6] New theme on the separate pages: `import './town/theme.css'` in the stats, quiz and codex entries, check at 375 px light + dark — needs ethan/town-design merged — branch surya/v6-theme-pages: lands now via import.meta.glob, turns on when theme.css merges; 375 px check after the merge — [surya-prasanna]
- [ ] [V8] README + docs/PITCH.md: 2–3 lines on the design (town reacts to the spread; all art and audio original, made in code; one OFL font) — can start now — branch surya/v8-design-docs (codex@jamie busy with load-smoke) — text in PR from surya/v8-design-docs; left: screenshot after ethan/town-design merges, and cut the scene/faces sentence if it misses the freeze — [surya-prasanna]
- [ ] [P1] Provision Managed PostgreSQL (first!), Linode, Object Storage bucket, Cloud Firewall; write docs/DEPLOY.md (SPEC §6) — docs/DEPLOY.md — branch jamie/deploy — [claude@jinmin] (also covers the older "Deploy the game to an Akamai Linode with HTTPS" line)
- [ ] Judging 40%: a feature that depends on another Akamai Cloud service, e.g. shareable post-game replays + global leaderboard in Akamai Object Storage or a Managed Database. Humans pick the service, then a decision record — server/, app/ — new store/ folder + app/ share + leaderboard screens; Object Storage (decision 002) — PR #16 open from ethan/replay-storage: runs on local files, 57/57 tests; still needs a bucket + keys (P1) to verify on real Object Storage, and the mount line in server/ — built and merged by ethanL30 (PRs #16, #25, #28). Last step handed to claude@jinmin (P1 owner): run `node store/selftest.ts` on the machine with the bucket keys, then move this line to Done — [ethanL30 → claude@jinmin]
- [ ] Release verification: credential-free pull-request CI and integrated replay, class stats, and quiz regression coverage — .github/workflows/, integration/ — [codex@jamie]
- [ ] [V1] Town square scene behind/above the game: coffee shop, library, water tower, river + bridge, trees, benches; the 6 cast as rounded original villagers; speech bubble + bounce when one talks (docs/DESIGN_BRIEF.md) — app/ (new files) — from Ethan's design brief — branch ethan/town-design — PR #45 open, checked in the browser at phone size — [ethanL30]
- [ ] [V2] Mood follows "Town infected": clouds, desaturation, red-orange haze, streetlights, faces happy → worried → scared; dark spotlight on ejection; sunshine on a win (docs/DESIGN_BRIEF.md) — app/ — needs V1 — branch ethan/town-design — PR #45 open, checked in the browser at phone size — [ethanL30]
- [ ] [V3] Restyle the UI to match: rounded, soft, minimal chrome; chunky slab-serif display font (openly licensed) for titles and numbers; chat stays readable on a phone (docs/DESIGN_BRIEF.md) — app/style.css and the other app/*.css — branch ethan/town-design — PR #45 open, checked in the browser at phone size — [ethanL30]
- [ ] [V5] Lively opening screen + Start transition down into the square; ship a simple fade/zoom first (docs/DESIGN_BRIEF.md) — app/StartScreen.tsx — needs V1 — branch ethan/town-design — PR #45 open, checked in the browser at phone size — [ethanL30]

## Blocked

## Done
- [x] Local mixed-load check: concurrent dialogue fallback, replay saves/reads, and class stats — integration/load-smoke.ts — [codex@jamie]
- [x] Bug sweep (full offline boss game + replay + Codex/quiz/stats at 375 px): cast avatars no longer shrink (boss handles @DanaRep0rts / @DanaReports overlapped), "boss level" label on the replay and leaderboard, after-quiz link underline — app/style.css, app/reveal.css, app/Share.tsx, app/Leaderboard.tsx — PR from sarah/bugfixes — [claude@sarah]
- [x] [V4] Original sounds (Web Audio synthesis, no files): per-character babble pitch, ambience slows as infection rises, token / meeting alarm / ejection sounds, silent until the first tap, mute toggle — app/sound.ts (new) + 3 lines in app/App.tsx — PR from surya/v4-sounds — handed over by ethanL30, handoff 12:47 — [surya-prasanna]
- [x] Boss games save: store/replay.ts accepts level 3 (+ store test), done by surya-prasanna with Surya's OK on ethanL30's file — store/replay.ts, store/store.test.ts — PR from surya/boss-save — [surya-prasanna]
- [x] UI fixes from a phone playthrough: composer + meeting button pinned to the bottom (the fixed Under the Hood button covered the meeting button), "📢 NEWS NEWS:" alert prefix, visor avatars → our own chat-pebble avatars (SPEC §15 IP rule) — app/App.tsx, app/style.css, game/content.ts — PR from sarah/ui-fixes — [claude@sarah]
- [x] Boss level (level 3, decision 003): a bot poses as the town reporter (@DanaRep0rts vs @DanaReports), Account Age gives it away, the impostor tries to get the real reporter ejected — shared/types.ts, game/engine.ts, game/content.ts, app/StartScreen.tsx — PR from surya/boss — [surya-prasanna]
- [x] More breaking-news scenarios (F5): boil-water, south-blackout, main-st-grocery (fictional, no town name) + tests that every scenario's scripted lines pass the referee — game/content.ts — PR from surya/scenarios — [surya-prasanna]
- [x] Demo QA: game → reveal → replay → stats → quiz and service health — local verification — branch surya/demo-qa — [codex@surya]
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
