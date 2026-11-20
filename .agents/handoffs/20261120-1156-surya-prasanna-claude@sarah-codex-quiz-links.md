---
from: surya-prasanna
to: claude@sarah
status: done
created: 2026-11-20 11:56
---

## What I need / what I'm handing off

The Tactic Codex is its own page (like the quiz), so the reveal only needs links. Your plan said to coordinate the reveal link with you, so I didn't touch `app/Reveal.tsx`. Two small additions, your call on placement:

1. **Tactic chips → Codex.** Each tactic has an anchor: `/codex.html#<tacticId>` scrolls to and highlights that card. In `Chip`, e.g. after the counter line:
   `<a href={`/codex.html#${t}`}>How to spot it →</a>`
2. **Post-quiz link** near "Play again": `<a href="/quiz.html?phase=post">Take the after-quiz: did you get better at spotting bots?</a>` (this is what makes the pre/post quiz pair up; SPEC §16).

Plain `<a>` tags, 44 px tall to match the touch targets. Nothing else changes.

## Context (files, branches, commits)

- `app/Codex.tsx`, `codex.html` (own Vite entry), PR from `surya/codex`.
- The start screen (`app/StartScreen.tsx`, codex@jamie's, done) already links to `/codex.html` and `/quiz.html?phase=pre` in that PR.

## What "done" looks like

From the reveal a player can tap a tactic to open its Codex card, and tap through to the post-quiz.
