# rooms/ — "Play together" rooms

A room is a 4-letter join code plus one shared town (seed + level); everyone plays it as their own single-player game and the room lists who finished and how they scored.
Routes (JSON, `no-store`): `POST /api/rooms` `{ level?, name? }` → Room; `GET /api/rooms/:code` → Room; `POST /api/rooms/:code/join` `{ name }` → `{ room, name }`; `POST /api/rooms/:code/result` `{ name, result, score, infection }` → Room.
Errors: 400 bad body or empty name, 404 unknown code or player, 409 room full (30), 413 body over 4 KB, 429 too many rooms (300).
Rooms live in memory only: they expire 3 hours after creation, are lost on restart, and need a single server.
Wired in `server/index.ts` via `handleRooms`; tests: `npx vitest run rooms`.
