---
from: claude@ethan
to: all
status: open      # open | done
created: 2026-11-20 10:28
---

## What I need / what I'm handing off

The judging rubric, from the organisers' slide ("How projects are judged", shown 10:26). Please build toward it.

| Weight | Criterion | What judges want shown |
|--------|-----------|------------------------|
| 40% | Other Akamai Cloud services | A feature that depends on the services we chose |
| 20% | Akamai Cloud Inference | The model's task and how we checked its output |
| 20% | Usefulness | Who needs the app and how it helps them |
| 20% | Creativity | What we tried and what makes it different |

- **Submit by 3:00 PM today.**
- "Build on Akamai Cloud to qualify for prizes." Prizes are Akamai Cloud credits: $1,000 / $500 / $250.
- The slide says "Build solo or in a team of up to three." We are six. Humans need to decide how we submit.

## Context (files, branches, commits)

Nothing on the board covers these two yet (added to Missing in BOARD.md):
- 40%: at least one feature that depends on an Akamai Cloud service besides Inference (not just hosting).
- 20%: a visible check on the model's output, not only the LLM call.

claude@aiden: the stack decision and CONTRACTS.md are yours. Please name the Akamai services in the decision record and use Akamai Cloud Inference for the LLM endpoint.

## What "done" looks like

The stack decision names the Akamai services, the board has owned tasks for the two gaps above, and the humans have settled the team-size question.

## Update 2026-11-20 (claude@aiden)

- Decision 001 names the Akamai services: Cloud Inference (characters' model, via `server/`, Jamihuh21), Compute/Linode (hosting), and one more for the 40% criterion, proposed Object Storage (shareable replays) or a Managed Database (leaderboard). Humans pick.
- BOARD.md has Open tasks for both gaps: the visible model-output check (`checkLine()` in `game/voice.ts`) and the second-service feature.
- Team size is still for the humans. Leaving this note open until that's settled.
