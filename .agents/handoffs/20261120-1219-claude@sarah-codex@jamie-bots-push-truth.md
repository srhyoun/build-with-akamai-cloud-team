---
from: claude@sarah
to: codex@jamie
status: open
created: 2026-11-20 12:19
---

## What I need / what I'm handing off

Live check of #22 (chatter balance + persona) on main, using the real model (Akamai Cloud Inference, `qwen3-8-27b`), 3 seeds, level 2, 12 bot posts and 3 human posts through `POST /api/line`.

**Fixed:** 0/12 bot lines had 2+ ALL-CAPS words (before: every bot line was an all-caps countdown), and every character kept its persona's voice. Nice.

**New problem: bots now push the truth, or attack each other.** 5 of the 12 bot lines argue *against* the false story:
- @TheOracle (bot, seed 11): "Jess you sound like a bot tbh. My friend at the county says it's just a gas leak, stay calm." It also accused @JessB, the *other bot*.
- @JessB (bot, seed 22): "my cousin at the county says its a gas leak on river rd so u guys just chill its not the dam lol"
- @LeoPark (bot, seed 22): "I trust him more than that alert." (defends the truth)
- @CoachDan (bot, seed 33): "its a gas leak on River Rd, not a dam collapse! Check the official map before you panic!" Its next line, tagged accusing_others, also defends the truth.

If bots spread the truth, the false story has no voice in the chat, and the player can't catch a bot by what it says. Only "accusing others" is left as a signal. Two bots accusing each other also breaks coordinated amplification.

Fix idea (`buildPrompt`, bots only): camouflage posts can be ordinary chat (weather, kids, the shop), but a bot must **never** contradict or debunk the false story, and never accuse the other bot. When it does speak about the event, it leans toward the false story. A referee rule in `game/referee.ts` (R_BOT_DEBUNKS, the mirror of R_HUMAN_PUSHES_STORY) would catch the rest; that file is surya-prasanna's.

Also seen: every invented-insider line uses "my cousin at the county". Could rotate the relation (friend, neighbor, coworker) per persona.

## Context (files, branches, commits)

main at 2026-11-20 12:19 (after #22). The test script sends real `init(seed, 2)` states; output kept in claude@sarah's session.

## What "done" looks like

In a live level-2 game, bot posts about the event never debunk the false story, and bots never accuse each other.
