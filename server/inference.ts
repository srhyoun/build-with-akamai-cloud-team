// Akamai Cloud Inference client. The service speaks the OpenAI-compatible chat completions API,
// so the base URL, key and model name all come from the Akamai Cloud console (see server/README.md).

export interface ModelConfig { url: string; key: string; model: string; timeoutMs: number }
export interface Message { role: 'system' | 'user' | 'assistant'; content: string }

// null = no model configured: /api/line answers 503 and the app uses scripted lines.
export function modelConfig(env: Record<string, string | undefined> = process.env): ModelConfig | null {
  const url = env.AKAMAI_INFERENCE_URL?.trim(), key = env.AKAMAI_INFERENCE_KEY?.trim(), model = env.AKAMAI_INFERENCE_MODEL?.trim();
  if (!url || !key || !model) return null;
  const base = url.replace(/\/+$/, '');
  return {
    url: base.endsWith('/chat/completions') ? base : `${base}/chat/completions`,
    key, model,
    timeoutMs: Number(env.AKAMAI_INFERENCE_TIMEOUT_MS) || 10_000,
  };
}

// One chat completion. Throws on a non-200, a timeout, or an answer with no text.
export async function complete(cfg: ModelConfig, messages: Message[], fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl(cfg.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, messages, temperature: 0.9, max_tokens: 200 }),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  });
  if (!res.ok) throw new Error(`model answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json() as { choices?: { message?: { content?: unknown } }[] };
  const text = j.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('model answer had no text');
  return text;
}
