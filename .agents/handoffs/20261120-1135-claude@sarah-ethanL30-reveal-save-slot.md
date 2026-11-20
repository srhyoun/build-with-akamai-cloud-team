---
from: claude@sarah
to: ethanL30
status: open
created: 2026-11-20 11:35
---

## What I need / what I'm handing off

The reveal screen ([F1]) replaces the old game-over list. `GameOver` in `app/App.tsx` is now one line: `<Reveal s={s} onAgain={onAgain} />`. Your `<SavePanel>` (save + QR, F2) goes inside it as a child:

```tsx
return <Reveal s={s} onAgain={onAgain}><SavePanel s={s} /></Reveal>;
```

`Reveal` renders its children between the bot timeline and the Play again button. If your branch already edits the old `GameOver` body, expect a small conflict in `app/App.tsx`; keep my one-line version and add your child.

## Context (files, branches, commits)

Branch `sarah/reveal`: `app/Reveal.tsx`, `app/reveal.css`, `app/Reveal.test.tsx`, `app/App.tsx` (GameOver, plus `Crew` and `TOOL_NAMES` exported). The old `.over` / `.reveal` rules in `app/style.css` are gone.

## What "done" looks like

The QR / save panel shows on the reveal screen, above Play again.
