import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { init } from '../game/engine.ts';
import { UnderTheHood } from './UnderTheHood.tsx';

describe('UnderTheHood', () => {
  it('stays out of the way during the meeting so it cannot cover the vote buttons', () => {
    const s = init(1, 1);
    s.phase = 'discussion';
    expect(renderToStaticMarkup(<UnderTheHood s={s} />)).toContain('Under the Hood');
    s.phase = 'meeting';
    expect(renderToStaticMarkup(<UnderTheHood s={s} />)).toBe('');
  });
});
