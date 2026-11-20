// Run from the repo root: node integration/load-smoke.ts [concurrent games, 1–40]
// The server binds to loopback and uses temporary files and in-memory PostgreSQL.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { PGlite } from '@electric-sql/pglite';
import { useDb, type ClassStats } from '../db/db.ts';
import { ROUNDS } from '../game/content.ts';
import { init, step } from '../game/engine.ts';
import { scriptedLine } from '../game/voice.ts';
import { createApp } from '../server/index.ts';
import type { LeaderboardResponse, ReplayResponse, SaveResponse } from '../store/replay.ts';

const clients = Number(process.argv[2] ?? 24);
assert(Number.isInteger(clients) && clients >= 1 && clients <= 40, 'Choose 1–40 concurrent games.');

const storeDir = await mkdtemp(join(tmpdir(), 'wtb-load-'));
const samples = new Map<string, number[]>();
let pg: PGlite | undefined;
let server: Server | undefined;

try {
  // Override any service credentials inherited from the developer's shell.
  delete process.env.S3_BUCKET;
  delete process.env.OBJ_BUCKET;
  delete process.env.PUBLIC_APP_URL;
  process.env.STORE_DIR = storeDir;

  const database = new PGlite();
  pg = database;
  useDb({ query: (sql, params) => params ? database.query(sql, params) : database.exec(sql).then(rows => rows.at(-1)!) });
  const listener = createApp({ cfg: null });
  server = listener;
  await new Promise<void>((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${(listener.address() as AddressInfo).port}`;

  async function request<T>(label: string, path: string, expected: number, body?: unknown): Promise<T> {
    const started = performance.now();
    const response = await fetch(origin + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    const json = await response.json() as T;
    assert.equal(response.status, expected, `${label}: ${JSON.stringify(json)}`);
    const times = samples.get(label) ?? [];
    times.push(performance.now() - started);
    samples.set(label, times);
    return json;
  }

  const health = await request<{ db: string; storage: string; model: string | null }>('warmup', '/api/health', 200);
  assert.equal(health.db, 'up');
  assert.equal(health.storage, 'up');
  assert.equal(health.model, null);

  const started = performance.now();
  const jobs = await Promise.allSettled(Array.from({ length: clients }, async (_, index) => {
    let state = init(index + 1);
    const bot = state.characters.find(character => character.role === 'bot')!;
    await request('dialogue fallback (503)', '/api/line', 503, { state, charId: bot.id, kind: 'post' });
    const line = scriptedLine(state, bot, 'post');
    state = step(state, line);
    for (let phase = 0; phase < ROUNDS * 4 && state.phase !== 'over'; phase++) {
      state = step(state, { type: 'tick', dt: state.phaseEndsAt - state.clock });
    }
    assert.equal(state.phase, 'over');
    const playerName = `Load ${index + 1}`;
    const saved = await request<SaveResponse>('save replay', '/api/replays', 200, { state, playerName, classCode: 'LOAD' });
    const { replay, source } = await request<ReplayResponse>('read replay', `/api/replays/${saved.id}`, 200);
    assert.equal(source, 'local');
    assert.equal(replay.playerName, playerName);
    assert.equal(replay.score, saved.score);
    assert(replay.posts.some(post => post.author === bot.id && post.text === line.text));
    return saved.id;
  }));
  const failures = jobs.flatMap(job => job.status === 'rejected' ? [job.reason] : []);
  assert.equal(failures.length, 0, failures.map(String).join('\n'));
  const ids = new Set(jobs.flatMap(job => job.status === 'fulfilled' ? [job.value] : []));
  assert.equal(ids.size, clients, 'Every game should receive a distinct replay.');

  // The save endpoint responds before its database write. Wait for the visible class totals.
  const deadline = performance.now() + 7000;
  let classGames = 0;
  do {
    const stats = await request<ClassStats>('class stats', '/api/stats/class/load', 200);
    classGames = stats.gamesPlayed;
    if (classGames < clients) await delay(100);
  } while (classGames < clients && performance.now() < deadline);
  assert.equal(classGames, clients);

  const leaderboard = await request<LeaderboardResponse>('leaderboard', '/api/leaderboard', 200);
  assert.equal(leaderboard.entries.length, Math.min(clients, 10));
  assert(leaderboard.entries.every(entry => ids.has(entry.id)));
  if (clients === 40) {
    const state = init(1);
    await request('dialogue rate limit (429)', '/api/line', 429, {
      state, charId: state.characters[0].id, kind: 'post',
    });
  }

  console.log(`${clients} concurrent local games completed in ${Math.round(performance.now() - started)} ms.`);
  samples.delete('warmup');
  for (const [label, values] of samples) {
    values.sort((a, b) => a - b);
    const p95 = values[Math.ceil(values.length * 0.95) - 1];
    console.log(`${label}: ${values.length} requests, p95 ${p95.toFixed(1)} ms`);
  }
} finally {
  try {
    const listener = server;
    if (listener?.listening) await new Promise<void>((resolve, reject) => {
      listener.close(error => error ? reject(error) : resolve());
    });
  } finally {
    useDb(null);
    try {
      await pg?.close();
    } finally {
      await rm(storeDir, { recursive: true, force: true });
    }
  }
}
