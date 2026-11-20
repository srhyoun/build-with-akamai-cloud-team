import { mkdtemp, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { useDb } from '../db/db.ts';
import { ROUNDS } from '../game/content.ts';
import { init, step } from '../game/engine.ts';
import { QUIZ } from '../game/quiz.ts';
import { scriptedLine } from '../game/voice.ts';
import { createApp } from '../server/index.ts';
import type { ReplayResponse, SaveResponse } from '../store/replay.ts';

let directory: string | undefined;
let db: PGlite | undefined;
let server: Server | undefined;
let origin: string;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'wtb-release-'));
  vi.stubEnv('STORE_DIR', directory);
  vi.stubEnv('PUBLIC_APP_URL', undefined);
  // Keep this test local even when the developer's shell has real storage credentials.
  vi.stubEnv('S3_BUCKET', undefined);
  vi.stubEnv('OBJ_BUCKET', undefined);
  const pg = new PGlite();
  db = pg;
  // PostgreSQL accepts the full schema in one call, whereas PGlite needs exec for multiple statements.
  useDb({ query: (sql, params) => params ? pg.query(sql, params) : pg.exec(sql).then(results => results.at(-1)!) });
  server = createApp({ cfg: null });
  const listener = server;
  await new Promise<void>((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}, 15_000);

afterAll(async () => {
  try {
    const listener = server;
    if (listener?.listening) await new Promise<void>((resolve, reject) => {
      listener.close(error => error ? reject(error) : resolve());
    });
  } finally {
    useDb(null);
    try {
      await db?.close();
    } finally {
      vi.unstubAllEnvs();
      if (directory) await rm(directory, { recursive: true, force: true });
    }
  }
});

async function request(path: string, method: 'GET' | 'POST', expected: number, body?: unknown) {
  const response = await fetch(origin + path, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  const json = await response.json();
  expect(response.status, `${method} ${path}: ${JSON.stringify(json)}`).toBe(expected);
  return json;
}

it('runs offline play, shares a public replay, and records class and quiz results through one server', async () => {
  expect(await request('/api/health', 'GET', 200)).toEqual({ ok: true, model: null, db: 'up', storage: 'up' });

  const answers = QUIZ.map(item => ({ itemId: item.id, guess: item.answer, confidence: 3 }));
  const [first, ...rest] = answers;
  const pre = [{ ...first, guess: first.guess === 'bot' ? 'human' : 'bot' }, ...rest];
  const sessionId = 'release-check';
  expect(await request('/api/quiz', 'POST', 200, { sessionId, phase: 'pre', answers: pre }))
    .toEqual({ correct: answers.length - 1, total: answers.length });

  let state = init(42, 2);
  const bot = state.characters.find(character => character.role === 'bot')!;
  await request('/api/line', 'POST', 503, { state, charId: bot.id, kind: 'post' });
  const publicLine = scriptedLine(state, bot, 'post');
  state = step(state, publicLine);
  state = step(state, { type: 'say', author: bot.id, to: bot.id, text: 'private release test message' });
  for (let phase = 0; phase < ROUNDS * 4 && state.phase !== 'over'; phase++) {
    state = step(state, { type: 'tick', dt: state.phaseEndsAt - state.clock });
  }
  expect(state.phase).toBe('over');

  const saved: SaveResponse = await request('/api/replays', 'POST', 200, {
    state, classCode: 'QA7', playerName: 'Release check',
  });
  expect(new URL(saved.shareUrl!).searchParams.get('replay')).toBe(saved.id);
  const { replay, source }: ReplayResponse = await request(`/api/replays/${saved.id}`, 'GET', 200);
  expect(source).toBe('local');
  expect(replay).toMatchObject({ id: saved.id, score: saved.score });
  expect(replay.posts).toContainEqual(expect.objectContaining({ author: bot.id, text: publicLine.text, tactic: publicLine.tactic }));
  expect(replay.posts).not.toContainEqual(expect.objectContaining({ text: 'private release test message' }));

  // Saving to the database is asynchronous so storage can return a share link first.
  await vi.waitFor(async () => {
    expect(await request('/api/stats/class/qa7', 'GET', 200)).toMatchObject({
      gamesPlayed: 1, players: [{ name: 'Release check', score: saved.score, result: state.result }],
    });
  }, { timeout: 7000, interval: 100 });
  expect(await request('/api/stats/class/other', 'GET', 200)).toMatchObject({ gamesPlayed: 0, players: [] });

  expect(await request('/api/quiz', 'POST', 200, { sessionId, phase: 'post', answers }))
    .toEqual({ correct: answers.length, total: answers.length });
  expect(await request('/api/quiz/results', 'GET', 200)).toMatchObject({ paired: { n: 1, post: 1 } });
}, 15_000);

it.runIf(process.env.VERIFY_RELEASE_ASSETS === '1')('serves each built entry point and its JavaScript through the app', async () => {
  for (const path of ['/', '/stats.html', '/quiz.html', '/codex.html']) {
    const page = await fetch(origin + path, { signal: AbortSignal.timeout(5000) });
    expect(page.status, path).toBe(200);
    const html = await page.text();
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)];
    expect(scripts.length, path).toBeGreaterThan(0);
    for (const [, src] of scripts) {
      const asset = await fetch(new URL(src, page.url), { signal: AbortSignal.timeout(5000) });
      expect(asset.status, src).toBe(200);
      expect(asset.headers.get('content-type'), src).toMatch(/javascript/);
      expect((await asset.text()).length, src).toBeGreaterThan(0);
    }
  }
}, 15_000);
