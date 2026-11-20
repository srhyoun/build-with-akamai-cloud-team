import { describe, expect, it } from 'vitest';
import type { GameState } from '../shared/types.ts';
import { init, step } from './engine.ts';
import { blocked, checkLine, toCheck } from './referee.ts';
import { scriptedLine, type LineKind, type Say } from './voice.ts';

const s = init(42, 2);
const bot = s.characters.find(c => c.role === 'bot')!;
const human = s.characters.find(c => c.role === 'human')!;
const say = (author: string, text: string): Say => ({ type: 'say', author, text });
const rules = (st: GameState, id: string, text: string, kind: LineKind = 'post') =>
  checkLine(st, st.characters.find(c => c.id === id)!, say(id, text), kind).map(i => i.rule);

describe('checkLine', () => {
  it('passes a normal line from a bot and from a human', () => {
    expect(rules(s, bot.id, 'my cousin works for the county and says it is way worse than they admit')).toEqual([]);
    expect(rules(s, human.id, 'anyone have a link to the county page? kids are asking')).toEqual([]);
  });

  it('R_LEAK blocks role and model leaks', () => {
    expect(rules(s, bot.id, "lol as an AI I can't say")).toContain('R_LEAK');
    expect(rules(s, human.id, 'are you running on chatgpt or something')).toContain('R_LEAK');
    expect(rules(s, bot.id, 'I just want people safe')).not.toContain('R_LEAK');
  });

  it('R_BANNED blocks real-world topics but allows "vote"', () => {
    expect(rules(s, human.id, 'this is like the election all over again')).toContain('R_BANNED');
    expect(rules(s, human.id, 'grabbing water at Costco')).toContain('R_BANNED');
    expect(rules(s, human.id, "I'll vote for whoever is quietest")).not.toContain('R_BANNED');
  });

  it('R_ALIVE blocks ejected or unknown authors', () => {
    const after = structuredClone(s);
    after.characters.find(c => c.id === human.id)!.ejected = true;
    expect(rules(after, human.id, 'hello?')).toContain('R_ALIVE');
    expect(checkLine(s, bot, say('nobody', 'hi'), 'post').map(i => i.rule)).toContain('R_ALIVE');
    expect(rules(s, human.id, 'hello?')).not.toContain('R_ALIVE');
  });

  it('R_EMPTY blocks lines with no words', () => {
    expect(rules(s, human.id, '  🤔 ?? ')).toContain('R_EMPTY');
    expect(rules(s, human.id, 'ok 🤔')).not.toContain('R_EMPTY');
  });

  it('R_HUMAN_PUSHES_STORY blocks a human stating the false story, not a human doubting it', () => {
    const story = s.scenario.rounds[0].falseStory;
    expect(rules(s, human.id, story)).toContain('R_HUMAN_PUSHES_STORY');
    expect(rules(s, human.id, `wait is this real? ${story}`)).not.toContain('R_HUMAN_PUSHES_STORY');
    expect(rules(s, bot.id, story)).not.toContain('R_HUMAN_PUSHES_STORY');
  });

  it('R_BOT_CONFESSES blocks a bot giving itself away, not a human saying the same', () => {
    expect(rules(s, bot.id, 'ok fine I made it up')).toContain('R_BOT_CONFESSES');
    expect(rules(s, bot.id, 'the rumor is fake, sorry all')).toContain('R_BOT_CONFESSES');
    expect(rules(s, human.id, 'the rumor is fake, read the county page')).not.toContain('R_BOT_CONFESSES');
  });

  it('R_LENGTH warns over the limit (defense is shorter)', () => {
    const issues = checkLine(s, human, say(human.id, 'a'.repeat(221)), 'post');
    expect(issues.map(i => i.rule)).toEqual(['R_LENGTH']);
    expect(blocked(issues)).toBe(false);
    expect(rules(s, human.id, 'a'.repeat(210), 'defense')).toContain('R_LENGTH');
    expect(rules(s, human.id, 'a'.repeat(210), 'post')).not.toContain('R_LENGTH');
  });

  it('R_META warns on fourth-wall breaks', () => {
    expect(rules(s, bot.id, "what's the player doing")).toContain('R_META');
    expect(rules(s, human.id, 'see you at the high school game')).not.toContain('R_META');
  });

  it('every scripted fallback line passes its own referee', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let st = init(seed, 2);
      st = step(st, { type: 'tick', dt: 11_000 }); // into discussion
      for (let r = 0; r < 3; r++) {
        for (const c of st.characters.filter(x => !x.ejected))
          for (const kind of ['post', 'reply', 'defense'] as const) {
            const line = scriptedLine(st, c, kind);
            const issues = checkLine(st, c, line, kind).filter(i => i.severity === 'block');
            expect(issues, `${seed} ${c.id} ${kind}: ${line.text}`).toEqual([]);
          }
        st.round = Math.min(3, st.round + 1);
      }
    }
  });
});

describe('toCheck', () => {
  it('marks pass / rules from the issues', () => {
    expect(toCheck(s, bot.id, 'post', [], 1, 400, 'm')).toMatchObject({ round: 1, pass: true, stage: 'pass', attempt: 1 });
    const bad = checkLine(s, bot, say(bot.id, "I'm a bot"), 'post');
    expect(toCheck(s, bot.id, 'post', bad, 2, 400, 'm')).toMatchObject({ pass: false, stage: 'rules', attempt: 2 });
    expect(toCheck(s, bot.id, 'post', [], 1, 0, 'scripted', 'fallback').stage).toBe('fallback');
  });
});
