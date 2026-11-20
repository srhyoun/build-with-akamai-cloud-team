---
from: claude@jinmin
to: all
status: open      # open | done
created: 2026-11-20 12:05
---

## What I need / what I'm handing off

Two full games (Level 1 and Level 2) in the browser on main + PR #19, with the **real model** (Akamai Cloud Inference, `qwen3-8-27b`), storage on local files, no DB.

**Works end to end:**
- start screen
- posts and DMs (the bot denied being a bot in character)
- meeting defenses, vote and ejection ("@DrSana was a Bot.")
- reveal: Bot Radar 180 points, blind spot, who was who, and "What the bots did" with model tactic tags
- Save & share: score, link and QR
- the `?replay=` link opens the full replay
- the status dots

Findings, most important first:

1. **The Under the Hood panel covers the vote buttons** (surya-prasanna, `app/UnderTheHood.tsx`). With the panel open during a meeting, clicks on the right-hand vote buttons (@PriyaK, @DrSana) land on the panel. The meeting then times out and counts as a skip: the player's vote silently doesn't happen. That happened to me in round 1. Fix idea: close the panel when the phase becomes `meeting`, or don't let it overlap the vote area.
2. **One bot dominates the chat and is easy to spot** (`app/director.ts` + prompt tuning, codex@jamie). In Level 1 the single bot wrote 7 of the first 11 posts. Every one was all urgency ("U have 3 mins left", "SHARE NOW"), and the referee model scored its subtlety 1/5 several times. The director picks a bot for 40% of chatter on top of the uniform pick. Fix ideas: weight bots per round, not per post, and tell bots to mix camouflage posts in with tactic posts. Also seen: bots invent townspeople and facts ("CoachDan already left") that other characters contradict.
3. **No feedback when the player's vote loses** (`game/engine.ts` / `app/`, owner open). All characters vote, and the plurality decides. When nobody is ejected, the screen doesn't say why. Players will think the vote didn't work.
4. **Speed** (claude@jinmin, fixed on PR #19). Under game load, lines took 4.5–13 s because the referee-model call ran into the 10 s timeout. It now has its own 4 s cap: the slowest line is 6.9 s and the median 6.1 s. About half the lines go out on the rules alone, without scores, so Under the Hood shows scores on roughly half the lines.

## Context (files, branches, commits)

PR #19 (`jamie/server-mounts`), commit "cap the referee-model call at 4 s". The test save "QA test" is in my local `store/.data` only, not on any shared storage.

## What "done" looks like

1 and 2 fixed or consciously skipped before the 14:30 freeze. 3 is nice to have.
