import { describe, expect, it } from 'vitest';
import { alive, aliveBots, init, step } from './engine.ts';
import { buildPrompt, parseLine, scriptedLine } from './voice.ts';
import { PHASE_MS, ROUNDS, TOKENS_PER_ROUND } from './content.ts';
import type { GameState } from '../shared/types.ts';

const toMeeting = (s: GameState) => step(step(s, { type: 'tick', dt: PHASE_MS.event }), { type: 'call_meeting' });

describe('engine', () => {
  it('casts 6 with the right bot count per level, same seed = same game', () => {
    expect(aliveBots(init(1, 1))).toHaveLength(1);
    const g = init(1, 2);
    expect(g.characters).toHaveLength(6);
    expect(aliveBots(g)).toHaveLength(2);
    expect(aliveBots(g).every(b => b.tactics.length >= 2 && b.frameTarget)).toBe(true);
    expect(init(1, 2)).toEqual(g);
  });

  it('never mutates its input', () => {
    const g = init(2); const copy = structuredClone(g);
    step(g, { type: 'tick', dt: 999_999 });
    expect(g).toEqual(copy);
  });

  it('spends tokens on tools only during discussion, max per round', () => {
    let s = init(3);
    const id = s.characters[0].id;
    expect(step(s, { type: 'use_tool', tool: 'account_age', target: id })).toBe(s); // still the event phase
    s = step(s, { type: 'tick', dt: PHASE_MS.event });
    for (let i = 0; i < TOKENS_PER_ROUND + 1; i++) s = step(s, { type: 'use_tool', tool: 'posting_pattern', target: id });
    expect(s.tokens).toBe(0);
    expect(s.clues).toHaveLength(TOKENS_PER_ROUND);
  });

  it('source check reads the post source, or says there is none', () => {
    let s = step(init(4), { type: 'tick', dt: PHASE_MS.event });
    const bot = aliveBots(s)[0];
    s = step(s, { type: 'say', author: bot.id, text: 'x', source: { cited: 'a screenshot', verdict: 'fake' } });
    s = step(s, { type: 'use_tool', tool: 'source_check', target: s.feed.at(-1)!.id });
    expect(s.clues[0].text).toContain('fake');
  });

  it('a meeting ejects someone or nobody, then the round ends and spread grows', () => {
    let s = toMeeting(init(5));
    const bot = aliveBots(s)[0];
    s = step(s, { type: 'vote', target: bot.id });
    expect(s.phase).toBe('ejection');
    expect(s.votes).toHaveLength(alive(init(5)).length + 1);
    s = step(s, { type: 'tick', dt: PHASE_MS.ejection });
    expect(s.infection).toBe(aliveBots(s).length * 20 + (s.ejections[0].id && !s.ejections[0].wasBot ? 10 : 0));
  });

  it('the game always ends by the last round', () => {
    let s = init(6);
    for (let i = 0; i < ROUNDS * 10 && s.phase !== 'over'; i++) s = step(s, { type: 'tick', dt: 60_000 });
    expect(s.phase).toBe('over');
    expect(s.result).toBe(aliveBots(s).length ? 'lost' : 'won');
  });

  it('ejected characters cannot post', () => {
    let s = init(7); const c = s.characters[0];
    s.characters[0].ejected = true;
    expect(step(s, { type: 'say', author: c.id, text: 'hi' })).toBe(s);
  });
});

describe('voice', () => {
  it('only bot prompts carry the false story', () => {
    const s = init(8);
    const bot = aliveBots(s)[0], human = s.characters.find(c => c.role === 'human')!;
    const fs = s.scenario.rounds[0].falseStory;
    expect(buildPrompt(s, bot, 'post')[0].content).toContain(fs);
    expect(buildPrompt(s, human, 'post')[0].content).not.toContain(fs);
  });

  it('parses model JSON and plain text', () => {
    const s = init(9); const c = s.characters[0];
    expect(parseLine(s, c, 'ok {"text":"hi","cited":"the county site"}').source?.cited).toBe('the county site');
    expect(parseLine(s, c, 'just words').text).toBe('just words');
  });

  it('scripted lines tag bot tactics and never tag humans', () => {
    const s = init(10);
    for (const c of s.characters) {
      const line = scriptedLine(s, c, 'post');
      expect(line.text.length).toBeGreaterThan(0);
      expect(Boolean(line.tactic)).toBe(c.role === 'bot');
    }
  });
});
