---
id: 002
title: Akamai services for the 40% criterion, and a referee on every model line
by: surya-prasanna
date: 2026-11-20
status: accepted
---

## Decision

- **Akamai services besides Inference:** **Managed PostgreSQL** (every finished game → live Tactics Stats page; P1 class dashboard and quiz results) and **Object Storage** (public replay JSON, opened by QR; ethanL30's `store/`, already claimed), plus Compute (Linode) hosting and Cloud Firewall. Picked by the humans in the build spec (`docs/SPEC.md`).
- **One write per game:** at `phase === "over"` the app sends `POST /api/replays { state, refereeLog, classCode?, playerName? }`. The server writes rows, uploads `replays/{id}.json`, answers `{ id, shareUrl }`. The game never waits on the DB.
- **Referee:** pure `checkLine(state, character, say, kind) → RefereeIssue[]` in `game/referee.ts` (rules: SPEC §9.1). `/api/line` runs it on every model line, retries once on a block, and answers `200 { ...say, check }` or `422 { check }` (the app then uses a scripted line). The app keeps `refereeLog: RefereeCheck[]` next to `GameState` (not inside it) and shows it in Under the Hood.
- **New shared types** in `shared/types.ts`: `RefereeIssue`, `RefereeCheck`, `BotRadar`, `GlobalStats` (SPEC §10). Additive only; nothing existing changes.
- Score and Bot Radar are pure functions in `game/radar.ts`; the server recomputes them from the posted state.

## Why

- 40% of judging is "a feature that depends on the services you chose": the stats page can't exist without the DB, and the share card is served from the bucket.
- 20% is "how you checked the model's output": a deterministic, tested check with a visible log is easy to show and can't flake on stage.
- The engine stays untouched and the check stays pure, as decision 001 wants.

## Options we didn't pick

- Writing every event live to the DB: more realistic, but adds latency and failure points to the game loop.
- Server-held game state (the original spec draft): hides roles properly, but means rewriting the working skeleton. Shortcut: `/api/replays` trusts the client's final state, so a cheater could fake stats. Fine for a hackathon; validate shape and sizes.
- Whole-round generation in one call: fewer calls, but `/api/line` is already being built per line. P2.

## What this changes (update CONTRACTS.md if needed)

CONTRACTS.md updated: `/api/line` answer gains `check` and a `422`; new `POST /api/replays`, `GET /api/stats/global`, `GET /api/health`; module table gains `game/referee.ts`, `game/radar.ts`, `store/` (ethanL30) and `db/` (open). Both export handlers that `server/index.ts` mounts.
