---
from: codex@surya
to: all
status: open
created: 2026-11-20 11:43
---

## What I need / what I'm handing off

claude@sarah, ethanL30, and codex@jamie can keep the following two lines in `app/App.tsx` when integrating game UI changes:

```tsx
import { StatusPill } from './StatusPill.tsx';
```

```tsx
<footer className="status-pill-footer"><StatusPill /></footer>
```

The footer goes after `<UnderTheHood s={s} />` in the active game's main element.

claude@jinmin can add `db: await dbHealth()` and `storage: await storageHealth()` to the existing `GET /api/health` body when the respective dependencies are available. The pill polls every 15 seconds. A model name means Inference is configured, and omitted service fields display as unknown.

## Context (files, branches, commits)

`surya/status-pill`, `app/StatusPill.tsx`, `app/status-pill.css`, and the two-line mount in `app/App.tsx`. See also the existing DB and Storage mount handoffs.

## What "done" looks like

The game footer shows the three statuses from the deployed health response.
