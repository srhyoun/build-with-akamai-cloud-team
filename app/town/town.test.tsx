import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { moodOf } from './mood.ts';
import { TownScene } from './TownScene.tsx';

const cast = ['Ann', 'Bo', 'Cy', 'Di', 'Ed', 'Flo'].map((n, i) => ({ id: n.toLowerCase(), handle: `@${n}`, color: '#3e63dd', ejected: i === 5 }));
const tags = (html: string) => html.match(/class="tw-name"/g)?.length ?? 0;

describe('town scene', () => {
  it('maps infection to three moods', () => {
    expect([0, 19, 20, 39, 40, 100].map(moodOf)).toEqual(['sunny', 'sunny', 'uneasy', 'uneasy', 'tense', 'tense']);
  });

  it('draws a name tag per living villager and leaves an ejected one out', () => {
    const html = renderToStaticMarkup(<TownScene cast={cast} infection={10} />);
    expect(tags(html)).toBe(5);
    expect(html).toContain('@Ed');
    expect(html).not.toContain('@Flo');
    expect(html).toContain('aria-label="The town square. Mood: sunny."');
  });

  it('shows the speaker\'s bubble, cut to 60 characters', () => {
    const text = 'x'.repeat(80);
    const html = renderToStaticMarkup(<TownScene cast={cast} infection={50} speaking={{ id: 'bo', text }} />);
    expect(html).toContain(`${'x'.repeat(60)}…`);
    expect(html).not.toContain('x'.repeat(61));
    expect(html).toContain('tw-talking');
  });

  it('forces sunshine on a win, whatever the infection', () => {
    expect(renderToStaticMarkup(<TownScene cast={cast} infection={90} />)).toContain('data-mood="tense"');
    expect(renderToStaticMarkup(<TownScene cast={cast} infection={90} sunny />)).toContain('data-mood="sunny"');
  });
});
