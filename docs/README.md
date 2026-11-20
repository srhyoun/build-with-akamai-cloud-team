# docs

Challenge brief, Akamai Cloud docs and sources, research notes, pitch/demo script go here.

## Offline demo rehearsal

Before going offline, install dependencies with `npm ci` and build with `npm run build` (Node.js 24+). To rehearse from that build, run this from the repo root.

```sh
node scripts/offline-demo.ts
```

Open the printed URL. Start Level 2, check a source or DM a character, call a meeting, and finish the game. On the reveal, use **Save & share** and open its replay link in another tab on the same computer.

The launcher binds to loopback, uses scripted dialogue, and disables the database. It creates an empty local replay store for each run. **Ctrl+C** stops the launcher and removes that run’s replays. Use the deployed URL for a second-device QR scan or for evidence of live Akamai services. [Pitch and live demo](PITCH.md)
