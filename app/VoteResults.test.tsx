import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../shared/types.ts';
import { init } from '../game/engine.ts';
import { VoteResults, tallies } from './VoteResults.tsx';

// A meeting just ended: the player and two others voted for bot b0, one voted skip, b0 was ejected.
function afterVote(ejected: boolean): { s: GameState; b0: string; h: string[] } {
  const s = init(7, 2);
  const b0 = s.characters.find(c => c.role === 'bot')!.id;
  const h = s.characters.filter(c => c.role === 'human').map(c => c.id);
  s.phase = 'ejection';
  s.votes = ejected
    ? [{ voter: 'you', target: b0 }, { voter: h[0], target: b0 }, { voter: h[1], target: b0 }, { voter: h[2], target: null }]
    : [{ voter: 'you', target: b0 }, { voter: h[0], target: null }];
  s.ejections = [{ round: 1, id: ejected ? b0 : null, wasBot: ejected }];
  return { s, b0, h };
}

describe('VoteResults', () => {
  it('tallies: most votes first, the majority marked, a tie marks every tied row', () => {
    const { s, b0 } = afterVote(true);
    expect(tallies(s).map(t => [t.target, t.votes, t.top])).toEqual([[b0, 3, true], [null, 1, false]]);
    expect(tallies(afterVote(false).s).every(t => t.top)).toBe(true);
  });

  it('screen 1 says who was ejected and whether they were a bot; nobody when the vote failed', () => {
    const { s, b0 } = afterVote(true);
    const html = renderToStaticMarkup(<VoteResults s={s} />);
    expect(html).toContain(`${s.characters.find(c => c.id === b0)!.handle} was ejected.`);
    expect(html).toContain('They were a Bot!');
    expect(renderToStaticMarkup(<VoteResults s={afterVote(false).s} />)).toContain('Nobody was ejected.');
  });

  it('screen 2 shows your pick, screen 3 every vote with the voters and the vote explanation', () => {
    const { s, b0 } = afterVote(true);
    const handle = s.characters.find(c => c.id === b0)!.handle;
    const mine = renderToStaticMarkup(<VoteResults s={s} start={1} />);
    expect(mine).toContain('Your vote');
    expect(mine).toContain(handle);
    const all = renderToStaticMarkup(<VoteResults s={s} start={2} />);
    expect(all).toContain('class="top"');
    expect(all).toContain('You, ');
    expect(all).toContain('got the most votes');
  });
});
