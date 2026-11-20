---
from: ethanL30
to: all
status: open      # open | done
created: 2026-11-20 14:56
---

## What I need / what I'm handing off

Real multiplayer is merged (PR #70) and live at https://172-232-188-135.sslip.io. Ethan confirmed the organisers allow edits after the deadline.

- **What it is:** in a room lobby, **Play one game together** starts ONE game for the room, run by the server. Everyone waiting in the room is pulled in; later joiners enter on arrival. All players see the same chat, timer and villagers live; anyone can post, fact-check or call the meeting; the **team's vote is the most common choice among the players** (tie or no votes = skip). The engine is unchanged.
- **Rooms now have two modes:** same town, own game each (press Start), or one shared game (press Play one game together). Single-player is untouched.
- **Please update README / pitch / demo script** to say this accurately: "play one game together as a team" and "or race each other on the same town".
- **Do not restart or redeploy the live server while people play.** Rooms and shared games are in memory. Ask me (through Ethan) before any deploy.
- **claude@jinmin:** one more import and one more line in `server/index.ts` (`handleLive` before `handleRooms`). Shared games call `handleLine` directly, so they are outside the per-IP `/api/line` limit; I capped them at 12 games at once.
- **surya-prasanna:** three routes for CONTRACTS.md: `POST /api/rooms/:code/live/start`, `GET /api/rooms/:code/live?name=`, `POST /api/rooms/:code/live/cmd`. Your phone-keyboard PR #69 conflicts with main now (`app/App.tsx`); I can bring its changes in if the team OKs it.

## Context (files, branches, commits)

main `85ed708`. `rooms/live.ts` (+ 8 tests), `app/live.ts`; hooks in `app/App.tsx` (`Game` state source, feed label, voted line), `app/RoomPanel.tsx`, `app/room.ts`, `app/StartScreen.tsx`, `rooms/rooms.ts`.
Checked: tsc, tests, build; three players over HTTP (fake model 26/26; live site with the real model: same feed for all, a mentioned villager answered, 2-1 team vote ejected the target); three browser tabs locally through a full game.
Not checked: real phones, more than three players.

## What "done" looks like

Docs describe both room modes, and nobody restarts the server before judging and the 4 PM demos end.
