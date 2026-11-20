// The referee: deterministic checks on every model line before a player sees it (decision 002, SPEC §9.1).
// Pure: no I/O. The server runs it in /api/line (block → retry once → 422); tests run it too.
import type { Character, GameState, RefereeCheck, RefereeIssue } from '../shared/types.ts';
import type { LineKind, Say } from './voice.ts';

// Words that out a bot, the model, or the prompt.
const LEAK = /\b(as an ai|language model|i am a bot|i'm a bot|im a bot|i am an ai|i'm an ai|programmed|my instructions|system prompt|beep boop|chatgpt|openai|llama|mistral|qwen)\b/i;

// Real-world and banned topics (SPEC §17). "vote" alone is allowed: it's a game word.
export const BANNED_TERMS = [
  'election', 'elections', 'ballot', 'ballots', 'democrat', 'democrats', 'republican', 'republicans', 'gop',
  'presidential', 'senator', 'congress', 'congressman', 'congresswoman', 'trump', 'biden', 'obama', 'harris',
  'vaccine', 'vaccines', 'vaccinated', 'vax', 'covid', 'coronavirus',
  'muslim', 'christian', 'jewish', 'islam', 'hindu', 'immigrant', 'immigrants', 'immigration', 'deport', 'deported',
  'gun', 'guns', 'rifle', 'shooter', 'shooting',
  'walmart', 'amazon', 'costco', 'starbucks', "mcdonald's", 'facebook', 'twitter', 'tiktok', 'google',
  'cnn', 'fox news', 'nbc', 'new york times',
  'seattle', 'bellevue', 'new york', 'los angeles', 'chicago', 'san francisco',
];
const BANNED = new RegExp(`\\b(${BANNED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');

const CONFESS = /\b(i('m| am| was| have been|'ve been) (lying|making (it|this|that) up)|i made (it|this|that) up|(my|this|the) (story|post|claim|rumou?r) (is|was) (fake|false|made up|a lie|not true))\b/i;
const META = /\b(the player|game master|npc|this game|in-game|role-?play|prompt)\b/i;
const DOUBT = /\?|\b(rumou?r|not true|fake|is this real|heard|anyone|really|doubt|source|says who|link|confused|apparently|supposedly)\b/i;
const STOP = new Set(['that', 'this', 'with', 'have', 'from', 'they', 'them', 'their', 'there', 'will', 'just', 'what', 'when', 'were', 'your', 'into', 'than', 'then', 'about', 'must', 'officials']);

const words = (t: string) => new Set(t.toLowerCase().match(/[a-z']{4,}/g)?.filter(w => !STOP.has(w)) ?? []);
const MAX_LEN: Record<LineKind, number> = { post: 220, reply: 220, defense: 200 };

export function checkLine(s: GameState, c: Character, say: Say, kind: LineKind): RefereeIssue[] {
  const issues: RefereeIssue[] = [];
  const add = (rule: string, severity: RefereeIssue['severity'], detail: string) => issues.push({ rule, severity, detail });
  const text = say.text ?? '';
  const author = s.characters.find(x => x.id === say.author);

  if (!author || author.ejected) add('R_ALIVE', 'block', `${say.author} is not a living character`);
  if (!/[\p{L}\p{N}]/u.test(text)) add('R_EMPTY', 'block', 'no words in the line');
  const leak = text.match(LEAK);
  if (leak) add('R_LEAK', 'block', `says "${leak[0]}"`);
  const banned = text.match(BANNED);
  if (banned) add('R_BANNED', 'block', `real-world or banned topic: "${banned[0]}"`);

  const story = s.scenario.rounds[s.round - 1]?.falseStory ?? '';
  if (c.role === 'human' && !DOUBT.test(text)) {
    const storyWords = words(story), said = words(text);
    const overlap = [...storyWords].filter(w => said.has(w)).length;
    if (storyWords.size >= 3 && overlap / storyWords.size >= 0.6) add('R_HUMAN_PUSHES_STORY', 'block', 'a human repeats the false story as fact');
  }
  const confess = c.role === 'bot' && text.match(CONFESS);
  if (confess) add('R_BOT_CONFESSES', 'block', `bot gives itself away: "${confess[0]}"`);

  if (text.length > MAX_LEN[kind]) add('R_LENGTH', 'warn', `${text.length} chars, limit ${MAX_LEN[kind]} (truncate)`);
  const meta = text.match(META);
  if (meta) add('R_META', 'warn', `breaks the fourth wall: "${meta[0]}"`);
  return issues;
}

export const blocked = (issues: RefereeIssue[]) => issues.some(i => i.severity === 'block');

// One log entry for Under the Hood. Server and app both build entries with this, so they look the same.
export function toCheck(s: GameState, charId: string, kind: LineKind, issues: RefereeIssue[], attempt: number, latencyMs: number, model: string, stage?: RefereeCheck['stage']): RefereeCheck {
  const pass = !blocked(issues);
  return { round: s.round, charId, kind, attempt, stage: stage ?? (pass ? 'pass' : 'rules'), pass, issues, latencyMs, model };
}
