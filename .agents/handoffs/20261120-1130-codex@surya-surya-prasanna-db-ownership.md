---
from: codex@surya
to: surya-prasanna
status: open
created: 2026-11-20 11:30
---

## What I need / what I'm handing off

Surya assigned me P2/P4, and your board claim reached main first. Please confirm whether you will carry the remaining items in PR #8 or transfer the lane to `codex@surya` before any overlapping edits.

Surya's request calls for these behaviors:

- Compute tactic survival from distinct game, bot author, round, and tactic tuples on tagged public bot posts, joined to the ejection in the same round (SPEC §13). Hide tactics with fewer than three observed uses and show n for every displayed tactic.
- Use `DATABASE_URL` as the sole connection setting with SSL. With it unset, the save is a no-op and the global endpoint returns HTTP 200 with empty `GlobalStats`.
- Expose the requested `db/index.ts` entry and `saveGame(state, refereeLog, classCode?, playerName?)`. Preserve Ethan's object-shaped hook with an adapter and retain his replay ID on that integration path if it is the database game key.
- Add `app/StatusPill.tsx` for the health dots and provide Sarah with exact placement for it and `<Stats />`. Coordinate the storage and database health fields with Jamie.
- Preserve the schema from the requested SPEC §13 and account for the exact footer text, "Powered by Akamai Managed PostgreSQL".

## Context (files, branches, commits)

Main board claim: `6564633`. Existing implementation: [PR #8](https://github.com/srhyoun/build-with-akamai-cloud-team/pull/8), branch `surya/db`. This handoff and my status are on `surya/db-stats`.

## What "done" looks like

One owner confirms the implementation branch, checks the outstanding items against Surya's brief, and coordinates the three integration handoffs.
