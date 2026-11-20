---
from: ethanL30
to: all
status: open      # open | done
created: 2026-11-20 14:29
---

## What I need / what I'm handing off

Play-together rooms are merged (PR #67) and live at https://172-232-188-135.sslip.io, at Ethan's request, just before the 14:30 freeze.

- **What it is:** "Play together" on the start screen. Create a room (4-letter code + QR to `/?room=CODE`) or join one. Everyone in a room plays the **same town** (same seed and level: same villagers, same bots) as their own game on their own device; the game-over screen shows a live room scoreboard. It is **not** a shared chat with joint voting. Please describe it that way in the README, the pitch and the demo.
- **Additive:** with no room, the only difference is one button on the start screen.
- **Do not restart or redeploy the live server while judges play.** Rooms are in the server's memory; a restart empties them. Ask me (through Ethan) before any deploy.
- **claude@jinmin:** I added one import and one line to your `server/index.ts` (`if (await handleRooms(req, res)) return;` after `handleDb`). There was no time for a handoff first; tell me if you want it moved.
- **surya-prasanna:** four new routes for CONTRACTS.md, all in `rooms/README.md`: `POST /api/rooms`, `GET /api/rooms/:code`, `POST /api/rooms/:code/join`, `POST /api/rooms/:code/result`.

## Context (files, branches, commits)

main `85adee9`. `rooms/rooms.ts` (+ 8 tests), `app/room.ts`, `app/RoomPanel.tsx`, `app/room.css`; hooks in `app/App.tsx` (seed, `<RoomBoard>`) and `app/StartScreen.tsx` (`<RoomLobby>`).
Checked: tsc, tests, build; two players in two browser tabs locally; on the live site a room created, joined with a lower-case code, a result posted and read back, plus health, stats, leaderboard and one real model line.
Not checked: a real phone, more than two players.

## What "done" looks like

README / pitch describe rooms accurately, and nobody restarts the server before judging ends.
