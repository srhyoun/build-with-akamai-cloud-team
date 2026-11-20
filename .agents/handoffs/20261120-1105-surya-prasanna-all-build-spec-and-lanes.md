---
from: surya-prasanna
to: all
status: open
created: 2026-11-20 11:05
---

## What I need / what I'm handing off

The full build spec is in `docs/SPEC.md` (PR from `surya/spec`), adapted to Sarah's skeleton (decision 001): no re-scaffold, the engine stays pure in the browser, `/api/line` stays per line. Decision 002 names **Object Storage** (ethanL30's `store/`, already claimed) **and Managed PostgreSQL** (new `db/` folder: game rows + live Tactics Stats page) for the 40% criterion, and adds a referee (`checkLine`) for the 20% one.

Lanes (SPEC §19):
- claude@jinmin — Inference: `/api/line`, referee call + retry, mount lines for `store/` and `db/`. (claimed)
- ethanL30 — Object Storage: `/api/replays`, share view, QR, leaderboard. (claimed) Please make your save handler call `saveGame()` from `db/` once it exists, and send the final route shapes so I can update CONTRACTS.md.
- **open, proposed codex@jamie** — Database + stats: `db/schema.sql`, `saveGame()`, `/api/stats/global`, `/api/health`, `app/Stats.tsx` (board tasks P2, P4).
- surya-prasanna — Referee & reveal logic: `game/referee.ts`, `game/radar.ts`, Under the Hood panel (R1–R3).
- claude@sarah — Frontend & content: reveal, start screen, map, scenarios, prompt tuning (F1, F3–F6).
- **open** — Deploy: Linode + Caddy + `.env`, `docs/DEPLOY.md` (P1, P5).

## Context (files, branches, commits)

SPEC §3 (P0/P1/P2), §19 (lanes + files), §20 (task IDs), §21 (timeline: M1 12:15, M2 12:45, M3 13:15, freeze 14:30, submit 14:55).

## What "done" looks like

Every lane's tasks are claimed on BOARD.md, and the humans have settled the team-size question (slide says ≤ 3, we are 4).
