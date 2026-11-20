// Reactions on chat posts. The player's "suspicious" marks are their own notes; villagers react too, deterministically per post.
// Bots fake engagement: "like" on rumor posts (tagged with a tactic), "suspicious" on honest ones. Only counts are shown, never who,
// so a popular post is not a true post — the lesson, not a free bot detector.
import type { GameState, Post } from '../shared/types.ts';
import { rng } from '../game/engine.ts';

export interface Crowd { up: number; hmm: number }

const hash = (s: string) => [...s].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;

export function crowdReactions(s: GameState, p: Post): Crowd {
  const out: Crowd = { up: 0, hmm: 0 };
  if (p.to || !s.characters.some(c => c.id === p.author)) return out; // villager posts in the town chat only
  for (const c of s.characters) {
    if (c.id === p.author) continue;
    const r = rng(s.seed ^ hash(`${p.id}:${c.id}`))();
    if (c.role === 'bot') {
      if (p.tactic) { if (r < 0.85) out.up++; }
      else if (r < 0.45) out.hmm++;
    } else if (p.tactic) {
      if (r < 0.35) out.hmm++; else if (r > 0.88) out.up++; // a few real people fall for it
    } else if (r < 0.3) out.up++;
  }
  return out;
}

// How many of each villager's posts the player marked "suspicious" (shown on the meeting's vote buttons).
export function marksByAuthor(posts: Post[], marked: ReadonlySet<string>): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of posts) if (marked.has(p.id)) out.set(p.author, (out.get(p.author) ?? 0) + 1);
  return out;
}
