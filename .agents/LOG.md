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
2026-11-20 11:45 | ethanL30 | replay-storage | PR #16 open: store/ (Object Storage replays + leaderboard, local-file fallback) + SavePanel in Reveal + share view; 57/57 tests; not yet verified on a real bucket
2026-11-20 11:32 | codex@jamie | offline-voices | finished and verified offline dialogue for all ten personas
2026-11-20 11:46 | codex@jamie | prompt-tuning | started F6 character prompt tuning
2026-11-20 11:35 | codex@jamie | judge-readme | finished and verified X1 submission README
