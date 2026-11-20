---
id: 001
title: Stack and module shape for Who's the Bot?
by: open
date: 2026-11-20
status: accepted
---

## Decision

- **Browser game in TypeScript + Vite + React**, mobile-first (the audience plays on phones). Same stack as our last hackathon, so everyone's agents already know it.
- **Pure game engine** in `game/`: `init(seed, level)` → state, `step(state, command)` → new state. No I/O, seeded randomness, never mutates its input. The UI only sends Commands (`shared/types.ts`).
- **Characters talk through a model** on **Akamai Cloud Inference**, called from a small server in `server/` (owner: Jamihuh21). The server builds each prompt with `buildPrompt()` and turns the answer into a `say` command with `parseLine()`, both from `game/voice.ts`, so prompts stay in one place. The key never reaches the browser. Request/response shape in CONTRACTS.md.
- **Scripted fallback:** if no model is set (503) or it fails, the app uses canned lines from `game/voice.ts`, so the game always runs offline and in tests.
- **Akamai Cloud services:** Cloud Inference (the characters' model), Compute / a Linode (hosts the game and `server/`), plus one more service that a feature depends on, for the 40% judging criterion. Proposed: Object Storage for shareable post-game replays, or a Managed Database for a global leaderboard. The humans pick; that gets its own decision record.
- Clues are **pre-generated at game setup** (as the design doc says): instant, free, consistent.

## Why

- Pure engine = easy to test and lets 6 people build UI, content, prompts and deploy in parallel.
- Akamai Cloud Inference is 20% of the judging (see Ethan's rubric handoff, 2026-11-20 10:28), and so is showing how we checked the model's output: that check belongs next to the prompts in `game/voice.ts`.
- Scripted fallback means a demo never dies on stage because of a model outage.

## Options we didn't pick

- A game server holding hidden roles: more secure, but single-player runs fine in the browser. Shortcut: roles are in the client state, so devtools can reveal them. Fine for a hackathon.
- Multiplayer: the design is one player vs. 6 AI characters.

## What this changes (update CONTRACTS.md if needed)

CONTRACTS.md filled in from this.
