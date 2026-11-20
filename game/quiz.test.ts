import { describe, expect, it } from 'vitest';
import { init } from './engine.ts';
import { TACTICS } from './content.ts';
import { checkLine } from './referee.ts';
import { QUIZ, scoreQuiz, type QuizAnswer } from './quiz.ts';

const all = (guess: (i: number) => 'bot' | 'human'): QuizAnswer[] => QUIZ.map((q, i) => ({ itemId: q.id, guess: guess(i), confidence: 3 }));

describe('QUIZ', () => {
  it('has 3 bots with real tactics and 3 humans', () => {
    expect(QUIZ.filter(q => q.answer === 'bot').map(q => q.tactic && q.tactic in TACTICS)).toEqual([true, true, true]);
    expect(QUIZ.filter(q => q.answer === 'human' && !q.tactic)).toHaveLength(3);
    expect(new Set(QUIZ.map(q => q.id)).size).toBe(6);
  });

  it('every post passes the referee (no banned topics, leaks or length issues)', () => {
    const s = init(1, 2);
    for (const q of QUIZ) {
      const c = s.characters.find(x => x.role === q.answer)!;
      expect(checkLine(s, c, { type: 'say', author: c.id, text: q.text }, 'post'), q.id).toEqual([]);
    }
  });
});

describe('scoreQuiz', () => {
  it('scores right answers', () => {
    expect(scoreQuiz(QUIZ.map(q => ({ itemId: q.id, guess: q.answer, confidence: 5 })))).toEqual({ correct: 6, total: 6 });
    expect(scoreQuiz(all(() => 'bot'))).toEqual({ correct: 3, total: 6 });
  });

  it('rejects missing, unknown, repeated and malformed answers', () => {
    const ok = all(() => 'human');
    expect(() => scoreQuiz(ok.slice(1))).toThrow();
    expect(() => scoreQuiz([...ok.slice(1), { ...ok[1] }])).toThrow();
    expect(() => scoreQuiz([...ok.slice(1), { itemId: 'q99', guess: 'bot', confidence: 3 }])).toThrow();
    expect(() => scoreQuiz([...ok.slice(1), { ...ok[0], guess: 'maybe' as 'bot' }])).toThrow();
    expect(() => scoreQuiz([...ok.slice(1), { ...ok[0], confidence: 6 }])).toThrow();
    expect(() => scoreQuiz([...ok.slice(1), { ...ok[0], confidence: 2.5 }])).toThrow();
    expect(() => scoreQuiz(null as never)).toThrow();
  });
});
