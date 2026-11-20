import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { init } from '../game/engine.ts';
import { Reveal } from './Reveal.tsx';

// A finished level-2 game: bot 0 caught in round 2, bot 1 never caught, two tagged bot posts.
function over() {
  const s = init(7, 2);
  const [b0, b1] = s.characters.filter(c => c.role === 'bot');
  s.phase = 'over'; s.round = 3; s.infection = 40; s.result = 'lost';
  s.feed.push({ id: 'p1', author: b1.id, text: 'Roads close in 20 min', at: 1, round: 1, tactic: 'fake_urgency' },
              { id: 'p2', author: b0.id, text: 'My cousin says...', at: 2, round: 2, tactic: 'invented_insider', to: b0.id });
  s.ejections = [{ round: 2, id: b0.id, wasBot: true }];
  return { s, b0, b1 };
}

describe('Reveal', () => {
  it('shows the radar, every role, and each tagged bot post with its tactic', () => {
    const { s, b0, b1 } = over();
    const html = renderToStaticMarkup(<Reveal s={s} onAgain={() => {}}><p>save slot</p></Reveal>);
    expect(html).toContain('Blind spot: Fake urgency. The bot pushing it was never caught.');
    expect(html).toContain('<dd>1/2</dd>');
    expect(html).toContain('voted out in round 2');
    expect(html.match(/class="bot"/g)).toHaveLength(2);
    expect(html.match(/class="human"/g)).toHaveLength(4);
    for (const text of ['Roads close in 20 min', 'My cousin says...', '(DM to you)', b0.handle, b1.handle, 'Counter: Source Check', 'save slot', 'href="/codex.html#fake_urgency"', 'href="/quiz.html?phase=post"']) expect(html).toContain(text);
  });

  it('says so when no bot post carries a tag', () => {
    const { s } = over(); s.feed = [];
    expect(renderToStaticMarkup(<Reveal s={s} onAgain={() => {}} />)).toContain('No tagged bot posts this game.');
  });
});
