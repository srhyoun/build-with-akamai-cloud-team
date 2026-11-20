// POST /api/line: one character line from Akamai Cloud Inference, checked by the referee before anyone sees it.
// Contract: .agents/CONTRACTS.md, decision 002, SPEC §9 / §12.
// 200 = { ...say, check }   400 = bad request   422 = { check }, blocked by the referee twice
// 502 = the model failed (app uses a scripted line this once)   503 = no model (scripted lines for the rest of the game)
import type { Character, GameState, Post, RefereeCheck } from '../shared/types.ts';
import { buildPrompt, parseLine, type LineKind, type Say } from '../game/voice.ts';
import { blocked, checkLine, toCheck } from '../game/referee.ts';
import { badAnswer, complete, isBadAnswer, type JsonSchema, type Message, type ModelConfig } from './inference.ts';

export interface Reply { status: number; body: unknown }
interface LineRequest { state: GameState; c: Character; kind: LineKind; to?: string }

const KINDS: readonly string[] = ['post', 'reply', 'defense'];
const MAX_ATTEMPTS = 2;                                                 // block → retry once → 422
const MAX_LEN: Record<LineKind, number> = { post: 220, reply: 220, defense: 200 }; // what R_LENGTH warns about
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

// The answer shape buildPrompt asks for, enforced by the model's structured output where the endpoint supports it.
export const LINE_SCHEMA: JsonSchema = {
  name: 'chat_line',
  schema: {
    type: 'object',
    properties: { text: { type: 'string' }, cited: { type: ['string', 'null'] } },
    required: ['text', 'cited'],
    additionalProperties: false,
  },
};

// Text from the client is untrusted (SPEC §8 rule 8): no control characters, and a length cap.
// Player posts and DMs get 300 chars; persona and scenario fields are capped so a forged body can't
// stuff the prompt and spend the team's token budget.
export const clip = (x: unknown, max: number) => String(x ?? '').replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ').slice(0, max);
function sanitize(s: GameState): GameState {
  return {
    ...s,
    feed: s.feed.map((p: Post) => isObj(p) ? { ...p, text: clip(p.text, 300) } : p),
    characters: s.characters.map(c => isObj(c) ? { ...c, handle: clip(c.handle, 40), bio: clip(c.bio, 200), quirks: clip(c.quirks, 200) } : c),
    scenario: { ...s.scenario, rounds: s.scenario.rounds.map(r => isObj(r) ? { alert: clip(r.alert, 300), truth: clip(r.truth, 500), falseStory: clip(r.falseStory, 500) } : r) },
  };
}

// Checks only what buildPrompt and parseLine read, so a bad body is a 400 and never a crash.
function parseRequest(body: unknown): LineRequest | string {
  if (!isObj(body)) return 'body must be a JSON object';
  const { state, charId, kind, to } = body;
  if (typeof charId !== 'string') return 'charId must be a string';
  if (typeof kind !== 'string' || !KINDS.includes(kind)) return 'kind must be "post", "reply" or "defense"';
  if (to !== undefined && to !== null && typeof to !== 'string') return 'to must be a string';
  if (!isObj(state) || !Array.isArray(state.characters) || !Array.isArray(state.feed) || !Array.isArray(state.clues)
    || !Array.isArray(state.ejections) || typeof state.round !== 'number' || !isObj(state.scenario)
    || !Array.isArray(state.scenario.rounds) || !isObj(state.scenario.rounds[state.round - 1])) return 'state is not a GameState';
  const s = sanitize(state as unknown as GameState);
  const c = s.characters.find(x => isObj(x) && x.id === charId);
  if (!c) return `no character "${charId}" in state`;
  return { state: s, c, kind: kind as LineKind, to: to ?? undefined };
}

// Reasoning models may think out loud first. Drop closed <think>…</think> blocks, anything before a lone
// </think> (the opening tag was in the prompt template), and an unclosed <think> that ran to the end.
export const stripThinking = (raw: string) => raw
  .replace(/<think>[\s\S]*?<\/think>/gi, '')
  .replace(/^[\s\S]*<\/think>/i, '')
  .replace(/<think>[\s\S]*$/i, '')
  .trim();

const NO_SOURCE = /^(null|none|n\/a|no source|nothing)?$/i; // the prompt shows `"cited": "… or null"`, so models write "null"
const shorten = (t: string, max: number) => t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;

// One model answer, format-checked: JSON parsed into a say command, no empty line, no fake "null" source.
async function ask(cfg: ModelConfig, messages: Message[], req: LineRequest, fetchImpl: typeof fetch): Promise<Say> {
  const say = parseLine(req.state, req.c, stripThinking(await complete(cfg, messages, fetchImpl, LINE_SCHEMA)), req.to);
  if (!say.text.trim()) throw badAnswer('model answer had no text');
  if (say.source && NO_SOURCE.test(say.source.cited.trim())) delete say.source;
  return say;
}

export async function handleLine(body: unknown, cfg: ModelConfig | null, fetchImpl: typeof fetch = fetch): Promise<Reply> {
  const req = parseRequest(body);
  if (typeof req === 'string') return { status: 400, body: { error: req } };
  if (!cfg) return { status: 503, body: { error: 'no model configured (set AKAMAI_BASE_URL, AKAMAI_API_KEY, CHAT_MODEL)' } };
  const { state, c, kind } = req;
  let messages: Message[];
  try { messages = buildPrompt(state, c, kind); } catch { return { status: 400, body: { error: 'state is not a GameState' } }; }

  const t0 = Date.now();
  let check: RefereeCheck | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let say: Say;
    try { say = await ask(cfg, messages, req, fetchImpl); }
    catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).replaceAll(cfg.key, '[key]');
      console.error(`[api/line] ${c.id} ${kind} attempt ${attempt}: ${msg}`);
      if (isBadAnswer(e) && attempt < MAX_ATTEMPTS) continue; // cut off or empty: one more try
      return { status: 502, body: { error: 'model call failed' } };
    }
    // The referee (Judging 20%): deterministic rules from game/referee.ts on every model line.
    const issues = checkLine(state, c, say, kind);
    check = toCheck(state, c.id, kind, issues, attempt, Date.now() - t0, cfg.model);
    if (!blocked(issues)) {
      if (issues.some(i => i.rule === 'R_LENGTH')) say.text = shorten(say.text, MAX_LEN[kind]);
      return { status: 200, body: { ...say, check } };
    }
    console.warn(`[api/line] ${c.id} ${kind} attempt ${attempt} blocked: ${issues.filter(i => i.severity === 'block').map(i => i.rule).join(', ')}`);
    // Tell the model what was wrong, so the retry isn't the same line again.
    messages = [...messages, { role: 'user', content: `That line can't be used (${issues.map(i => i.detail).join('; ')}). Stay in character and write a different one, same JSON format.` }];
  }
  return { status: 422, body: { check } };
}
