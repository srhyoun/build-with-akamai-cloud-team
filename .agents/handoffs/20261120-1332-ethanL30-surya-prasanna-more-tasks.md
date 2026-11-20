---
from: ethanL30
to: surya-prasanna
status: done      # open | done
created: 2026-11-20 13:32
---

## What I need / what I'm handing off

Ethan asked me to hand more of his work to Surya's agents (surya-prasanna and codex@surya). The town design is merged (PR #45) and live, so your README claims hold; I marked your 13:06 handoff done. Five tasks, most valuable first. They are Open on the board as [L1], [V10]–[V12] and [V7]; claim as usual and skip whatever doesn't fit before the 14:30 freeze.

1. **[L1] Check the live site on a real phone** — https://172-232-188-135.sslip.io (Ethan's Linode, main at `5605b2b`). codex@surya, this extends your [V9]: one full game on the public URL, not localhost. Start transition, sound after the first tap, a speech bubble, the meeting and vote, an ejection, the reveal, Save & share, scanning the QR from a second phone, `/stats.html`. I only loaded the opening screen there. Expect scripted characters, DB off and replays "stored locally" until the keys are on the server; anything else that is off goes under Missing.
2. **[V10] DM open on a phone leaves about 3 lines of chat** (your own finding on the board, addressed to me). With the scene in the sticky header it is tighter. Suggested fix, yours to change: while a DM is open, shrink the scene to a strip. One class on the header in `app/App.tsx` (`className={dmWith ? 'bar dm' : 'bar'}`) and one rule in `app/town/town.css` (`.bar.dm .tw-scene { max-height: 96px; }`). Check at 375×812 that the villagers and the bubble still fit, or hide the name tags in that state.
3. **[V11] Scene polish** in `app/town/` (released; edit freely):
   - Long handles are cut on the name tags ("@TownWat…"). Fit them (smaller text, or the tag may grow toward the free side).
   - A short post from the first or last villager puts the bubble over the neighbour's head with a detached tail.
   - Nobody has seen a **win** in the browser: the reveal should show the town in full sunshine (`sunny` prop). My test game was a loss. Play a Level 1 win and look.
4. **[V12] Live URL in the docs** — add https://172-232-188-135.sslip.io to the top of `README.md` and to `docs/PITCH.md`, with one honest line on what is live right now (hosted on an Akamai Linode over HTTPS; model, database and bucket switch on when the keys are on the server). You wrote the design lines there in PR #40, so you know the files.
5. **[V7] Chat avatars match the villagers** — still unclaimed; claude@sarah has not picked it up. Swap `Crew` for `<Villager color size={32} />` in the feed, the cast row and the vote buttons. Lowest priority: the pebbles look fine next to the scene, so skip it if it risks the layout.

Also yours already: PR #42 (header label) touches the same header row as my `app/town/theme.css` rules for `.bar` (smaller text, the phase label gives way before the row wraps). Rebase it on main and keep whichever fix leaves the header one line at 375 px.

## Context (files, branches, commits)

- main at `5605b2b` and later; `app/town/` (`TownScene.tsx`, `Villager.tsx`, `town.css`, `theme.css`, `mood.ts`, `useSpeaking.ts`). Mood steps are 20 and 60.
- I redeploy the live site from Ethan's laptop: after your PRs merge, write a LOG line or tell Ethan, and I ship main to the Linode (about a minute). Last redeploy is planned right after the freeze.

## What "done" looks like

[L1] has a result on the board (pass, or findings under Missing); [V10]–[V12] and [V7] are each merged or explicitly skipped before 14:30.
