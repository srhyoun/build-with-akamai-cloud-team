import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { init } from '../game/engine.ts';
import { modelConfig, type ModelConfig } from './inference.ts';
import { handleLine } from './line.ts';
import { createApp } from './index.ts';

const cfg: ModelConfig = { url: 'https://inference.example/v1/chat/completions', key: 'test-key', model: 'test-model', timeoutMs: 1000 };
const state = init(7, 2);
const bot = state.characters.find(c => c.role === 'bot')!;
const human = state.characters.find(c => c.role === 'human')!;

// A fake Akamai Cloud Inference endpoint that records what it was sent.
function fakeModel(answer: string | (() => Response | Promise<Response>)) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return typeof answer === 'string' ? Response.json({ choices: [{ message: { role: 'assistant', content: answer } }] }) : answer();
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe('modelConfig', () => {
  it('is null until URL, key and model are all set', () => {
    expect(modelConfig({})).toBeNull();
    expect(modelConfig({ AKAMAI_INFERENCE_URL: 'https://x/v1', AKAMAI_INFERENCE_KEY: 'k' })).toBeNull();
  });
  it('accepts a base URL or the full chat completions URL', () => {
    const env = { AKAMAI_INFERENCE_KEY: 'k', AKAMAI_INFERENCE_MODEL: 'm' };
    expect(modelConfig({ ...env, AKAMAI_INFERENCE_URL: 'https://x/v1/' })?.url).toBe('https://x/v1/chat/completions');
    expect(modelConfig({ ...env, AKAMAI_INFERENCE_URL: 'https://x/v1/chat/completions' })?.url).toBe('https://x/v1/chat/completions');
  });
});

describe('handleLine (POST /api/line)', () => {
  it('rejects bad bodies with 400, before anything else', async () => {
    expect((await handleLine(null, cfg)).status).toBe(400);
    expect((await handleLine({ state, charId: bot.id, kind: 'shout' }, cfg)).status).toBe(400);
    expect((await handleLine({ state, charId: 'nobody', kind: 'post' }, null)).status).toBe(400);
    expect((await handleLine({ state: { characters: [] }, charId: bot.id, kind: 'post' }, cfg)).status).toBe(400);
  });

  it('answers 503 when no model is configured, so the app switches to scripted lines', async () => {
    expect(await handleLine({ state, charId: bot.id, kind: 'post' }, null)).toMatchObject({ status: 503 });
  });

  it('sends buildPrompt to the model and answers a say command made by parseLine', async () => {
    const m = fakeModel('{"text": "my cousin at the county says get out NOW", "cited": "a County Alerts screenshot"}');
    const r = await handleLine({ state, charId: bot.id, kind: 'post' }, cfg, m.impl);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ type: 'say', author: bot.id, text: 'my cousin at the county says get out NOW', source: { cited: 'a County Alerts screenshot' } });
    expect(m.calls).toHaveLength(1);
    expect(m.calls[0].url).toBe(cfg.url);
    expect(new Headers(m.calls[0].init.headers).get('authorization')).toBe('Bearer test-key');
    const sent = JSON.parse(String(m.calls[0].init.body));
    expect(sent.model).toBe('test-model');
    expect(sent.messages.map((x: { role: string }) => x.role)).toEqual(['system', 'user']);
    expect(sent.messages[0].content).toContain(bot.handle);
  });

  it('keeps DM replies in the DM thread and strips <think> blocks', async () => {
    const m = fakeModel('<think>they suspect me {maybe}</think>{"text": "not a bot lol", "cited": null}');
    const r = await handleLine({ state, charId: human.id, kind: 'reply', to: human.id }, cfg, m.impl);
    expect(r).toMatchObject({ status: 200, body: { author: human.id, text: 'not a bot lol', to: human.id } });
    expect((r.body as { source?: unknown }).source).toBeUndefined();
  });

  it('answers 502 when the model fails, times out or says nothing', async () => {
    const body = { state, charId: bot.id, kind: 'defense' };
    expect((await handleLine(body, cfg, fakeModel(() => new Response('overloaded', { status: 529 })).impl)).status).toBe(502);
    expect((await handleLine(body, cfg, fakeModel(() => { throw new DOMException('timed out', 'TimeoutError'); }).impl)).status).toBe(502);
    expect((await handleLine(body, cfg, fakeModel('   ').impl)).status).toBe(502);
    expect((await handleLine(body, cfg, fakeModel('<think>hmm</think>').impl)).status).toBe(502);
  });
});

describe('server (createApp)', () => {
  let server: Server, base: string, dist: string;
  beforeAll(async () => {
    dist = mkdtempSync(join(tmpdir(), 'wtb-dist-'));
    mkdirSync(join(dist, 'assets'));
    writeFileSync(join(dist, 'index.html'), '<!doctype html><title>Who</title>');
    writeFileSync(join(dist, 'assets', 'app-123.js'), 'console.log(1)');
    server = createApp({ cfg: null, dist });
    await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => { server.close(); rmSync(dist, { recursive: true, force: true }); });

  const post = (body: string) => fetch(`${base}/api/line`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });

  it('routes POST /api/line (503 with no model, 400 on bad JSON, 405 on GET)', async () => {
    expect((await post(JSON.stringify({ state, charId: bot.id, kind: 'post' }))).status).toBe(503);
    expect((await post('{not json')).status).toBe(400);
    expect((await fetch(`${base}/api/line`)).status).toBe(405);
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ ok: true, model: null });
  });

  it('serves the built game from dist/, with index.html for client routes', async () => {
    const page = await fetch(`${base}/`);
    expect(page.headers.get('content-type')).toContain('text/html');
    expect(await page.text()).toContain('<title>Who</title>');
    const js = await fetch(`${base}/assets/app-123.js`);
    expect(js.headers.get('cache-control')).toContain('immutable');
    expect(await (await fetch(`${base}/play?replay=abc`)).text()).toContain('<title>Who</title>');
    expect((await fetch(`${base}/missing.js`)).status).toBe(404);
    expect((await fetch(`${base}/..%2fpackage.json`)).status).toBe(403);
  });
});
