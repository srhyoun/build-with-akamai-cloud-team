import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { moodOf } from './mood.ts';
import { TownScene } from './TownScene.tsx';
import { speciesOf, Villager } from './Villager.tsx';
import { IMPOSTOR, PERSONAS, REPORTER } from '../../game/content.ts';

const cast = ['Ann', 'Bo', 'Cy', 'Di', 'Ed', 'Flo'].map((n, i) => ({ id: n.toLowerCase(), handle: `@${n}`, color: '#3e63dd', ejected: i === 5 }));
const tags = (html: string) => html.match(/class="tw-name"/g)?.length ?? 0;

describe('town scene', () => {
  it('maps infection to three moods', () => {
    expect([0, 19, 20, 59, 60, 100].map(moodOf)).toEqual(['sunny', 'sunny', 'uneasy', 'uneasy', 'tense', 'tense']);
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

  it.each([
    [0, 'left', '11%'],
    [5, 'right', '89%'],
  ])('anchors a one-word bubble to the speaker at cast position %i', (index, edge, position) => {
    const living = cast.map(c => ({ ...c, ejected: false }));
    const html = renderToStaticMarkup(<TownScene cast={living} infection={0} speaking={{ id: living[index].id, text: 'Hi.' }} />);
    expect(html).toContain(`class="tw-say" data-edge="${edge}"`);
    expect(html).toContain(`--tw-speaker-x:${position}`);
    expect(html).toContain('class="tw-bubble">Hi.</p>');
  });

  it('forces sunshine on a win, whatever the infection', () => {
    expect(renderToStaticMarkup(<TownScene cast={cast} infection={90} />)).toContain('data-mood="tense"');
    expect(renderToStaticMarkup(<TownScene cast={cast} infection={90} sunny />)).toContain('data-mood="sunny"');
  });

  it('gives every game color its own animal', () => {
    // The impostor copies the reporter's color on purpose, so 12 personas have 11 colors.
    const colors = [...new Set([...PERSONAS, REPORTER, IMPOSTOR].map((p) => p.color))];
    expect(colors.length).toBeGreaterThanOrEqual(11);
    expect(new Set(colors.map(speciesOf)).size).toBe(colors.length);
    expect(speciesOf('#3e63dd')).toBe(speciesOf('#3E63DD'));
    expect(speciesOf('rebeccapurple')).toBe(speciesOf('rebeccapurple'));
    expect(typeof speciesOf('not-a-game-color')).toBe('string');
  });

  it('draws talking and ejected villagers', () => {
    expect(renderToStaticMarkup(<Villager color="#ffc53d" talking />)).toContain('tw-v-talk');
    expect(renderToStaticMarkup(<Villager color="#30a46c" mood="tense" ejected size={28} />)).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(<Villager color="teal" mood="uneasy" />)).toContain('<svg');
  });
});
