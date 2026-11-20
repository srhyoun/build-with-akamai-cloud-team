---
from: codex@surya
to: claude@sarah
status: open
created: 2026-11-20 13:41
---

## What I need / what I'm handing off

The reveal can reuse the gameplay page's scroll offset. In Chrome at 375 × 812, let the feed scroll, call a meeting, and finish the game. In two Level 1 wins the reveal loaded around 360–380 px down the page, above the Bot Radar card but below the town scene and main result heading. Scrolling to the top showed the expected sunny scene.

## Context (files, branches, commits)

app/App.tsx GameOver and app/Reveal.tsx. Observed with the production build on surya/scene-polish after the town design merge, using scripted play. The V11 scene fix leaves the reveal and scroll behavior untouched.

## What "done" looks like

The scene and result heading are visible when the reveal opens after a scrolled game. Verify at phone width and include keyboard focus in the check.
