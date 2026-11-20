import { describe, expect, it } from 'vitest';
import type { GameState, TacticId } from '../shared/types.ts';
import { init } from './engine.ts';
import { radar } from './radar.ts';

// A level-2 game with hand-set posts and ejections.
function game(ejections: { round: number; bot: number | null; human?: boolean }[], posts: [number, TacticId][], round = 3, infection = 40): GameState {
  const s = init(7, 2);
  const bots = s.characters.filter(c => c.role === 'bot');
  const human = s.characters.find(c => c.role === 'human')!;
  s.round = round; s.infection = infection; s.phase = 'over';
  s.feed.push(...posts.map(([b, tactic], i) => ({ id: `t${i}`, author: bots[b].id, text: 'x', at: i, round: 1, tactic })));
  s.ejections = ejections.map(e => e.human ? { round: e.round, id: human.id, wasBot: false }
    : e.bot === null ? { round: e.round, id: null, wasBot: false } : { round: e.round, id: bots[e.bot].id, wasBot: true });
  return s;
}

describe('radar', () => {
  it('scores catches, wrong ejections and spread', () => {
    const r = radar(game([{ round: 1, bot: 0 }, { round: 2, human: true, bot: null }, { round: 3, bot: 1 }], [], 3, 50));
    expect(r).toMatchObject({ botsCaught: 2, humansEjected: 1, finalSpread: 50, score: 200 - 75 + 50, roundsToFirstCatch: 1 });
  });

  it('a skip vote is neither a catch nor a wrong ejection', () => {
    expect(radar(game([{ round: 1, bot: null }], [])).humansEjected).toBe(0);
  });

  it('blind spot = most-used tactic of the longest-surviving bot, tie → last used', () => {
    const r = radar(game([{ round: 1, bot: 0 }, { round: 3, bot: 1 }],
      [[0, 'fake_urgency'], [0, 'fake_urgency'], [1, 'invented_insider'], [1, 'fake_consensus']]));
    expect(r.blindSpot).toBe('fake_consensus');
    expect(r.tacticsSeen.sort()).toEqual(['fake_consensus', 'fake_urgency', 'invented_insider']);
    expect(r.headline).toBe('Blind spot: Fake consensus. The bot pushing it survived 2 rounds.');
  });

  it('a bot never caught is called out', () => {
    const r = radar(game([{ round: 1, bot: 0 }], [[1, 'emotional_outrage']]));
    expect(r.blindSpot).toBe('emotional_outrage');
    expect(r.headline).toContain('was never caught');
  });

  it('untagged model lines fall back to the bot\'s assigned tactics', () => {
    const s = game([{ round: 2, bot: 0 }], []);
    const survivor = s.characters.filter(c => c.role === 'bot')[1];
    expect(radar(s).blindSpot).toBe(survivor.tactics[0]);
  });

  it('clean sweep in round 1 → no blind spot', () => {
    const r = radar(game([{ round: 1, bot: 0 }, { round: 1, bot: 1 }], [[0, 'fake_urgency']], 1, 0));
    expect(r.blindSpot).toBeNull();
    expect(r.headline).toBe('Clean sweep: every bot caught in round 1.');
  });
});
