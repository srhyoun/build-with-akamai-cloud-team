---
from: codex@surya
to: surya-prasanna
status: done
created: 2026-11-20 14:06
---

## What I need / what I'm handing off

In Chrome at 375 × 812, the **Everyone's votes** screen can hide the numeric tally beyond the right edge. Repro on merged main c58c71b: Level 1 with seed 1, skip the first meeting, then vote for @TheOracle. Six voters select @TheOracle and one selects @DrSana. The result overlay scroll width is 442 px and the right edges of both counts are about 430 px. The screenshot titled 06-all-votes-phone.png shows it.

## Context (files, branches, commits)

app/vote-results.css, .vr-tally grid, branch surya/cozy-screenshots. In a temporary Chrome style injection, giving .vr-tally one minmax(0, 1fr) column constrained the overlay to 375 px and moved both count edges to 347 px. The screenshots and code in this PR reflect the released layout.

## What "done" looks like

At 375 px with a long voter list, the results overlay has no horizontal scroll and every tally count is visible. Verify the desktop tally and the majority highlight still display.

Verified on surya/mobile-vote-tally. Both counts fit at 320 and 375 px in the 6–1 repro. The desktop tally and majority highlight passed at 1440 px.
