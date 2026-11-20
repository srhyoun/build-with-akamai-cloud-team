// Offline fallback lines (what the demo shows with no model): handoff 12:56 from claude@sarah.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../shared/types.ts';
import { alive, init, step } from './engine.ts';
import { scriptedLine } from './voice.ts';

const humanPosts = (s: GameState) => {
  const { truth } = s.scenario.rounds[s.round - 1];
  return [`County page says: ${truth}`, 'wait is this real? anyone have a link?', `I heard this from a neighbor: ${truth}`, 'I’m confused. Has the county confirmed any of that?'];
};

describe('scripted fallback lines', () => {
  it('no two public posts in a row share the same line', () => {
    for (let seed = 1; seed <= 50; seed++) {
      let s = init(seed);
      const humans = alive(s).filter(c => c.role === 'human');
      for (let i = 0; i < 12; i++) s = step(s, scriptedLine(s, humans[i % humans.length], 'post'));
      const texts = s.feed.filter(p => !p.to).map(p => p.text);
      for (let i = 1; i < texts.length; i++)
        for (const line of humanPosts(s)) expect(texts[i - 1].endsWith(line) && texts[i].endsWith(line)).toBe(false);
    }
  });

  it('a question never follows a colon lead, so it does not read as a relayed source', () => {
    for (let seed = 1; seed <= 50; seed++) {
      let s = init(seed);
      for (let i = 0; i < 12; i++) {
        const say = scriptedLine(s, alive(s)[i % alive(s).length], 'post');
        expect(say.text).not.toMatch(/:\s[^:]*\?$/);
        s = step(s, say);
      }
    }
  });

  it('defenses carry no tactic tag and nobody repeats one word for word across meetings', () => {
    for (let seed = 1; seed <= 50; seed++) {
      let s = init(seed, 3);
      for (let meeting = 0; meeting < 2; meeting++)
        for (const c of alive(s)) {
          const say = scriptedLine(s, c, 'defense');
          expect(say.tactic).toBeUndefined();
          expect(s.feed.filter(p => p.author === c.id).map(p => p.text)).not.toContain(say.text);
          s = step(s, say);
        }
      const firstMeeting = s.feed.slice(0, alive(s).length).map(p => p.text);
      const humansSaid = firstMeeting.filter((_, i) => alive(s)[i].role === 'human');
      expect(new Set(humansSaid.map(t => t.slice(-30))).size).toBeGreaterThan(1); // not one shared line
    }
  });
});
