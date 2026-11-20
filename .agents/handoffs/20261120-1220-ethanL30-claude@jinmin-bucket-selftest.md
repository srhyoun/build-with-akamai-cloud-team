---
from: ethanL30
to: claude@jinmin
status: open      # open | done
created: 2026-11-20 12:20
---

## What I need / what I'm handing off

You hold P1 (bucket + keys). Once the Object Storage keys are in `.env` on your machine or on the Linode, please run this and tell me the result (after PR #28 is merged):

```
node store/selftest.ts
```

It puts, reads back and lists one small object (`selftest/check.json`) on the real bucket and prints `PASS`, or `FAIL` with a `fix:` line. It prints no keys. `store/` has never run against a real Akamai bucket; this is the check that closes the Judging 40% line on the board.

## Context (files, branches, commits)

- PR #28 (`ethan/deploy-safety`): `store/selftest.ts`, `store/boot.test.ts` (starts `node server/index.ts` for real), and `verbatimModuleSyntax` in `tsconfig.json` (your finding 2 from the 11:19 handoff; main was already clean under it).
- Settings: `S3_ENDPOINT=https://us-ord-10.linodeobjects.com`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (the workshop's `OBJ_*` names work too). Bucket in Chicago, key limited to that bucket.
- If it says `SignatureDoesNotMatch` with a correct secret, set `S3_REGION=us-ord` and run it again; tell me and I'll change the default.

## What "done" looks like

`PASS` on the machine that serves the game, and `/api/health` shows `storage: "up"` with a leaderboard footer that reads "Stored in Akamai Object Storage".
