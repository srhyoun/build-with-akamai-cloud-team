# Activity log

Append only. One line per meaningful action. Newest at the bottom.
`YYYY-MM-DD HH:MM | agent@human | task | what you did`

2026-11-20 10:42 | claude@sarah | setup | new team repo from asigurdsDEV/build-with-akamai-cloud
2026-11-20 10:52 | claude@sarah | setup | removed stale Aiden/Caleb references from status files, board, README, AGENTS.md
2026-11-20 10:58 | surya-prasanna | setup | agent online
2026-11-20 10:59 | ethanL30 | setup | agent online
2026-11-20 11:02 | ethanL30 | replay-storage | claimed Judging 40% (Object Storage replays + leaderboard), branch ethan/replay-storage
2026-11-20 10:59 | codex@jamie | setup | agent online
2026-11-20 11:01 | claude@jinmin | setup | agent online
2026-11-20 11:04 | claude@jinmin | llm-endpoint | claimed LLM endpoint (server/), branch jamie/llm-endpoint
2026-11-20 11:06 | codex@jamie | start-screen | claimed start screen and notified Ethan of the game initialization change
2026-11-20 11:07 | claude@jinmin | setup | README: made claude@jinmin as Jamie's main agent unambiguous
2026-11-20 11:08 | codex@jamie | start-screen | finished and verified both levels, ready for review
2026-11-20 11:08 | surya-prasanna | spec | docs/SPEC.md + decision 002 + CONTRACTS update + spec tasks on BOARD; handoffs to all and claude@jinmin
2026-11-20 11:14 | surya-prasanna | spec | realigned spec to ethanL30's store/ claim (Object Storage) + new db/ lane (Managed PostgreSQL), tags updated to claude@jinmin
2026-11-20 11:10 | claude@jinmin | llm-endpoint | server/ done on jamie/llm-endpoint, PR #4 open (19/19 tests, tested with a fake model); needs a real Akamai Inference key to test live
2026-11-20 11:22 | surya-prasanna | referee | merged PR #2 (spec + decision 002); claimed R1 + R2, branch surya/referee
2026-11-20 11:38 | surya-prasanna | referee | R1 checkLine + R2 radar with 17 tests (27/27 total), decision-002 types, CONTRACTS env vars from claude@jinmin; PR from surya/referee
2026-11-20 11:48 | surya-prasanna | under-the-hood | merged PR #5 (R1+R2); claimed R3, branch surya/under-the-hood
2026-11-20 11:14 | ethanL30 | replay-storage | handoffs: mount line to claude@jinmin, final route shapes to surya-prasanna; building store/ with local-file fallback
2026-11-20 12:02 | surya-prasanna | under-the-hood | R3 done: referee log + Under the Hood drawer, browser-side checkLine until /api/line sends check; tested with a leaking fake model; PR from surya/under-the-hood
2026-11-20 12:08 | surya-prasanna | under-the-hood | ethanL30's store/ route shapes into CONTRACTS.md + SPEC §6/§12/§14 (private bucket in Chicago); handoff done
2026-11-20 11:19 | claude@jinmin | llm-endpoint | handoff to all: game/voice.ts "null" citation bug, tsconfig verbatimModuleSyntax, workshop facts (team size, inference, deploy, judging)
2026-11-20 11:20 | codex@jamie | pitch-demo | started the pitch and 30-second demo script
2026-11-20 11:21 | codex@jamie | pitch-demo | finished pitch, timed demo script, and rehearsal checks
2026-11-20 11:23 | claude@jinmin | llm-endpoint | PR #4 updated: workshop env names, structured output, review fixes, referee in /api/line (I2), clean untrusted text (I4); 50/50 tests, e2e with fake model
2026-11-20 11:29 | claude@jinmin | llm-endpoint | tested live on Akamai Cloud Inference (qwen3-8-27b): 4/4 lines 200 + referee pass; moved to Done, PR #4 awaiting merge
2026-11-20 11:31 | codex@jamie | offline-voices | started persona dialogue for the scripted fallback
2026-11-20 11:31 | claude@jinmin | tactic-tag | claimed model tactic tag + prompt fixes (game/voice.ts), branch jamie/tactic-tag; moved I2 and Judging 20% check to Done (PR #4)
2026-11-20 11:32 | claude@sarah | reveal | claimed [F1] reveal screen, branch sarah/reveal
2026-11-20 11:33 | claude@jinmin | tactic-tag | PR #10 open: model bot lines carry their tactic tag, "cited": null fix; 51/51 tests, live 3/3 bot lines tagged; moved to Done
2026-11-20 12:35 | surya-prasanna | db | P2+P4 done: db/ (saveGame, stats, health, auto schema) + /stats.html; 8 tests on PGlite; browser-checked with simulated games; handoffs to claude@jinmin (mount) and ethanL30 (hook); PR from surya/db
2026-11-20 11:34 | codex@jamie | judge-readme | started X1 submission README
2026-11-20 11:33 | claude@jinmin | deploy | claimed P1 (provision + docs/DEPLOY.md, also the older Deploy-with-HTTPS line), branch jamie/deploy
2026-11-20 11:50 | claude@jinmin | deploy | docs/DEPLOY.md + deploy/ (cloud-init Node 24 + Caddy, systemd unit as non-root, env template with workshop names); dry run: git archive → build → start on 8080 from the env file, /api/health ok
2026-11-20 11:35 | claude@sarah | reveal | [F1] reveal screen built (Bot Radar, roles + tactic chips, bot timeline), 2 render tests, 37/37 tests + build pass; handoff to ethanL30 for the SavePanel slot
2026-11-20 11:41 | surya-prasanna | quiz | claimed P7 pre/post quiz, branch surya/quiz
2026-11-20 11:41 | codex@jamie | ejection-animation | started the local ejection animation
2026-11-20 11:42 | claude@sarah | plan | task plan to all (handoff); claimed town map + more scenarios; merging the open PR backlog next
2026-11-20 11:37 | codex@surya | status-pill | claimed the StatusPill follow-up; branch surya/status-pill
2026-11-20 11:44 | codex@surya | status-pill | mounted the game footer pill, verified polling and health fallback in Chrome, and handed off server integration
2026-11-20 11:45 | ethanL30 | replay-storage | PR #16 open: store/ (Object Storage replays + leaderboard, local-file fallback) + SavePanel in Reveal + share view; 57/57 tests; not yet verified on a real bucket
2026-11-20 11:32 | codex@jamie | offline-voices | finished and verified offline dialogue for all ten personas
2026-11-20 11:46 | codex@jamie | prompt-tuning | started F6 character prompt tuning
2026-11-20 11:35 | codex@jamie | judge-readme | finished and verified X1 submission README
2026-11-20 11:49 | claude@sarah | merge-backlog | merged #4, #10, #9, #3, #13, #7, #11 into main (conflicts only in coordination files, plus App.tsx imports and #4/#10 server overlap, resolved keeping both); 61/61 tests, build, server starts
2026-11-20 11:45 | surya-prasanna | quiz | P7 done: game/quiz.ts + quiz_responses + POST /api/quiz, GET /api/quiz/results + /quiz.html; 44/44 tests, tsc + build green, browser-checked at phone width on PGlite; PR from surya/quiz
2026-11-20 11:52 | claude@jinmin | server-mounts | claimed: mount store/ + db/ in server, [I3] referee model scores, per-IP rate limit on /api/line; branch jamie/server-mounts
2026-11-20 11:53 | surya-prasanna | quiz | PR #15 merged into main (by srhyoun's backlog merge); restored the two quiz Missing lines on BOARD
2026-11-20 11:42 | codex@jamie | ejection-animation | verified the ejection animation and reduced-motion behavior in Chrome
2026-11-20 11:48 | codex@jamie | prompt-tuning | completed F6 and verified prompt behavior with local fixtures
2026-11-20 11:54 | claude@sarah | merge-backlog | merged #16 replay storage, #15 quiz, #17 status pill, #14 ejection animation, #18 prompt tuning (coordination-file conflicts only, both sides kept); 90/90 tests, build, server serves /, /stats.html, /quiz.html; no open PRs
2026-11-20 11:58 | surya-prasanna | codex | claimed Tactic Codex screen, branch surya/codex
2026-11-20 11:56 | claude@jinmin | server-mounts | PR #19 open: store/ + db/ mounted, I3 referee model scores, 40/min per-IP rate limit on /api/line; 93/93 tests, live check ok; mount/referee handoffs set to done
2026-11-20 11:57 | surya-prasanna | codex | Tactic Codex done: /codex.html + start-screen links to Codex and pre-quiz; handoff to claude@sarah for reveal links; PR from surya/codex
2026-11-20 12:00 | surya-prasanna | codex | PR #20 merged into main (Tactic Codex + start-screen links)
2026-11-20 12:02 | surya-prasanna | class | claimed class code + class dashboard, branch surya/class
2026-11-20 12:00 | claude@sarah | live-check | M1 met on merged main: live Akamai Cloud Inference (qwen3-8-27b) in the game, 5/5 lines passed checkLine (median 2.5 s), plus 4/4 direct /api/line calls (bot post, human post, bot DM reply, human defense) with tactic tags; local only, not deployed
2026-11-20 12:01 | codex@surya | demo-qa | started local browser and API verification on surya/demo-qa
2026-11-20 12:04 | surya-prasanna | class | class dashboard done: /api/stats/class/:code + /stats.html?class= + start-screen class code; handoff to ethanL30 (send classCode on save); removed my stale tactic-tag Missing line; PR from surya/class
2026-11-20 12:07 | surya-prasanna | class | PR #21 merged into main (class code + class dashboard)
2026-11-20 12:05 | claude@jinmin | playthrough | 2 full live games (real model): whole flow works; fixed referee-model latency on PR #19 (13 s -> 7 s worst line); handoff to all: Under the Hood covers vote buttons, bot dominates chat, no feedback on lost vote
2026-11-20 12:06 | codex@jamie | chatter-balance | started the live playthrough dialogue follow-up
2026-11-20 12:08 | surya-prasanna | uth-vote | claimed fix: Under the Hood covers the vote buttons (playthrough finding 1), branch surya/uth-vote
2026-11-20 12:08 | claude@jinmin | vote-feedback | merged PR #19 (store/db mounted, referee model, rate limit); claimed ejection-screen vote feedback; post-round replay task moved to Done (covered by the reveal)
2026-11-20 12:12 | surya-prasanna | uth-vote | Under the Hood hidden during the meeting (playthrough finding 1); test + browser check; PR from surya/uth-vote
2026-11-20 12:15 | surya-prasanna | uth-vote | PR #23 merged into main (Under the Hood hidden during the meeting; claude@jinmin's playthrough finding 1 fixed)
2026-11-20 12:09 | claude@jinmin | vote-feedback | PR #24 open: ejection screen explains a lost vote (tie / skip majority / you skipped) with the count; 103/103 tests, browser check
2026-11-20 12:11 | ethanL30 | class-code | PR #25 open: saveReplay sends classCode (surya-prasanna's handoff 12:02 done); 99/99 tests
2026-11-20 12:07 | codex@jamie | chatter-balance | verified balanced chatter turns and updated camouflage prompt locally
2026-11-20 12:13 | claude@sarah | plan | merged #24 vote feedback + #22 chatter balance; handed More scenarios to surya-prasanna (handoff); doing reveal Codex/quiz links, then town map
2026-11-20 12:13 | claude@sarah | reveal-links | reveal links each tactic chip to /codex.html#<tactic> and adds the post-quiz link (surya-prasanna's handoff, now done); 105/105 tests
2026-11-20 12:13 | ethanL30 | class-code | merged PR #25 into main (saved games carry the class code); tsc + tests green on main
2026-11-20 12:15 | claude@sarah | town-map | town map (5 districts fill in spread order) replaces the spread bar in the header and shows the final spread on the reveal card; 107/107 tests, checked at 375 px in light + dark
2026-11-20 12:17 | ethanL30 | deploy-safety | claimed: boot test for node server/index.ts, verbatimModuleSyntax, store/selftest.ts; removed my two covered Missing lines (40% feature, 20% check)
2026-11-20 12:20 | surya-prasanna | class | verified end to end on main (after #25, #26): game from /?class=7b saved from the reveal shows in /api/stats/class/7b; reveal links to Codex + post-quiz work; cleared the classCode Missing line
2026-11-20 12:19 | claude@sarah | live-check | #22 live: 0/12 bot lines all-caps, personas hold; but 5/12 bot lines debunk the false story and bots accused each other — handoff to codex@jamie. Board: removed 3 resolved Missing lines (health mount, 40% feature, 20% check)
2026-11-20 12:20 | ethanL30 | deploy-safety | PR #28 open: boot test (node server/index.ts), verbatimModuleSyntax, node store/selftest.ts; handoff to claude@jinmin to run the self-test on the real bucket; 109/109 tests
2026-11-20 12:22 | claude@sarah | pitch-deck | [X2] drafted the 5-slide deck (SPEC §24.2: title, problem, loop, Akamai services + referee, impact) as a Claude artifact owned by Sarah; placeholders for live URL and quiz numbers; speaker notes follow §24.1 beats
2026-11-20 12:22 | ethanL30 | deploy-safety | merged PR #28 into main (boot test, verbatimModuleSyntax, store/selftest.ts); tsc + 109/109 tests green on main; task moved to Done
2026-11-20 12:29 | surya-prasanna | scenarios | claimed More breaking-news scenarios (handoff from claude@sarah), branch surya/scenarios
2026-11-20 12:36 | surya-prasanna | scenarios | 3 new scenarios + game/scenarios.test.ts (all scenarios pass the referee); handoff from claude@sarah set to done; PR from surya/scenarios
2026-11-20 12:40 | surya-prasanna | scenarios | PR #29 merged into main (3 new scenarios)
2026-11-20 12:31 | codex@jamie | release-verification | started pull-request CI and integrated HTTP regression coverage
2026-11-20 12:42 | surya-prasanna | boss | claimed boss level (Surya asked), decision 003 (level 1|2|3); removed the team-size Missing line (humans confirmed 4 is fine); branch surya/boss
2026-11-20 12:33 | codex@jamie | release-verification | verified the integrated release tests; workflow push requires GitHub workflow permission
2026-11-20 12:40 | claude@sarah | ui-fixes | merged #30 release verification; pinned composer + meeting button above the Under the Hood button (checked at 375 px with live posts arriving), BREAKING: instead of NEWS: in the grocery scenario, chat-pebble avatars replace the visor crewmate (SPEC §15 IP rule)
2026-11-20 12:52 | surya-prasanna | boss | boss level done (level 3, decision 003), 4 tests, browser-checked; waits on ethanL30 for store/replay.ts level 3; PR from surya/boss
2026-11-20 12:56 | surya-prasanna | boss | PR #31 merged into main (boss level, level 3); store/replay.ts level-3 check still with ethanL30
2026-11-20 12:35 | codex@surya | demo-qa | completed local browser and API QA on 8ac42b0, retested class and reveal links, and reported the stats sample mismatch
2026-11-20 13:00 | surya-prasanna | boss | with Surya's OK, edited ethanL30's store/replay.ts to accept level 3 (+ store test); handoff 20261120-1243 set to done with a note; PR from surya/boss-save
2026-11-20 13:04 | surya-prasanna | boss | PR #34 merged into main (store accepts level 3: boss games save)
2026-11-20 12:42 | claude@sarah | merge | merged #30 release verification, #33 UI fixes, #32 demo QA; flaky 413 server test noted on board for claude@jinmin; 117/117 + 1 skipped on main
2026-11-20 12:47 | ethanL30 | handover | Ethan's design brief added as docs/DESIGN_BRIEF.md + Open tasks V1-V5; Judging 40% last step (live bucket check) handed to claude@jinmin; my files released; I only track the deadline now
2026-11-20 12:51 | ethanL30 | town-design | claimed V1-V5 (design brief): scene, mood, restyle, sounds, start transition; branch ethan/town-design; PR by ~14:15
2026-11-20 12:54 | surya-prasanna | v4-sounds | claimed [V4] original sounds (handed over by ethanL30, handoff 12:47; Surya chose it), branch surya/v4-sounds, new file app/sound.ts
2026-11-20 12:56 | claude@sarah | bugfixes | bug sweep: full offline boss game, save, replay, codex, quiz, stats at 375 px — no console errors; fixed avatar shrink (boss handles overlapped), boss level label, link underline; scripted-line bugs handed to codex@jamie
2026-11-20 13:05 | surya-prasanna | v4-sounds | V4 done: app/sound.ts (Web Audio only) + 4 tests + 3 hook lines in App.tsx, browser-checked (plays after the Start tap, mute stops it); handoff to ethanL30 to drop sounds from ethan/town-design; PR from surya/v4-sounds
2026-11-20 12:58 | claude@sarah | header | merged #36 V4 sounds; sound toggle moved into the header's top row and phase label "Investigate" so the pinned header stays one row on phones (182 → 153 px)
2026-11-20 12:58 | ethanL30 | town-design | V4 sounds stay with surya-prasanna (PR #36): dropping my own sound code, their handoff done; small pieces V6-V9 (theme on other pages, avatars, README/pitch lines, phone check) Open for other agents, handoff to all
2026-11-20 12:59 | codex@jamie | load-smoke | started mixed-load verification before code freeze
2026-11-20 13:03 | surya-prasanna | v8-design-docs | claimed [V8] README + pitch design lines (ethanL30 handoff 12:58; codex@jamie busy with load-smoke), branch surya/v8-design-docs
2026-11-20 13:00 | codex@jamie | load-smoke | verified 24 and 40 concurrent local games plus the dialogue rate limit
2026-11-20 13:07 | surya-prasanna | v8-design-docs | README 'Look and sound' section + 1 pitch paragraph (town reacts to the spread, original art/audio made in code, Alfa Slab One OFL); screenshot waits on ethan/town-design; PR from surya/v8-design-docs
2026-11-20 12:59 | claude@jinmin | flaky-413 | 413 test retries twice (Missing item from claude@sarah); cause not reproducible: 0 fails in 20 full suites + 1,600 direct uploads; branch jamie/flaky-413
2026-11-20 13:05 | claude@sarah | merge | merged #38 flaky-413 retry, #39 load smoke, #40 V8 design docs; removed resolved flaky-test Missing line. Deploy (P1) still has no cloud resources: needs a human with the Akamai account
2026-11-20 13:06 | surya-prasanna | v8-design-docs | PR #40 merged; handoff to ethanL30: push town-design WIP; README scene/font lines get cut if it misses 14:10
2026-11-20 13:08 | surya-prasanna | v6-theme-pages | claimed [V6] theme on stats/quiz/codex pages, branch surya/v6-theme-pages
2026-11-20 13:06 | ethanL30 | deploy | deployed main (0a3e55a) on Ethan's Linode 172.232.188.135 per docs/DEPLOY.md: whosthebot + Caddy running, local health ok (model null, db off, storage up); HTTPS blocked until Ethan opens 80/443 in the firewall; env keys empty; handoff to all
2026-11-20 13:16 | surya-prasanna | phone-check | emulated 375x812 baseline on main (pre town design): start, DM, Account Age, meeting, vote, ejection, dark mode, stats/quiz/codex/class link: no app errors (only /api 502s: Vite alone, no game server, scripted fallback), no sideways scroll; 3 findings under Missing (header jump on Breaking news, duplicate scripted line, little chat visible with a DM open). Real-phone V9 (sound, QR, new look) still open for after ethan/town-design
2026-11-20 13:18 | ethanL30 | town-design | PR #45 open: town square scene + villagers + speech bubbles (V1), mood by infection + ejection spotlight (V2), theme + OFL display font (V3), opening + start transition (V5); sounds stay surya-prasanna's; 126 tests, browser-checked at 375 px light + dark
2026-11-20 13:25 | ethanL30 | town-design | merged PR #45 (design brief V1-V3, V5); main 5605b2b green (126 tests); redeployed Ethan's Linode: LIVE at https://172-232-188-135.sslip.io with HTTPS, new design and font served; health: model null, db off, storage up (keys still empty)
2026-11-20 13:32 | ethanL30 | handover | more tasks to surya-prasanna / codex@surya: L1 live-site phone check, V10 DM-open layout, V11 scene polish (name tags, bubble, win sunshine), V12 live URL in README + PITCH, V7 avatars; their 13:06 handoff done
2026-11-20 13:36 | codex@surya | v12-live-link | claimed the public demo URL and service status in README and pitch
2026-11-20 13:37 | ethanL30 | deploy | live site now uses Akamai Cloud Inference: Ethan put the key on the server; /api/health shows model qwen3-8-27b; 3 live /api/line calls (bot post, human post, bot defense) 200 in 4.0-4.8 s, referee pass; db still off, storage local
2026-11-20 13:39 | codex@surya | v12-live-link | verified HTTPS, Cloud Inference configuration, DB off and local storage; documented the public link and moved V12 to Done
2026-11-20 13:11 | surya-prasanna | v6-theme-pages | stats/quiz/codex load app/town/theme.css via import.meta.glob (1 line each): build green without the file; with a probe file the theme loads last on all 3 pages; 375 px light/dark check after ethan/town-design merges; PR from surya/v6-theme-pages
2026-11-20 13:20 | surya-prasanna | header-jump | phase label Breaking news -> News (one word in App.tsx PHASE_NAMES): header 154 px in News and Investigate at 375 px, was 182 vs 154; Missing line moved to Done; PR from surya/header-jump
2026-11-20 13:24 | surya-prasanna | sound-touch | fixed codex@surya's touch finding (handoff 13:13, on surya/v9-phone-qa): unlock on pointerup/click/touchend/keydown instead of pointerdown; + news chime, win/lose sting; tests 19/19, build green; browser: AudioContext running after the first tap, mute silent; real touch phone still to confirm; PR from surya/sound-touch
2026-11-20 13:30 | surya-prasanna | scripted-lines | offline fallback: no back-to-back duplicate lines, question no longer reads as a relayed source, defenses vary by persona and round, bot defenses untagged (blind spot fix); 3 tests; offline boss game checked at 375 px; handoff 12:56 (claude@sarah -> codex@jamie) done; PR from surya/scripted-lines
2026-11-20 13:25 | codex@surya | offline-demo | published board claim; starting isolated local production demo launcher
2026-11-20 13:29 | codex@surya | offline-demo | verified production build, launcher isolation and shutdown, and 375 px browser game through save and replay; moved task to Done
2026-11-20 13:36 | surya-prasanna | dm-strip | claimed [V10] (ethanL30 handoff 13:32): town scene shrinks to a strip while a DM is open; branch surya/dm-strip
2026-11-20 13:48 | surya-prasanna | dm-strip | V10 done: with a DM open the town scene is a 96 px strip (pinned header 228 -> 170 px at 375x812), speech bubble pinned to the strip top, 2 lines, no tail; full scene back when the DM closes; Missing line removed; ethanL30: redeploy after merge; PR from surya/dm-strip
2026-11-20 13:41 | claude@sarah | merge | merged #41 V6, #42 header, #44 sound-touch, #46 scripted lines, #47 offline demo, #48 DM strip; repaired conflict markers my merge script committed to BOARD.md/LOG.md (kept every line, deduped); #43 left as draft
2026-11-20 13:47 | surya-prasanna | v7-avatars | claimed [V7] (ethanL30 handoff 13:32): Crew avatar draws the town Villager in feed, cast row, votes, reveal; branch surya/v7-avatars
