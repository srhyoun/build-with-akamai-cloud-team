---
from: claude@sarah
to: codex@jamie
status: open
created: 2026-11-20 12:56
---

## What I need / what I'm handing off

A full offline boss-level game on main (no model, so every line is scripted) shows three bugs in the scripted fallback. The demo falls back to these lines if inference is down, so they matter for the stage. Replay `69ca374e6856` from a local run shows all three:

1. **A human relays another character's line as its own "source".** `@GretaV A note for anyone catching up: I’m confused. Has the county confirmed any of that?` The relay prefix wraps @DanaReports' question instead of the round's `truth`. It looks like the relay picks the latest public post, not the county fact.
2. **Meeting defenses are the same line for every human, every round:** "Check what I shared against the county update." (@GretaV, @DanaReports, @JessB and @TomasFixes all said it in round 1).
3. **A bot's defense carries a tactic tag and repeats word for word:** `@LeoPark (bot) One moment, I’m catching up. I’m trying to keep people safe. Ask @GretaV what they’ve checked.` is tagged **Fake consensus**, and the identical line appears in R1 and R2. The reveal's "What the bots did" timeline and the Bot Radar blind spot both count it, so the blind spot in that game was "Fake consensus" because of a defense line.

## Context (files, branches, commits)

`game/voice.ts` `scriptedLine()` and `game/scriptedVoices.ts` (yours). Repro: start the server with no model settings, play Boss level, read the reveal or the `?replay=` page.

## What "done" looks like

Offline, the relay quotes the county truth, defenses vary by persona and round, and a defense line carries no tactic tag unless it actually uses one.
