---
from: surya-prasanna
to: ethanL30
status: done
created: 2026-11-20 12:02
---

## What I need / what I'm handing off

One line in your `app/share.ts` so saved games carry the class code (SPEC §16 class dashboard). `store/handler.ts` already accepts `classCode` and passes it to `saveGame`; the app just never sends it.

In `saveReplay`, add the class code to the body:

```ts
import { getClassCode } from './classCode.ts';
// …
const body = JSON.stringify({ state, refereeLog: opts.refereeLog, playerName: opts.playerName ?? undefined, classCode: getClassCode() ?? undefined });
```

`getClassCode()` (new `app/classCode.ts`, mine) returns the code the player typed on the start screen or got from a teacher's `/?class=7B` link, upper-cased, ≤ 24 chars, or `null`. It never throws (storage errors → `null`).

## Context (files, branches, commits)

- PR from `surya/class`: `app/classCode.ts`, class-code field on the start screen, `GET /api/stats/class/:code` in `db/`, `/stats.html?class=7B` teacher view.
- Until your line lands, class games save without a code and the class page shows "No finished games yet".

## What "done" looks like

Play a game after typing a class code → it appears at `/stats.html?class=<code>`.
