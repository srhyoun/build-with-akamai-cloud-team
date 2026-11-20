import { describe, expect, it } from 'vitest';
import type { Post } from '../shared/types.ts';
import { init } from '../game/engine.ts';
import { crowdReactions, marksByAuthor } from './reactions.ts';

describe('reactions', () => {
  const s = init(11, 2);
  const bot = s.characters.find(c => c.role === 'bot')!, human = s.characters.find(c => c.role === 'human')!;
  const post = (id: string, author: string, extra: Partial<Post> = {}): Post => ({ id, author, text: 'x', at: 1, round: 1, ...extra });

  it('the same post always gets the same reactions; DMs, news and the player get none', () => {
    const p = post('p1', human.id);
    expect(crowdReactions(s, p)).toEqual(crowdReactions(s, p));
    expect(crowdReactions(s, post('d', human.id, { to: 'you' }))).toEqual({ up: 0, hmm: 0 });
    expect(crowdReactions(s, post('n', 'news'))).toEqual({ up: 0, hmm: 0 });
    expect(crowdReactions(s, post('y', 'you'))).toEqual({ up: 0, hmm: 0 });
  });

  it('bots boost rumor posts: tagged posts collect more "like" than honest ones across many posts', () => {
    let rumorUp = 0, honestUp = 0;
    for (let i = 0; i < 200; i++) {
      rumorUp += crowdReactions(s, post(`r${i}`, bot.id, { tactic: bot.tactics[0] })).up;
      honestUp += crowdReactions(s, post(`h${i}`, human.id)).up;
    }
    expect(rumorUp).toBeGreaterThan(honestUp);
  });

  it('counts the player\'s marks per author', () => {
    const posts = [post('a', bot.id), post('b', bot.id), post('c', human.id)];
    expect([...marksByAuthor(posts, new Set(['a', 'b', 'c']))]).toEqual([[bot.id, 2], [human.id, 1]]);
  });
});
