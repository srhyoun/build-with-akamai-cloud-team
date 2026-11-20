// Boss level (decision 003): a bot poses as the town reporter with a one-letter-changed handle.
import { describe, expect, it } from 'vitest';
import { IMPOSTOR, REPORTER } from './content.ts';
import { init, step } from './engine.ts';
import { checkLine } from './referee.ts';
import { scriptedLine } from './voice.ts';

const oneCharApart = (a: string, b: string) => a.length === b.length && [...a].filter((ch, i) => ch !== b[i]).length === 1;

describe('boss level', () => {
  it('the impostor is a bot, the real reporter is human, 2 bots, 6 cast, every seed', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = init(seed, 3);
      const real = s.characters.find(c => c.handle === REPORTER.handle)!, fake = s.characters.find(c => c.handle === IMPOSTOR.handle)!;
      expect(s.characters).toHaveLength(6);
      expect(new Set(s.characters.map(c => c.id)).size).toBe(6);
      expect(s.characters.filter(c => c.role === 'bot')).toHaveLength(2);
      expect([real.role, fake.role]).toEqual(['human', 'bot']);
      expect(fake.frameTarget).toBe(real.id);
      expect(fake.clues.account_age).toMatch(/2 days ago.*same name and photo as @DanaReports/);
      expect(real.clues.account_age).not.toMatch(/new in town/);
    }
  });

  it('the handles differ by one character, bio and color are copied', () => {
    expect(oneCharApart(REPORTER.handle, IMPOSTOR.handle)).toBe(true);
    expect([IMPOSTOR.bio, IMPOSTOR.color]).toEqual([REPORTER.bio, REPORTER.color]);
  });

  it('same seed = same game; levels 1 and 2 never cast the reporter pair', () => {
    expect(init(7, 3)).toEqual(init(7, 3));
    for (let seed = 1; seed <= 50; seed++)
      for (const level of [1, 2] as const)
        expect(init(seed, level).characters.some(c => c.handle === REPORTER.handle || c.handle === IMPOSTOR.handle)).toBe(false);
  });

  it('scripted lines for both reporters pass the referee', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const st = step(init(seed, 3), { type: 'tick', dt: 11_000 });
      for (const c of st.characters.filter(c => c.bio === REPORTER.bio))
        for (const kind of ['post', 'reply', 'defense'] as const)
          expect(checkLine(st, c, scriptedLine(st, c, kind), kind).filter(i => i.severity === 'block')).toEqual([]);
    }
  });
});
