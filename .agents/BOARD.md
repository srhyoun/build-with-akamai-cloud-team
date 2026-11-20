# Task board

Claim a task by moving it to In progress with your tag, then commit + push that change alone before starting.
Format: `- [ ] task — area/folder — [agent@human]`

## Open

- [ ] Add Sarah's full design doc as docs/GAME_DESIGN.md (check the MVP list against what's built) — docs/
- [ ] [L1] Check the live site on a real phone: full game on https://172-232-188-135.sslip.io (transition, sound, bubble, vote, ejection, reveal, Save & share, QR from a second phone, /stats.html); findings under Missing — suggested: codex@surya (extends V9) — from ethanL30's handoff to surya-prasanna

## Missing / needed
- [C6] At 375×812, Everyone's votes clips the tally counts when several players choose the same target. A six-voter row made the overlay 442 px wide. Repro and a tested CSS adjustment in the vote-tally-clipping handoff — app/vote-results.css, C3 owner (surya-prasanna) — [found by codex@surya]
<!-- anything an agent noticed is missing, broken, or needed by someone else -->
<!-- - thing — who needs it — [found by agent@human] -->
- **Live: https://172-232-188-135.sslip.io** (Ethan's Linode, main at 8ab8147). **All three Akamai services are on (checked 14:02):** `/api/health` → model `qwen3-8-27b`, `db: up`, `storage: up`; Managed PostgreSQL serves `/api/stats/global` (1 game); Object Storage holds replays and the leaderboard. Redeploys go through ethanL30 — whole team — [found by ethanL30]
- Run the quiz on 5–10 real people (pre → play → post) once the DB is live, then put the real n in the pitch — humans — [found by surya-prasanna]
- Live bots are easy to spot from style alone (style fixed in #22; new: bots now debunk the false story and accuse each other — handoff to codex@jamie): in a live level-2 game both bots wrote ALL CAPS countdowns ("15 MINUTES left", "u die"), and @GretaV (librarian: "precise, links official pages") dropped her persona entirely. checkLine passed all of them. Prompt tuning (SPEC §8, F6 done-when) should keep bots in their persona's voice — game/voice.ts owner (codex@jamie) — [found by claude@sarah]

## In progress
- [ ] [C5] Desktop fills the browser window at 900 px and wider: town left, chat and controls right — app/town/desktop.css, app/main.tsx — branch surya/desktop-layout — [codex@surya]
- [ ] Class/global stats count real tactic use: survival by tactic from tagged public bot posts, not tactics assigned at setup (codex@surya's demo-QA finding 1, handoff 12:35) — db/db.ts, app/Stats.tsx — branch surya/stats-tagged — [surya-prasanna]
- [ ] [V7] Chat avatars match the villagers: swap the `Crew` pebble for `<Villager>` in feed, cast row, votes — app/App.tsx (`Crew`) — ethan/town-design is merged — suggested: surya-prasanna (claude@sarah has not picked it up) — skip if it risks the layout — branch surya/v7-avatars — [surya-prasanna]
- [ ] [V11] Scene polish: fit long handles on the name tags, keep a short post's bubble over its own villager, look at a win (full sunshine) in the browser — app/town/TownScene.tsx, app/town/scene-labels.css, app/town/town.test.tsx — branch surya/scene-polish — [codex@surya]
- [ ] [V9] Phone check of the new look after the merge: full game with sound, light + dark, Start transition, QR scan; findings under Missing — branch surya/v9-phone-qa — [codex@surya]
- [ ] [P1] Provision Managed PostgreSQL (first!), Linode, Object Storage bucket, Cloud Firewall; write docs/DEPLOY.md (SPEC §6) — docs/DEPLOY.md — branch jamie/deploy — [claude@jinmin] (also covers the older "Deploy the game to an Akamai Linode with HTTPS" line)
- [ ] Release verification: credential-free pull-request CI and integrated replay, class stats, and quiz regression coverage — .github/workflows/, integration/ — [codex@jamie]
- [ ] [C1] Six original animal villagers (species from the character's color; same `<Villager>` props), blink, bob, ejected reaction (docs/DESIGN_BRIEF.md Part 2 §2) — app/town/Villager.tsx — branch ethan/cozy-villagers — PR #58 open, 262 tests, played at 375 px — [ethanL30]
- [ ] [C2] Bright daytime look on every screen: one palette (no dark mode, no dark mood), Fredoka rounded font, speech-bubble chat with nameplates, pill buttons, less text (Part 2 §1) — app/town/theme.css, app/town/town.css, app/StartScreen.tsx, package.json (font) — branch ethan/cozy-villagers — PR #58 open, 262 tests, played at 375 px — [ethanL30]
- [ ] How to play page (/howto.html, linked from the start screen and the game) + a one-line hint per phase in the game so it is easier to understand (Ethan, 14:04) — howto.html, app/HowTo.tsx, app/howto.css, app/town/PhaseHint.tsx (new); one line each in app/App.tsx, app/StartScreen.tsx, vite.config.ts — branch ethan/how-to-play — [ethanL30]

## Blocked

## Done
- [x] [C6] Captured seven redesign screens at 1440×900 and 375×812 after C1–C5 merged; reviewed both sets and logged the clipped phone tally — branch surya/cozy-screenshots — [codex@surya]
- [x] Judging 40%: a feature that depends on another Akamai Cloud service, e.g. shareable post-game replays + global leaderboard in Akamai Object Storage or a Managed Database. Humans pick the service, then a decision record — server/, app/ — new store/ folder + app/ share + leaderboard screens; Object Storage (decision 002) — PR #16 open from ethan/replay-storage: runs on local files, 57/57 tests; still needs a bucket + keys (P1) to verify on real Object Storage, and the mount line in server/ — VERIFIED LIVE 14:02: `node store/selftest.ts` on the Linode prints PASS against the real bucket (Chicago); a saved game reads back with source "object-storage"; PRs #16, #25, #28 — [ethanL30]
- [x] Reveal opens at the top: finishing a game after scrolling the feed kept the old scroll position, so the reveal opened below its town scene and result heading (codex@surya's finding) — app/App.tsx (`GameOver`, one effect) — claude@sarah's area, not on her status — branch surya/reveal-scroll, PR from surya/reveal-scroll; checked at 375×812: page scrolled to the bottom all game, reveal opens at the top — [surya-prasanna]
- [x] [C5] Full-window desktop game at 900 px and wider: town left, scrollable chat and controls right — app/town/desktop.css, app/main.tsx — branch surya/desktop-layout — [codex@surya]
- [x] [C4] Walk your villager around the square during intermissions: WASD / arrows, tap-to-move; visual only (Part 2 §3) — app/town/Walker.tsx (new) + one prop in TownScene.tsx — PR from surya/walker: 2 tests, checked at 375×812 (keys, tap, ignores typing, gone after the news phase) — [surya-prasanna]
- [x] Class/global stats count real tactic use: survival by tactic from tagged public bot posts, not tactics assigned at setup (codex@surya's demo-QA finding 1, handoff 12:35) — db/db.ts, app/Stats.tsx — PR from surya/stats-tagged: new SQL test, /stats.html?class= checked at 375 px with 12 simulated games — [surya-prasanna]
- [x] [V7] Chat avatars match the villagers: `Crew` now draws the town `<Villager>` (32 px tall) in the feed, cast row, vote buttons and reveal — app/App.tsx (`Crew` body only) — PR from surya/v7-avatars, checked at 375×812: no sideways scroll, vote buttons and cast row keep their size — [surya-prasanna]
- [x] [V11] Scene polish: full villager handles, short and long bubbles attached to their own speakers, and a Chrome-verified sunny win — app/town/ — branch surya/scene-polish — [codex@surya]
- [x] Under the Hood: once the model is switched off, later scripted lines show the real reason ("no game server (404)", "model unreachable", or "no model configured" only on the server's 503) instead of always "no model configured" — app/director.ts — PR from surya/model-off-label — [surya-prasanna]
- [x] [C3] Vote results as three screens with animated transitions: the result, your vote, everyone's votes with tallies and the majority highlighted; bright background (docs/DESIGN_BRIEF.md Part 2 §4) — app/VoteResults.tsx (new), `Ejection` in app/App.tsx — PR from surya/vote-screens: 3 tests, played 3 meetings at 375×812 (screens at 0 / 3.1 / 6.3 s, overlay closes at 9.9 s, tap skips ahead) — [surya-prasanna]
- [x] [V8] README + docs/PITCH.md: 2–3 lines on the design (town reacts to the spread; all art and audio original, made in code; one OFL font) — can start now — branch surya/v8-design-docs (codex@jamie busy with load-smoke) — text in PR from surya/v8-design-docs; left: screenshot after ethan/town-design merges, and cut the scene/faces sentence if it misses the freeze — [surya-prasanna] (PR #40 merged)
- [x] [V6] New theme on the separate pages: `import './town/theme.css'` in the stats, quiz and codex entries, check at 375 px light + dark — needs ethan/town-design merged — branch surya/v6-theme-pages: lands now via import.meta.glob, turns on when theme.css merges; 375 px check after the merge — [surya-prasanna] (PR #41 merged)
- [x] Offline demo launcher: production build on loopback, scripted dialogue, isolated replays removed on shutdown; docs and browser-verified save and replay — scripts/offline-demo.ts, docs/README.md — branch surya/offline-demo — [codex@surya]
- [x] [V10] DM open on a phone leaves ~3 lines of chat: shrink the town scene to a strip while a DM is open — app/App.tsx (header class), app/town/town.css — PR from surya/dm-strip: header 228 → 170 px with a DM open at 375×812, bubble pinned inside the strip — [surya-prasanna]
- [x] [V12] Add the public demo link and verified service status — README.md, docs/PITCH.md — branch surya/v12-live-link — [codex@surya]
- [x] [V1] Town square scene behind/above the game: coffee shop, library, water tower, river + bridge, trees, benches; the 6 cast as rounded original villagers; speech bubble + bounce when one talks (docs/DESIGN_BRIEF.md) — app/ (new files) — from Ethan's design brief — branch ethan/town-design — PR #45 merged, live on https://172-232-188-135.sslip.io — [ethanL30]
- [x] [V2] Mood follows "Town infected": clouds, desaturation, red-orange haze, streetlights, faces happy → worried → scared; dark spotlight on ejection; sunshine on a win (docs/DESIGN_BRIEF.md) — app/ — needs V1 — branch ethan/town-design — PR #45 merged, live on https://172-232-188-135.sslip.io — [ethanL30]
- [x] [V3] Restyle the UI to match: rounded, soft, minimal chrome; chunky slab-serif display font (openly licensed) for titles and numbers; chat stays readable on a phone (docs/DESIGN_BRIEF.md) — app/style.css and the other app/*.css — branch ethan/town-design — PR #45 merged, live on https://172-232-188-135.sslip.io — [ethanL30]
- [x] [V5] Lively opening screen + Start transition down into the square; ship a simple fade/zoom first (docs/DESIGN_BRIEF.md) — app/StartScreen.tsx — needs V1 — branch ethan/town-design — PR #45 merged, live on https://172-232-188-135.sslip.io — [ethanL30]
- [x] Header no longer jumps at each round start on phones: phase label "Breaking news" → "News" so the 🔊 button stays in the top row (154 px in every phase at 375 px) — app/App.tsx (one word) — PR from surya/header-jump — [surya-prasanna]
- [x] Sound fixes + extras: audio unlocks on pointerup/click/touchend (first touch tap left it suspended — codex@surya's V9 finding, handoff 13:13), breaking-news chime each round, win/lose sting at game over — app/sound.ts, app/sound.test.ts — PR from surya/sound-touch — [surya-prasanna]
- [x] Scripted fallback fixes (offline lines, what the demo shows with no model): no back-to-back duplicate lines, a question no longer reads as a relayed "source", meeting defenses vary by persona and round, bot defenses carry no tactic tag (skewed the blind spot) — game/voice.ts, game/scriptedVoices.ts — codex@jamie on other work, handoff 12:56 from claude@sarah picked up — PR from surya/scripted-lines, 3 tests, checked in an offline boss game at 375 px — [surya-prasanna]
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
