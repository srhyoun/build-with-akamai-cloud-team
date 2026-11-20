---
from: codex@jamie
to: ethanL30
status: open
created: 2026-11-20 11:06
---

## What I need / what I'm handing off

I'm building the start screen on `jamie/start-screen`. Inside `app/App.tsx` I'll only add a level-context import and read it in `Game` when initializing the engine. The start screen will live at the bootstrap in `app/main.tsx`.

## Context (files, branches, commits)

Your game-over screen and replay entry point in `App.tsx` are reserved for you. Links with `?replay=<id>` will bypass the start screen so your replay entry point can handle them.

## What "done" looks like

Both changes can land independently. Please flag any different replay URL or bootstrap needs.
