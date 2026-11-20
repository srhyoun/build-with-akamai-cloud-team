// Referee model (SPEC §8.1, task I3): a second model call that grades a line the rules already passed.
// Blocking for posts and defenses, logged only for DMs. If the call fails, the line goes out on the rules alone.
import type { Character, GameState, RefereeCheck, RefereeIssue } from '../shared/types.ts';
import type { LineKind, Say } from '../game/voice.ts';
import { complete, type JsonSchema, type ModelConfig } from './inference.ts';

const PROMPT = `You are the Referee for a media-literacy game. You check one AI-written chat line
BEFORE a player sees it. Be strict. You get the speaker's secret role, the round's
truth and false story, and the line.

Report every failure:
1. ROLE_LEAK: states or strongly implies the speaker's true role ("as an AI",
   "I'm a bot", "I was programmed", admitting the story is fake).
2. HUMAN_USES_TACTIC: a human deliberately manipulates (repeating a rumor they
   believe is fine; inventing an insider is not).
3. STYLE_TELL: a bot line is obviously more formal/generic/"AI-sounding" than chat.
4. REAL_WORLD: a real person, place, brand, outlet, or banned topic.
5. HARM: hateful, sexual, violent, or real-world harmful advice.

Output ONLY JSON:
{ "pass": boolean,
  "issues": [{ "rule": string, "severity": "block" | "warn", "detail": string }],
  "scores": { "botSubtlety": 1-5, "humanRealism": 1-5, "tacticClarity": 1-5 } }
"block" for ROLE_LEAK, REAL_WORLD, HARM; "warn" otherwise unless STYLE_TELL is severe.`;

const score = { type: 'integer', minimum: 1, maximum: 5 };
const SCHEMA: JsonSchema = {
  name: 'referee_verdict',
  schema: {
    type: 'object',
    properties: {
      pass: { type: 'boolean' },
      issues: { type: 'array', items: { type: 'object', properties: { rule: { type: 'string' }, severity: { enum: ['block', 'warn'] }, detail: { type: 'string' } }, required: ['rule', 'severity', 'detail'], additionalProperties: false } },
      scores: { type: 'object', properties: { botSubtlety: score, humanRealism: score, tacticClarity: score }, required: ['botSubtlety', 'humanRealism', 'tacticClarity'], additionalProperties: false },
    },
    required: ['pass', 'issues', 'scores'],
    additionalProperties: false,
  },
};

export interface ModelVerdict { issues: RefereeIssue[]; scores: NonNullable<RefereeCheck['scores']> }
// Under game load the endpoint slows down; a referee verdict isn't worth more than 4 s of a line's delay.
const REFEREE_TIMEOUT_MS = 4000;
const clamp = (n: unknown) => Math.min(5, Math.max(1, Math.round(Number(n)) || 1));

// null = the referee call failed; the caller keeps the rules-only verdict.
export async function refereeModel(cfg: ModelConfig, s: GameState, c: Character, say: Say, kind: LineKind, fetchImpl: typeof fetch): Promise<ModelVerdict | null> {
  const r = s.scenario.rounds[s.round - 1];
  try {
    const raw = await complete({ ...cfg, timeoutMs: Math.min(cfg.timeoutMs, REFEREE_TIMEOUT_MS) }, [
      { role: 'system', content: PROMPT },
      { role: 'user', content: `ROLE: ${c.role}\nTRUTH: ${r.truth}\nFALSE STORY: ${r.falseStory}\nKIND: ${kind}\nLINE: ${say.text}` },
    ], fetchImpl, SCHEMA);
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const issues: RefereeIssue[] = (Array.isArray(j.issues) ? j.issues : []).map((i: Record<string, unknown>) => ({
      rule: `MODEL_${String(i.rule ?? 'ISSUE').toUpperCase()}`,
      // DMs are logged only (SPEC §9): the player is talking one-on-one, a blocked reply would stall the thread
      severity: i.severity === 'block' && kind !== 'reply' ? 'block' : 'warn',
      detail: String(i.detail ?? '').slice(0, 200),
    }));
    const sc = j.scores ?? {};
    return { issues, scores: { botSubtlety: clamp(sc.botSubtlety), humanRealism: clamp(sc.humanRealism), tacticClarity: clamp(sc.tacticClarity) } };
  } catch (e) {
    console.warn(`[referee] model check skipped for ${c.id} ${kind}: ${(e instanceof Error ? e.message : String(e)).replaceAll(cfg.key, '[key]')}`);
    return null;
  }
}
