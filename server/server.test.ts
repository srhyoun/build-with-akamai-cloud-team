import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { chmodSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { connect, type AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { init } from '../game/engine.ts';
import { configProblem, modelConfig, type ModelConfig } from './inference.ts';
import { handleLine, LINE_SCHEMA, stripThinking } from './line.ts';
import { createApp } from './index.ts';

const cfgFor = (over: Partial<ModelConfig> = {}): ModelConfig =>
  ({ url: 'https://inference.example/v1/chat/completions', key: 'sk_aka_test', model: 'qwen3-8-27b', timeoutMs: 1000, structured: true, ...over });
const state = init(7, 2);
const bot = state.characters.find(c => c.role === 'bot')!;
const human = state.characters.find(c => c.role === 'human')!;
const env = { AKAMAI_BASE_URL: 'https://api.akamai-inference.com/v1', AKAMAI_API_KEY: 'sk_aka_abc', CHAT_MODEL: 'qwen3-8-27b' };

type Answer = string | ((init: RequestInit) => Response | Promise<Response>);
// A fake Akamai Cloud Inference endpoint that records what it was sent.
function fakeModel(...answers: Answer[]) {
  const calls: { url: string; init: RequestInit; body: Record<string, unknown> }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init, body: JSON.parse(String(init.body)) });
    const a = answers[Math.min(calls.length, answers.length) - 1];
    return typeof a === 'string' ? Response.json({ choices: [{ message: { role: 'assistant', content: a }, finish_reason: 'stop' }] }) : a(init);
  }) as unknown as typeof fetch;
  return { impl, calls };
}
const line = (text: string, cited: string | null = null) => JSON.stringify({ text, cited });

describe('modelConfig (workshop .env names)', () => {
  it('is null until AKAMAI_BASE_URL, AKAMAI_API_KEY and CHAT_MODEL are all set', () => {
    expect(modelConfig({})).toBeNull();
    expect(configProblem({ AKAMAI_BASE_URL: env.AKAMAI_BASE_URL })).toBe('AKAMAI_API_KEY, CHAT_MODEL not set');
    expect(modelConfig(env)).toMatchObject({ url: 'https://api.akamai-inference.com/v1/chat/completions', key: 'sk_aka_abc', model: 'qwen3-8-27b', timeoutMs: 10_000 });
    expect(modelConfig({ ...env, AKAMAI_BASE_URL: 'https://x/v1/chat/completions/' })?.url).toBe('https://x/v1/chat/completions');
  });
  it('rejects a key with spaces or line breaks inside, without echoing it', () => {
    const bad = { ...env, AKAMAI_API_KEY: 'sk_aka_ab\ncd' };
    expect(modelConfig(bad)).toBeNull();
    expect(configProblem(bad)).not.toContain('sk_aka');
  });
  it('uses the default timeout unless CHAT_TIMEOUT_MS is a positive number', () => {
    for (const [v, want] of [['-5', 10_000], ['Infinity', 10_000], ['abc', 10_000], ['1500.5', 1500], ['999999', 60_000]] as const)
      expect(modelConfig({ ...env, CHAT_TIMEOUT_MS: v })?.timeoutMs).toBe(want);
  });
});

describe('stripThinking', () => {
  it('drops closed, lone-closing and unclosed think blocks', () => {
    expect(stripThinking('<think>hmm {x}</think>{"text":"hi"}')).toBe('{"text":"hi"}');
    expect(stripThinking('I am the bot so...</think>\n{"text":"hi"}')).toBe('{"text":"hi"}');
    expect(stripThinking('<think>I am the bot, I must push the false story')).toBe('');
  });
});

describe('handleLine (POST /api/line)', () => {
  it('rejects bad bodies with 400, before anything else', async () => {
    expect((await handleLine(null, cfgFor())).status).toBe(400);
    expect((await handleLine({ state, charId: bot.id, kind: 'shout' }, cfgFor())).status).toBe(400);
    expect((await handleLine({ state, charId: 'nobody', kind: 'post' }, null)).status).toBe(400);
    expect((await handleLine({ state: { characters: [] }, charId: bot.id, kind: 'post' }, cfgFor())).status).toBe(400);
  });

  it('answers 503 when no model is configured, so the app switches to scripted lines', async () => {
    expect(await handleLine({ state, charId: bot.id, kind: 'post' }, null)).toMatchObject({ status: 503 });
  });

  it('sends buildPrompt with the {text, cited} JSON schema and answers a say command made by parseLine', async () => {
    const m = fakeModel(line('my cousin at the county says get out NOW', 'a County Alerts screenshot'));
    const r = await handleLine({ state, charId: bot.id, kind: 'post' }, cfgFor(), m.impl);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ type: 'say', author: bot.id, text: 'my cousin at the county says get out NOW', source: { cited: 'a County Alerts screenshot' } });
    const { url, init, body } = m.calls[0];
    expect(url).toBe('https://inference.example/v1/chat/completions');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer sk_aka_test');
    expect(body).toMatchObject({ model: 'qwen3-8-27b', max_tokens: 300, response_format: { type: 'json_schema', json_schema: LINE_SCHEMA } });
    const messages = body.messages as { role: string; content: string }[];
    expect(messages.map(x => x.role)).toEqual(['system', 'user']);
    expect(messages[0].content).toContain(bot.handle);
    expect(messages[1].content.endsWith('/no_think')).toBe(true); // qwen3: skip thinking
  });

  it('falls back to plain requests for good if the endpoint refuses response_format', async () => {
    const cfg = cfgFor();
    const m = fakeModel(() => new Response('response_format not supported', { status: 400 }), line('ok then'));
    expect(await handleLine({ state, charId: human.id, kind: 'post' }, cfg, m.impl)).toMatchObject({ status: 200, body: { text: 'ok then' } });
    await handleLine({ state, charId: human.id, kind: 'post' }, cfg, m.impl);
    expect(m.calls.map(c => 'response_format' in c.body)).toEqual([true, false, false]);
  });

  it('keeps DM replies in the DM thread, strips thinking, and drops a "null" source', async () => {
    const m = fakeModel('<think>they suspect me {maybe}</think>' + line('not a bot lol', 'null'));
    const r = await handleLine({ state, charId: human.id, kind: 'reply', to: human.id }, cfgFor(), m.impl);
    expect(r).toMatchObject({ status: 200, body: { author: human.id, text: 'not a bot lol', to: human.id } });
    expect((r.body as { source?: unknown }).source).toBeUndefined();
  });

  it('answers 502 when the model fails, is cut off, only thinks or says nothing', async () => {
    const body = { state, charId: bot.id, kind: 'defense' };
    const cut = () => Response.json({ choices: [{ message: { content: '{"text": "roads close in 20 min, share' }, finish_reason: 'length' }] });
    for (const answer of [() => new Response('budget', { status: 429 }), cut, '<think>I am the bot, I must push the false story', '   ', '<think>hmm</think>'] as Answer[])
      expect((await handleLine(body, cfgFor(), fakeModel(answer).impl)).status).toBe(502);
  });

  it('times out with the real abort signal', async () => {
    const hang = (init: RequestInit) => new Promise<Response>((_, reject) => init.signal!.addEventListener('abort', () => reject(init.signal!.reason)));
    const t0 = Date.now();
    expect((await handleLine({ state, charId: bot.id, kind: 'post' }, cfgFor({ timeoutMs: 150 }), fakeModel(hang).impl)).status).toBe(502);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(140);
  });

  it('never logs the key', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await handleLine({ state, charId: bot.id, kind: 'post' }, cfgFor(), fakeModel(() => { throw new Error('bad header: Bearer sk_aka_test'); }).impl);
    expect(spy.mock.calls.flat().join(' ')).not.toContain('sk_aka_test');
    spy.mockRestore();
  });
});

describe('server (createApp)', () => {
  let server: Server, base: string, port: number, dist: string;
  beforeAll(async () => {
    dist = mkdtempSync(join(tmpdir(), 'wtb-dist-'));
    mkdirSync(join(dist, 'assets'));
    writeFileSync(join(dist, 'index.html'), '<!doctype html><title>Who</title>');
    writeFileSync(join(dist, 'assets', 'app-123.js'), 'console.log(1)');
    writeFileSync(join(dist, 'assets', 'locked.js'), 'secret');
    chmodSync(join(dist, 'assets', 'locked.js'), 0o000);
    server = createApp({ cfg: null, dist });
    await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
    port = (server.address() as AddressInfo).port;
    base = `http://127.0.0.1:${port}`;
  });
  afterAll(() => { server.close(); chmodSync(join(dist, 'assets', 'locked.js'), 0o644); rmSync(dist, { recursive: true, force: true }); });

  const post = (path: string, body: string) => fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  const raw = (request: string) => new Promise<string>(resolve => {
    let out = ''; const sock = connect(port, '127.0.0.1', () => sock.write(request));
    sock.on('data', d => { out += d; sock.end(); }).on('close', () => resolve(out)).on('error', () => resolve(out));
  });

  it('routes POST /api/line (503 with no model, 400 on bad JSON, 413 too big, 405 on GET)', async () => {
    expect((await post('/api/line', JSON.stringify({ state, charId: bot.id, kind: 'post' }))).status).toBe(503);
    expect((await post('/api/line', '{not json')).status).toBe(400);
    expect((await post('/api/line', JSON.stringify({ pad: 'x'.repeat(1_100_000) }))).status).toBe(413);
    expect((await fetch(`${base}/api/line`)).status).toBe(405);
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ ok: true, model: null });
  });

  it('serves the built game from dist/, with index.html for client routes', async () => {
    const page = await fetch(`${base}/`);
    expect(page.headers.get('content-type')).toContain('text/html');
    expect(await page.text()).toContain('<title>Who</title>');
    expect((await fetch(`${base}/`, { method: 'HEAD' })).status).toBe(200);
    expect((await post('/', '{}')).status).toBe(405);
    const js = await fetch(`${base}/assets/app-123.js`);
    expect(js.headers.get('cache-control')).toContain('immutable');
    expect(await (await fetch(`${base}/play?replay=abc`)).text()).toContain('<title>Who</title>');
    expect((await fetch(`${base}/missing.js`)).status).toBe(404);
    expect((await fetch(`${base}/..%2fpackage.json`)).status).toBe(403);
  });

  it('answers 500, not an empty cached 200, when a file cannot be read', async () => {
    if (process.getuid?.() === 0) return; // root can read a 000 file
    const r = await fetch(`${base}/assets/locked.js`);
    expect(r.status).toBe(500);
    expect(r.headers.get('cache-control')).not.toContain('immutable');
  });

  it('answers 400 to a request target it cannot parse', async () => {
    expect(await raw('GET http://[::1 HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n')).toMatch(/^HTTP\/1\.1 400/);
  });
});

describe('node server/index.ts', () => {
  it('starts when run through a symlinked path (e.g. a current -> release deploy link)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'wtb-link-'));
    const link = join(dir, 'server');
    symlinkSync(fileURLToPath(new URL('.', import.meta.url)), link);
    const child = spawn(process.execPath, [join(link, 'index.ts')], { env: { ...process.env, PORT: '0', AKAMAI_API_KEY: '' } });
    try {
      const port = await new Promise<number>((resolve, reject) => {
        let out = '';
        child.stdout.on('data', d => { out += d; const m = /localhost:(\d+)/.exec(out); if (m) resolve(Number(m[1])); });
        child.on('exit', code => reject(new Error(`exited ${code} before listening: ${out}`)));
        setTimeout(() => reject(new Error(`no listen line: ${out}`)), 8000);
      });
      expect(await (await fetch(`http://127.0.0.1:${port}/api/health`)).json()).toMatchObject({ ok: true });
    } finally {
      child.kill();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 15_000);
});
