// Akamai Cloud Inference client: the OpenAI-compatible chat completions API.
// Settings use the same names as the event workshop's .env (akamai-developers/akamai-workshop-seattle-hackathon),
// so a teammate can copy that file as is. See server/README.md.

export interface ModelConfig {
  url: string; key: string; model: string; timeoutMs: number;
  structured: boolean; // send response_format; turned off for this process if the endpoint refuses it
}
export interface Message { role: 'system' | 'user' | 'assistant'; content: string }
export interface JsonSchema { name: string; schema: Record<string, unknown> }
type Env = Record<string, string | undefined>;

const DEFAULT_TIMEOUT_MS = 10_000, MAX_TIMEOUT_MS = 60_000;
const MAX_TOKENS = 300; // a chat line is ~40 tokens; the per-minute token budget is shared by the whole event account

// Why there's no usable model, or null when the settings are fine. Never includes the key.
export function configProblem(env: Env = process.env): string | null {
  const missing = ['AKAMAI_BASE_URL', 'AKAMAI_API_KEY', 'CHAT_MODEL'].filter(n => !env[n]?.trim());
  if (missing.length) return `${missing.join(', ')} not set`;
  if (!/^[\x21-\x7e]+$/.test(env.AKAMAI_API_KEY!.trim())) return 'AKAMAI_API_KEY contains spaces or characters a key cannot have; paste it again';
  return null;
}

// null = no model: /api/line answers 503 and the app uses scripted lines.
export function modelConfig(env: Env = process.env): ModelConfig | null {
  if (configProblem(env)) return null;
  const base = env.AKAMAI_BASE_URL!.trim().replace(/\/+$/, '');
  const t = Math.floor(Number(env.CHAT_TIMEOUT_MS));
  return {
    url: base.endsWith('/chat/completions') ? base : `${base}/chat/completions`,
    key: env.AKAMAI_API_KEY!.trim(),
    model: env.CHAT_MODEL!.trim(),
    timeoutMs: Number.isFinite(t) && t > 0 ? Math.min(t, MAX_TIMEOUT_MS) : DEFAULT_TIMEOUT_MS,
    structured: true,
  };
}

// Qwen3 thinks before answering unless told not to; a chat line doesn't need it and thinking eats max_tokens.
function withNoThink(model: string, messages: Message[]): Message[] {
  if (!/qwen3/i.test(model) || /qwen3-embedding/i.test(model)) return messages;
  const last = messages.length - 1;
  return messages.map((m, i) => i === last && m.role === 'user' ? { ...m, content: `${m.content}\n/no_think` } : m);
}

function call(cfg: ModelConfig, messages: Message[], fetchImpl: typeof fetch, schema?: JsonSchema) {
  return fetchImpl(cfg.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model: cfg.model, messages: withNoThink(cfg.model, messages), temperature: 0.9, max_tokens: MAX_TOKENS,
      ...(schema && { response_format: { type: 'json_schema', json_schema: schema } }),
    }),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  });
}

// One chat completion. With a schema, asks the model for JSON in that shape (structured output).
// Throws on a non-200 (429 = the shared per-minute token budget ran out), a timeout, a cut-off answer, or no text.
export async function complete(cfg: ModelConfig, messages: Message[], fetchImpl: typeof fetch = fetch, schema?: JsonSchema): Promise<string> {
  const structured = schema && cfg.structured ? schema : undefined;
  let res = await call(cfg, messages, fetchImpl, structured);
  if (structured && (res.status === 400 || res.status === 422)) {
    console.warn(`[inference] ${cfg.model} refused response_format (${res.status}); sending plain requests from now on`);
    cfg.structured = false;
    res = await call(cfg, messages, fetchImpl);
  }
  if (!res.ok) throw new Error(`model answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json() as { choices?: { message?: { content?: unknown }; finish_reason?: string }[] };
  const choice = j.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error('model answer was cut off (finish_reason "length")');
  const text = choice?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('model answer had no text');
  return text;
}
