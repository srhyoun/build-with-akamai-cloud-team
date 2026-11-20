// POST /api/line: one character line from Akamai Cloud Inference. Contract: .agents/CONTRACTS.md.
// 200 = a `say` Command; 400 = bad request; 502 = the model failed (app uses a scripted line this once);
// 503 = no model configured (app switches to scripted lines for the rest of the game).
import type { Character, GameState } from '../shared/types.ts';
import { buildPrompt, parseLine, type LineKind } from '../game/voice.ts';
import { complete, type ModelConfig } from './inference.ts';

export interface Reply { status: number; body: unknown }
interface LineRequest { state: GameState; c: Character; kind: LineKind; to?: string }

const KINDS: readonly string[] = ['post', 'reply', 'defense'];
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

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
  const s = state as unknown as GameState;
  const c = s.characters.find(x => isObj(x) && x.id === charId);
  if (!c) return `no character "${charId}" in state`;
  return { state: s, c, kind: kind as LineKind, to: to ?? undefined };
}

// Reasoning models may wrap their answer in <think>…</think>; parseLine wants just the answer.
const stripThinking = (raw: string) => raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

export async function handleLine(body: unknown, cfg: ModelConfig | null, fetchImpl: typeof fetch = fetch): Promise<Reply> {
  const req = parseRequest(body);
  if (typeof req === 'string') return { status: 400, body: { error: req } };
  if (!cfg) return { status: 503, body: { error: 'no model configured (set AKAMAI_INFERENCE_URL, AKAMAI_INFERENCE_KEY, AKAMAI_INFERENCE_MODEL)' } };
  const { state, c, kind, to } = req;
  let messages;
  try { messages = buildPrompt(state, c, kind); } catch { return { status: 400, body: { error: 'state is not a GameState' } }; }
  try {
    const say = parseLine(state, c, stripThinking(await complete(cfg, messages, fetchImpl)), to);
    if (!say.text.trim()) throw new Error('model answer had no text');
    // Judging 20% hook: the checkLine() task (BOARD.md) runs its check + retry here, before we answer.
    return { status: 200, body: say };
  } catch (e) {
    console.error(`[api/line] ${c.id} ${kind}: ${e instanceof Error ? e.message : String(e)}`);
    return { status: 502, body: { error: 'model call failed' } };
  }
}
