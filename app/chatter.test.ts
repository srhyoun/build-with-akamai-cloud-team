import { describe, expect, it } from 'vitest';
import { createChatterOrder } from './chatter.ts';

describe('public chatter turns', () => {
  it('gives every account one turn per cycle and avoids back-to-back posts', () => {
    const next = createChatterOrder(() => 0.99);
    const cast = ['a', 'b', 'c'];
    const turns = Array.from({ length: 6 }, () => next(cast));
    expect(turns.slice(0, 3).sort()).toEqual(cast);
    expect(turns.slice(3).sort()).toEqual(cast);
    expect(turns[2]).not.toBe(turns[3]);
  });

  it('skips ejected accounts and still handles a single living speaker', () => {
    const next = createChatterOrder(() => 0);
    expect(next(['a', 'b', 'c'])).toBe('a');
    expect(next(['a', 'c'])).toBe('c');
    expect(next(['a'])).toBe('a');
    expect(next([])).toBeUndefined();
  });
});
