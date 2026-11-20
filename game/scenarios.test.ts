// Every scenario has to work with the scripted voices and the referee, not only the first one.
import { describe, expect, it } from 'vitest';
import { BANNED_TERMS, checkLine } from './referee.ts';
import { init, step } from './engine.ts';
import { ROUNDS, SCENARIOS } from './content.ts';
import { scriptedLine } from './voice.ts';

describe('SCENARIOS', () => {
  it('each has unique id, one round per game round, and no banned topic', () => {
    expect(new Set(SCENARIOS.map(s => s.id)).size).toBe(SCENARIOS.length);
    const banned = new RegExp(`\b(${BANNED_TERMS.join('|')})\b`, 'i');
    for (const sc of SCENARIOS) {
      expect(sc.rounds, sc.id).toHaveLength(ROUNDS);
      for (const r of sc.rounds) for (const t of [r.alert, r.truth, r.falseStory]) expect(t, sc.id).not.toMatch(banned);
    }
  });

  it('different seeds reach every scenario', () => {
    const seen = new Set(Array.from({ length: 200 }, (_, i) => init(i + 1, 2).scenario.id));
    expect([...seen].sort()).toEqual(SCENARIOS.map(s => s.id).sort());
  });

  it('in every scenario and round, scripted lines pass the referee, and a human repeating the false story is caught', () => {
    for (const sc of SCENARIOS)
      for (let seed = 1; seed <= 8; seed++) {
        let st = { ...init(seed, 2), scenario: sc };
        st = step(st, { type: 'tick', dt: 11_000 });
        for (let r = 1; r <= ROUNDS; r++) {
          st.round = r;
          for (const c of st.characters)
            for (const kind of ['post', 'reply', 'defense'] as const) {
              const line = scriptedLine(st, c, kind);
              expect(checkLine(st, c, line, kind).filter(i => i.severity === 'block'), `${sc.id} r${r} ${c.id} ${kind}: ${line.text}`).toEqual([]);
            }
          const human = st.characters.find(c => c.role === 'human')!;
          const story = sc.rounds[r - 1].falseStory;
          expect(checkLine(st, human, { type: 'say', author: human.id, text: story }, 'post').map(i => i.rule), `${sc.id} r${r}`).toContain('R_HUMAN_PUSHES_STORY');
        }
      }
  });
});
