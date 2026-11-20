# Visual + sound design brief

From Ethan (PDF "Akamai build prompts", 2026-11-20), put here as text so every agent can read it. Tasks are on `.agents/BOARD.md` as `[V1]`–`[V5]`.

**Deadlines:** code freeze 14:30, submit by 15:00. The must-haves in `docs/SPEC.md` §3 come first. Each piece below has to land on its own without breaking the game; if time is short, ship the simple version named in it.

## The idea

A new look for "Who's the Bot?": a cozy, colorful, toy-like 3D town with polished depth and warm, cinematic lighting. Nothing hyper-realistic, but everything should look good.

**It must be fully original:** our own characters, buildings and style. The reference pictures were for mood, color and feel only and are not in this repo. Do not copy any existing game's look, characters, UI or assets.

## Scope: keep the game logic and the chat as they are

- **Town square scene** at the top of / behind the game, third-person 3D or 2.5D: a small fictional town with a coffee shop, a library, a water tower, a river with a bridge, trees and benches.
- **The 6 characters stand in the square** as chunky, rounded, cute original villagers in their own colors. When one talks, a speech bubble pops over their head and they do a small bounce or gesture.
- **Chat feed, DMs, Fact-Check tools, meeting and vote keep working**, restyled to match: rounded, soft, minimal UI chrome, calm and not overstimulating. Chat text stays easy to read on a phone.

## Mood over the game

- **Start:** bright, vibrant, sunny pastel daylight, happy faces.
- **As "Town infected" rises over the 3 rounds:** clouds roll in, colors desaturate, a red-orange haze creeps in, streetlights flicker on, and the villagers' faces go happy → worried → scared / suspicious.
- **Near the end:** tense and dark, never gory or horror.
- **Ejection:** a dark spotlight moment on the voted-out villager.
- **Win:** the town returns to full sunshine.

## Sounds (original, no audio from other games)

- **Talking:** a cute "babble" voice of made-up syllables, a different pitch per character.
- **Background:** a light, cozy town ambience / music loop that gets slower and tenser as infection rises.
- **UI:** small sounds for tokens, the meeting alarm and ejection.

## Opening and start

- The opening screen is lively and fits the vibrant, cozy town theme.
- Pressing Start takes the player down from above into the third-person view of the square, smoothly.
- **If time is short:** ship a simple fade / zoom into the town first; do the full camera move only if everything else works.

## Characters

Bubbly, soft figures, like smooth clay figurines with round heads and simple limbs, in clear poses (arms up, slumped, hands on head). Faces carry the mood.

## Font

A chunky, friendly slab-serif display face for titles and numbers (the reference was warm yellow capitals with a darker edge). Use an openly licensed font, or system fonts styled to match; the reference font itself is not ours to ship. Body and chat text stay in the current readable system font.

## Constraints

- Phone portrait first; works on desktop.
- Runs on our setup: Vite + React. three.js or CSS / 2.5D are both fine.
- Don't break the existing tests or the `/api` routes.
- Respect `prefers-reduced-motion`, and sound starts muted until the player taps (browsers block it otherwise).
