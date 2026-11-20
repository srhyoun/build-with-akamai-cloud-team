import { describe, expect, it } from 'vitest';
import { init } from '../game/engine.ts';
import type { GameState, Vote } from '../shared/types.ts';
import { voteResult } from './voteResult.ts';

// A meeting with the given votes and outcome, built by hand so each case is exact.
function after(votes: [string, string | null][], ejected: string | null): GameState {
  const s = init(3, 1);
  s.votes = votes.map(([voter, target]): Vote => ({ voter, target }));
  s.ejections = [{ round: 1, id: ejected, wasBot: false }];
  return s;
}

describe('voteResult', () => {
  const s0 = init(3, 1); const [a, b, c] = s0.characters;

  it('names who got the most votes, with the count', () => {
    expect(voteResult(after([['you', a.id], [b.id, a.id], [c.id, b.id]], a.id))).toBe(`${a.handle} got the most votes (${a.handle} 2 · ${b.handle} 1).`);
  });
  it('explains a tie', () => {
    expect(voteResult(after([['you', a.id], [b.id, a.id], [c.id, b.id], [a.id, b.id]], null))).toBe(`It's a tie: ${a.handle} and ${b.handle} got 2 votes each (${a.handle} 2 · ${b.handle} 2).`);
  });
  it('explains a skip majority that outvoted the player', () => {
    expect(voteResult(after([['you', a.id], [b.id, null], [c.id, null]], null))).toBe(`Most votes were to skip, so your vote for ${a.handle} wasn't enough (Skip 2 · ${a.handle} 1).`);
  });
  it('says when the player skipped (or ran out of time)', () => {
    expect(voteResult(after([['you', null], [b.id, null], [c.id, a.id]], null))).toMatch(/^You skipped, and most votes were to skip/);
  });
});
