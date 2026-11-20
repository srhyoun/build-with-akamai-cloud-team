import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TACTICS } from '../game/content.ts';
import { Codex } from './Codex.tsx';

describe('Codex', () => {
  it('lists every tactic with its anchor, example and a counter tool', () => {
    const html = renderToStaticMarkup(<Codex />);
    for (const [id, t] of Object.entries(TACTICS)) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(t.name);
    }
    expect(html.match(/How to spot it/g)).toHaveLength(Object.keys(TACTICS).length);
    expect(html.match(/🔍/g)).toHaveLength(Object.keys(TACTICS).length);
  });
});
