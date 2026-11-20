---
from: claude@sarah
to: all
status: open
created: 2026-11-20 11:42
---

## What I need / what I'm handing off

Task plan until code freeze (14:30, SPEC §21). One part per person. Claim your task on BOARD.md before you start, as AGENTS.md says. If you already claimed something, finish that first.

**Sarah (claude@sarah)**
1. Merge the open PR backlog into main, in this order, with tests and build after each: #4 server (LLM endpoint), #10 tactic tag, #9 offline voices, #3 start screen, #13 deploy, #7 pitch, #11 judge README. Until #4 merges, main has no `server/`, so the game on main can't call the model (M1, 12:15). If a PR conflicts, Sarah's agent leaves a comment on it for its author instead of rewriting their code.
2. Town map that shows the spread by district (F5) — `app/`.
3. More breaking-news scenarios (F5) — `game/content.ts`.
4. Sarah's design doc as `docs/GAME_DESIGN.md` (F4), once Sarah shares the doc.

**Ethan (ethanL30)**
- Keep going on Judging 40%: Object Storage replays + leaderboard (`store/`). Nothing from `ethan/replay-storage` is on GitHub yet: push the branch and open a PR as soon as it runs, ideally by 12:30, so it can merge before M2 (12:45).
- Put `<SavePanel>` inside `<Reveal>` in `GameOver` (F2; see `20261120-1135-claude@sarah-ethanL30-reveal-save-slot.md`).

**Jamie (claude@jinmin, codex@jamie)**
- claude@jinmin: once #4 and #13 are merged, provision the cloud resources and deploy, following `docs/DEPLOY.md` (P1, P5). This is the M3 milestone (13:15): a public HTTPS URL a judge can play.
- codex@jamie: finish the ejection animation (claim it on the board; it's still listed under Open). Then take **prompt tuning** (F6, `game/voice.ts`, rules in SPEC §8). You already work in that file, so nobody else edits it.

**Surya (surya-prasanna, codex@surya)**
- surya-prasanna: finish the P7 quiz. Next: **Tactic Codex screen** (`app/Codex.tsx`), a page listing all six tactics with `TACTICS[t].name`, example and counter tool, reachable from the start screen and the reveal. Coordinate the link from the reveal with Sarah (`app/Reveal.tsx`).
- codex@surya: finish StatusPill.

**Not assigned:** boss level (an engine change, too risky before freeze). Leave it Open.

## Context (files, branches, commits)

BOARD.md Open list as of main at 2026-11-20 11:42; open PRs from `gh pr list`; SPEC §20 (task IDs) and §21 (timeline).

## What "done" looks like

Every task above is claimed on BOARD.md by its owner, the PR backlog is merged, and main runs the full game with live inference.
