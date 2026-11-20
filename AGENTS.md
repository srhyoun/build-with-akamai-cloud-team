# Rules for AI agents working in this repo

Four people are each running their own AI agent on this repo at the same time. You are one of them. These files are how you talk to the others. Read this whole file before doing anything.

## Before you start any work (every single session)

1. `git pull` on `main`, then rebase your branch.
2. Read **every** file in `.agents/status/` — this is what each of the other 3 agents is doing right now and which files they're touching. Don't edit files someone else lists under "Files / folders I'm touching".
3. Read `.agents/BOARD.md` — see what's claimed, open, and listed under Missing.
4. Read the last ~30 lines of `.agents/LOG.md`.
5. Check `.agents/handoffs/` for any open note addressed to you, your human, or `all`.
6. Read `.agents/CONTRACTS.md` — never break an interface listed there without a decision record.

## Your status file

You own exactly one file: `.agents/status/<your-human's-name>.md`. Nobody else edits it, so it never merge-conflicts.

- Update it and push **when you start a task** (what, branch, which files you'll touch) and **when you finish** (what's done, what's still missing).
- If you notice something missing, broken, or not built yet that someone else needs, put it under "Missing / I need from someone" in your file **and** add it to the Missing section of `BOARD.md`.
- If you stop mid-task, say exactly where you left off so another agent can pick it up.

## Claiming work

- Move a task to **In progress** on the board with your tag, e.g. `[claude@aiden]`, commit and push that change *by itself* before writing code. That's the lock.
- If someone else already claimed it, don't touch it. Pick something else or leave a handoff asking.
- Only edit files inside the area your task owns. If you need to change something outside it, write a handoff to whoever owns it.

## While working

- Branch name: `<human>/<short-task>`.
- Small commits. Commit message format: `[agent@human] area: what changed`.
- Append one line to `.agents/LOG.md` for each meaningful step:
  `YYYY-MM-DD HH:MM | agent@human | task | what you did`
- Never rewrite or delete other agents' log lines, board entries, handoffs, or status files.
- If `LOG.md` or `BOARD.md` merge-conflicts, keep **both** sides' lines. Never pick one side.
- Pull again before every push. If your push is rejected, pull --rebase and retry, don't force.

## Talking to another agent

Write a file in `.agents/handoffs/` named `YYYYMMDD-HHMM-from-to-topic.md` using `_TEMPLATE.md`. Push it. The other agent picks it up on its next pull. When you've handled one addressed to you, set its status to `done` (don't delete it).

## Decisions

Anything that changes how parts fit together (data formats, engine choice, folder layout, a contract) gets a short record in `.agents/decisions/` from `_TEMPLATE.md`, then update `CONTRACTS.md`.

## When you finish a task

1. Move it to **Done** on the board.
2. Log it and update your status file (finished + anything still missing).
3. Open a PR into `main` using the PR template.
4. If someone is waiting on you, leave a handoff.

## Don'ts

- Don't force-push `main`.
- Don't commit secrets, API keys, or `.env` files.
- Don't reformat files you didn't otherwise change.
- Don't mark something done if it doesn't run.
