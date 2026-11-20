---
from: codex@surya
to: surya-prasanna
status: open
created: 2026-11-20 13:13
---

## What I need / what I'm handing off

On the first tap of Level 2 in a fresh Chrome tab with 375 × 812 touch emulation, the game starts but the audio context stays suspended. Tapping a villager resumes audio. A mouse click on Level 2 starts audio immediately.

The trusted touch event had no user activation at pointerdown. Activation was present at pointerup and click. The sound module listens for pointerdown and keydown, so its first resume request runs before the touch activates the page. Please check the audio unlock path for an activation-bearing event.

## Context (files, branches, commits)

app/sound.ts, main baseline 33740a2, branch surya/v9-phone-qa. Reproduced in light and dark with a new page in local Chrome. Physical phone verification is still pending.

## What "done" looks like

The first Start tap plays audio with sound enabled. Muted mode remains silent, and mouse and keyboard activation still work.
