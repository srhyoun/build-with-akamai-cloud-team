# Who’s the Bot? | Pitch and 30-second demo

## Pitch

Who’s the Bot? gives high-school media-literacy teachers a fictional town chat where students can practice investigating a rumor before they share it. Two of the six accounts in Level 2 are bots. Students compare stories, spend limited Fact-Check Tokens, and vote on who to eject. The vote gives the class a concrete decision to discuss. What evidence changed your mind, and would you have trusted it in your own group chat?

The town itself shows the stakes: as the rumor spreads, the sunny square clouds over, the villagers grow worried, and the music slows. Every picture and sound is original and generated in code (SVG, CSS, Web Audio), with one openly licensed font.

## 30-second demo

| Time | Show | Say |
|---|---|---|
| 0:00–0:07 | Start on the Level 2 chat with the breaking-news alert visible. | “Two accounts in this town chat are bots. Which ones? We built this for media-literacy classrooms.” |
| 0:07–0:14 | Tap **Source Check** on a suspicious post, then cut from the vote to the outcome. | “Check a source, call a meeting, and vote. Now the class can debate which clue made the difference.” |
| 0:14–0:23 | Open **Under the Hood** and point to a blocked line from rehearsal or a labeled test. | “Akamai Cloud Inference writes the dialogue. Our referee catches lines that give a bot away before players see them.” |
| 0:23–0:30 | Scan a saved game’s QR on a second phone and show the replay loading. | “Akamai Object Storage saves the replay. Open it on another phone and revisit the evidence together.” |

## Rehearsal and fallback

- **Before recording** — Prepare a Level 2 discussion with a Source Check available, a completed game, and a replay link. Capture the vote and outcome ahead of time so the 30-second cut skips the game timers.
- **Inference proof** — Confirm a real Akamai model line reaches the chat and an entry appears in **Under the Hood**. For the expected-failure case, ask a character directly whether it is a bot. An in-character deflection can pass. A role leak should be blocked. Use the deterministic role-leak case in [the referee tests](../game/referee.test.ts) if rehearsal yields no real block, and label the clip as a test. In judge Q&A, give the model name from the verified run and one reason it fit the game, such as responsiveness if you measured it.
- **Storage proof** — Open the saved link on a second device and verify the replay endpoint reports `source: "object-storage"`. The bucket is private and the app serves the public replay without DMs. If the run used local storage or no share link is available, show the game-over reveal and say, “The reveal shows who was a bot, so students can revisit their vote.” Keep Object Storage out of the narrated claim in that cut.
- **Scripted dialogue** — If live inference is unavailable, label the gameplay as scripted. For the third beat, show the labeled referee test and say, “Our referee tests show it blocks a line that gives a bot away.” Only claim a live retry or scripted fallback from a model call when that behavior was observed.

For the longer submission video, extend this sequence with the verified Linode URL and any working database-backed stats. [Build spec and submission checklist](SPEC.md#24-demo-pitch-submission) · [Official judging criteria](https://github.com/akamai-developers/akamai-workshop-seattle-hackathon/blob/main/docs/judging.md)
