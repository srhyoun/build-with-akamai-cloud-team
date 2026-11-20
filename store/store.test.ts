import { createHash } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PHASE_MS } from '../game/content.ts';
import { aliveBots, init, step } from '../game/engine.ts';
import { radar } from '../game/radar.ts';
import type { GameState } from '../shared/types.ts';
import { createStore, hooks } from './handler.ts';
import type { SavedGame, StoreOptions } from './handler.ts';
import { toReplay } from './replay.ts';
import type { LeaderboardResponse, ReplayResponse, SaveResponse } from './replay.ts';
import { fileStorage, s3ConfigFromEnv, s3Storage, signV4 } from './storage.ts';
import type { Storage } from './storage.ts';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const tempDir = () => mkdtemp(join(tmpdir(), 'store-test-'));

const servers: Server[] = [];
async function listen(server: Server) {
  servers.push(server);
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
afterEach(() => {
  for (const s of servers.splice(0)) { s.closeAllConnections(); s.close(); }
  vi.restoreAllMocks();
  delete hooks.saveGame;
});

// The public example credentials from the AWS documentation, not real keys.
const AWS = { accessKey: 'AKIAIOSFODNN7EXAMPLE', secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', region: 'us-east-1', amzDate: '20130524T000000Z' };
const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('signV4 (AWS published S3 examples)', () => {
  const host = 'examplebucket.s3.amazonaws.com';
  const base = { host, 'x-amz-content-sha256': EMPTY, 'x-amz-date': AWS.amzDate };
  const sign = (method: string, path: string, headers: Record<string, string>, payloadHash = EMPTY) =>
    signV4({ ...AWS, method, url: `https://${host}${path}`, headers, payloadHash });

  it('GET object with a range header', () => {
    expect(sign('GET', '/test.txt', { ...base, range: 'bytes=0-9' })).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request,SignedHeaders=host;range;x-amz-content-sha256;x-amz-date,Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41');
  });
  it('list objects: query parameters sorted and encoded', () => {
    expect(sign('GET', '/?max-keys=2&prefix=J', base)).toContain('Signature=34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7');
    expect(sign('GET', '/?prefix=J&max-keys=2', base)).toContain('Signature=34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7');
  });
  it('a query parameter with no value is written as "name="', () => {
    expect(sign('GET', '/?lifecycle', base)).toContain('Signature=fea454ca298b7da1c68078a5d1bdbfbbe0d65c699e0f91ac7a200a0136783543');
  });
  it('PUT object: the path is URI-encoded and extra headers are signed', () => {
    const hash = sha256('Welcome to Amazon S3.');
    expect(hash).toBe('44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072');
    expect(sign('PUT', '/test$file.text', { date: 'Fri, 24 May 2013 00:00:00 GMT', host, 'x-amz-content-sha256': hash, 'x-amz-date': AWS.amzDate, 'x-amz-storage-class': 'REDUCED_REDUNDANCY' }, hash))
      .toContain('Signature=98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd');
  });
});

describe('s3Storage against a fake S3', () => {
  const cfg = { bucket: 'games', accessKey: 'test-access', secretKey: 'test-secret', region: 'us-east-1' };
  // Path-style, checks every signature the way S3 does: rebuild it from the request as received.
  async function fakeS3() {
    const objects = new Map<string, string>();
    const seen: { method: string; url: string; headers: Record<string, string>; body: string }[] = [];
    const endpoint = await listen(createServer(async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      const headers = req.headers as Record<string, string>;
      seen.push({ method: req.method!, url: req.url!, headers, body });
      const signed = /SignedHeaders=([^,]+)/.exec(headers.authorization ?? '')?.[1].split(';') ?? [];
      const expected = signV4({ ...cfg, method: req.method!, url: `http://${headers.host}${req.url}`, headers: Object.fromEntries(signed.map(h => [h, headers[h]])), payloadHash: sha256(body), amzDate: headers['x-amz-date'] });
      const url = new URL(req.url!, 'http://x');
      const key = url.pathname.slice('/games/'.length);
      if (headers.authorization !== expected) res.writeHead(403).end('<Error><Code>SignatureDoesNotMatch</Code></Error>');
      else if (req.method === 'PUT') { objects.set(key, body); res.writeHead(200).end(); }
      else if (url.pathname === '/games') {
        const keys = [...objects.keys()].filter(k => k.startsWith(url.searchParams.get('prefix')!)).sort().slice(0, Number(url.searchParams.get('max-keys')));
        res.writeHead(200, { 'content-type': 'application/xml' }).end(`<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><Name>games</Name>${keys.map(k => `<Contents><Key>${k}</Key><Size>1</Size></Contents>`).join('')}</ListBucketResult>`);
      }
      else if (objects.has(key)) res.writeHead(200).end(objects.get(key));
      else res.writeHead(404).end('<Error><Code>NoSuchKey</Code></Error>');
    }));
    return { endpoint, seen };
  }

  it('puts, gets and lists with signed path-style requests', async () => {
    const { endpoint, seen } = await fakeS3();
    const s3 = s3Storage({ ...cfg, endpoint });
    expect(s3.kind).toBe('object-storage');
    await s3.put('scores/b.json', '{"n":2}', 'application/json');
    await s3.put('scores/a.json', '{"n":1}', 'application/json');
    await s3.put('replays/c.json', '{}', 'application/json');
    expect(await s3.get('scores/b.json')).toBe('{"n":2}');
    expect(await s3.get('scores/missing.json')).toBeNull();
    expect(await s3.list('scores/', 5)).toEqual(['scores/a.json', 'scores/b.json']);
    expect(await s3.list('scores/', 1)).toEqual(['scores/a.json']);

    expect(seen[0]).toMatchObject({ method: 'PUT', url: '/games/scores/b.json', body: '{"n":2}' });
    expect(seen[0].headers['content-type']).toBe('application/json');
    expect(seen[0].headers['content-length']).toBe('7');
    const listQuery = new URL(seen.at(-1)!.url, 'http://x').searchParams;
    expect(Object.fromEntries(listQuery)).toEqual({ 'list-type': '2', 'max-keys': '1', prefix: 'scores/' });
    for (const r of seen) {
      expect(r.headers.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=test-access\//);
      expect(r.headers['x-amz-content-sha256']).toBe(sha256(r.body));
      expect(Object.keys(r.headers).filter(h => h.startsWith('x-amz-checksum') || h === 'x-amz-acl' || h === 'transfer-encoding')).toEqual([]);
    }
  });

  it('throws on a 403 with the status in the message', async () => {
    const { endpoint } = await fakeS3();
    const s3 = s3Storage({ ...cfg, endpoint, secretKey: 'wrong' });
    await expect(s3.put('replays/x.json', '{}', 'application/json')).rejects.toThrow(/403.*SignatureDoesNotMatch/);
    await expect(s3.get('replays/x.json')).rejects.toThrow(/403/);
    await expect(s3.list('replays/', 1)).rejects.toThrow(/403/);
  });

  it('reads its config from S3_* or the workshop OBJ_* names', () => {
    expect(s3ConfigFromEnv({})).toBeNull();
    expect(s3ConfigFromEnv({ S3_ENDPOINT: 'https://e/', S3_BUCKET: 'b', S3_ACCESS_KEY: 'a' })).toBeNull();
    expect(s3ConfigFromEnv({ S3_ENDPOINT: 'https://e/', S3_BUCKET: 'b', S3_ACCESS_KEY: 'a', S3_SECRET_KEY: 's', S3_REGION: 'us-ord-1' }))
      .toEqual({ endpoint: 'https://e', bucket: 'b', accessKey: 'a', secretKey: 's', region: 'us-ord-1' });
    expect(s3ConfigFromEnv({ OBJ_ENDPOINT: 'e.example', OBJ_BUCKET: 'b', OBJ_ACCESS_KEY: 'a', OBJ_SECRET_KEY: 's' }))
      .toEqual({ endpoint: 'https://e.example', bucket: 'b', accessKey: 'a', secretKey: 's', region: 'us-east-1' });
  });
});

describe('fileStorage', () => {
  it('puts, gets and lists in key order', async () => {
    const fs = fileStorage(join(await tempDir(), 'not-created-yet'));
    expect(fs.kind).toBe('local');
    expect(await fs.list('scores/', 10)).toEqual([]);
    expect(await fs.get('scores/a.json')).toBeNull();
    await fs.put('scores/b.json', 'B', 'application/json');
    await fs.put('scores/a.json', 'A', 'application/json');
    await fs.put('scores/c.json', 'C', 'application/json');
    await fs.put('replays/z.json', 'Z', 'application/json');
    expect(await fs.get('scores/a.json')).toBe('A');
    expect(await fs.list('scores/', 10)).toEqual(['scores/a.json', 'scores/b.json', 'scores/c.json']);
    expect(await fs.list('scores/', 2)).toEqual(['scores/a.json', 'scores/b.json']);
  });
});

// A finished level-1 game from the real engine, with one tagged bot post, one DM and one player post.
function play(seed: number, voteBot: boolean): GameState {
  let s = step(init(seed, 1), { type: 'tick', dt: PHASE_MS.event });
  const bot = aliveBots(s)[0];
  s = step(s, { type: 'say', author: bot.id, text: 'Roads close in 20 min, share now', tactic: 'fake_urgency' });
  s = step(s, { type: 'say', author: bot.id, text: 'DM-SECRET', to: bot.id });
  s = step(s, { type: 'post', text: 'PLAYER-TEXT' });
  for (let i = 0; i < 10 && s.phase !== 'over'; i++) {
    s = step(s, { type: 'call_meeting' });
    s = step(s, { type: 'vote', target: voteBot ? aliveBots(s)[0].id : null });
    s = step(s, { type: 'tick', dt: PHASE_MS.ejection });
    s = step(s, { type: 'tick', dt: PHASE_MS.event });
  }
  expect(s.phase).toBe('over');
  return s;
}

describe('the store over HTTP', () => {
  async function serve(opts: Partial<StoreOptions> = {}) {
    const store = createStore({ storage: fileStorage(await tempDir()), ...opts });
    const url = await listen(createServer(async (req, res) => { if (!await store.handle(req, res)) res.writeHead(418).end(); }));
    const post = (body: unknown, headers: Record<string, string> = {}) =>
      fetch(`${url}/api/replays`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
    const save = async (body: unknown) => await (await post(body)).json() as SaveResponse;
    const replay = async (id: string) => (await (await fetch(`${url}/api/replays/${id}`)).json() as ReplayResponse).replay;
    return { url, store, post, save, replay };
  }
  const brokenStorage: Storage = { kind: 'object-storage', put: async () => { throw new Error('bucket down'); }, get: async () => { throw new Error('bucket down'); }, list: async () => { throw new Error('bucket down'); } };

  it('saves a finished game and serves the public-safe replay', async () => {
    const { url, post, store } = await serve();
    const state = play(11, true);
    const res = await post({ state, refereeLog: [], playerName: '  Ada  ', score: 999999 });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const saved = await res.json() as SaveResponse;
    expect(saved.id).toMatch(/^[a-f0-9]{12}$/);
    expect(saved.shareUrl).toBe(`${url}/?replay=${saved.id}`);
    expect(saved.score).toBe(radar(state).score);

    const got = await fetch(`${url}/api/replays/${saved.id}`);
    expect(got.status).toBe(200);
    const { replay, source } = await got.json() as ReplayResponse;
    expect(source).toBe('local');
    expect(replay).toMatchObject({ v: 1, id: saved.id, playerName: 'Ada', level: 1, result: state.result, infection: state.infection, score: saved.score, radar: radar(state), ejections: state.ejections });
    expect(replay.rounds).toEqual(state.scenario.rounds.slice(0, state.round));
    expect(replay.characters.map(c => [c.id, c.role])).toEqual(state.characters.map(c => [c.id, c.role]));
    expect(replay.characters[0]).not.toHaveProperty('clues');
    const text = JSON.stringify(replay);
    expect(text).not.toContain('DM-SECRET');
    expect(text).not.toContain('PLAYER-TEXT');
    expect(replay.posts.some(p => p.author === 'you')).toBe(false);
    expect(replay.posts).toContainEqual({ author: aliveBots(init(11, 1))[0].id, text: 'Roads close in 20 min, share now', round: 1, tactic: 'fake_urgency' });
    expect(replay.posts.filter(p => p.author === 'news')).toHaveLength(state.round);
    expect(await store.health()).toBe('up');
  });

  it('builds the share link from PUBLIC_APP_URL, else from the request', async () => {
    const state = play(11, true);
    const fixed = await serve({ publicAppUrl: 'https://game.example/' });
    const a = await fixed.save({ state });
    expect(a.shareUrl).toBe(`https://game.example/?replay=${a.id}`);
    const proxied = await serve();
    const b = await (await proxied.post({ state }, { 'x-forwarded-proto': 'https, http' })).json() as SaveResponse;
    expect(b.shareUrl).toBe(`${proxied.url.replace('http:', 'https:')}/?replay=${b.id}`);
  });

  it('rejects bad requests', async () => {
    const { url, post } = await serve();
    const over = play(11, true);
    expect((await post({ state: init(1) })).status).toBe(400);
    expect((await post('not json')).status).toBe(400);
    for (const body of [null, [], 7, {}, { state: 'x' }, { state: [] }]) expect((await post(body)).status).toBe(400);
    const res = await post({ state: { ...over, level: 3 } });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad level' });
    expect((await post({ state: over, pad: 'x'.repeat(1_100_000) })).status).toBe(413);
    expect((await fetch(`${url}/api/replays`)).status).toBe(405);
    expect((await fetch(`${url}/api/leaderboard`, { method: 'POST' })).status).toBe(405);
  });

  it('toReplay refuses every forged shape', () => {
    const over = play(11, true);
    const c = over.characters[0], p = over.feed[0];
    const human = over.characters.find(x => x.role === 'human')!, caught = over.ejections.find(e => e.id)!;
    const forged: Record<string, unknown>[] = [
      { result: 'draw' }, { result: undefined }, { infection: 101 }, { infection: -1 }, { infection: '5' }, { infection: null }, { round: 0 }, { round: 1.5 }, { round: 11 },
      { characters: [] }, { characters: Array(13).fill(c) }, { characters: 'x' }, { characters: [null] },
      { characters: [{ ...c, role: 'admin' }] }, { characters: [{ ...c, id: 5 }] }, { characters: [{ ...c, ejected: 'no' }] },
      { characters: [{ ...c, tactics: ['toString'] }] }, { characters: [{ ...c, tactics: Array(7).fill('fake_urgency') }] }, { characters: [{ ...c, tactics: null }] },
      { feed: Array(2001).fill(p) }, { feed: [{ ...p, text: 5 }] }, { feed: [{ ...p, round: null }] }, { feed: {} },
      { ejections: Array(11).fill({ round: 1, id: null, wasBot: false }) }, { ejections: [{ round: 1, id: 5, wasBot: false }] }, { ejections: [{ round: 1, id: null, wasBot: 'yes' }] },
      { ejections: [{ round: 1, id: 'nobody', wasBot: true }] }, { ejections: [caught, caught] }, { characters: [human] }, { characters: over.characters.map(x => ({ ...x, role: 'bot' })) },
      { scenario: null }, { scenario: { rounds: [] } }, { scenario: { rounds: [{ alert: 'a', truth: 'b' }] } }, { scenario: { rounds: Array(11).fill(over.scenario.rounds[0]) } },
    ];
    for (const change of forged) expect(() => toReplay({ state: { ...over, ...change } }, 'a'.repeat(12), ''), JSON.stringify(change).slice(0, 80)).toThrow(expect.objectContaining({ status: 400 }));
    // A wasBot lie about a real human is scored from the cast: -75, not +100.
    const lie = toReplay({ state: { ...over, ejections: [{ round: 1, id: human.id, wasBot: true }] } }, 'a'.repeat(12), '');
    expect(lie.ejections).toEqual([{ round: 1, id: human.id, wasBot: false }]);
    expect(lie.radar).toMatchObject({ botsCaught: 0, humansEjected: 1, score: 25 - over.infection });
    expect(toReplay({ state: over, playerName: 7 }, 'a'.repeat(12), '').playerName).toBeNull();
    expect(toReplay({ state: over, playerName: ' \n ' }, 'a'.repeat(12), '').playerName).toBeNull();
  });

  it('caps forged strings, strips control characters and never trusts a client score', async () => {
    const { save, replay } = await serve();
    const state = structuredClone(play(11, true)) as GameState & { score?: number };
    const big = 'x\u0000\n'.repeat(5000);
    Object.assign(state.characters[0], { handle: big, bio: big, color: 'red;background:url(x)' });
    state.feed[0].text = big;
    state.feed.push({ id: 'p99', author: 'stranger', text: 'not a character', at: 0, round: 1 }, { id: 'p100', author: state.characters[1].id, text: 'tagged', at: 0, round: 1, tactic: 'made_up' as never });
    state.scenario.rounds[0] = { alert: big, truth: big, falseStory: big };
    state.score = 999999;
    const saved = await save({ state, playerName: `\u0007${'n'.repeat(100)}`, radar: { score: 999999 } });
    expect(saved.score).toBe(radar(state).score);
    const r = await replay(saved.id);
    expect(r.characters[0]).toMatchObject({ handle: 'x'.repeat(40), bio: 'x'.repeat(120), color: '#888888' });
    expect(r.posts[0].text).toBe('x'.repeat(280));
    expect(r.rounds[0]).toEqual({ alert: 'x'.repeat(400), truth: 'x'.repeat(400), falseStory: 'x'.repeat(400) });
    expect(r.playerName).toBe('n'.repeat(24));
    expect(r.posts.some(p => p.author === 'stranger')).toBe(false);
    expect(r.posts.at(-1)).toEqual({ author: state.characters[1].id, text: 'tagged', round: 1 });
    expect(r.radar.score).toBe(saved.score);
  });

  it('answers 404 for unknown and path-like ids, and leaves other paths alone', async () => {
    const { url } = await serve();
    for (const id of ['000000000000', '..%2F..%2Fsecret', 'ABCDEF012345', '0000000000000', '']) expect((await fetch(`${url}/api/replays/${id}`)).status, id).toBe(404);
    for (const path of ['/api/line', '/api/replay', '/api/leaderboard/x', '/']) expect((await fetch(url + path)).status, path).toBe(418);
  });

  it('lists the best score first, and "Anonymous" without a name', async () => {
    const { url, save } = await serve();
    const board = async () => await (await fetch(`${url}/api/leaderboard`)).json() as LeaderboardResponse;
    expect(await board()).toEqual({ entries: [], source: 'local' });
    const low = play(11, false), high = play(11, true);
    expect(radar(high).score).toBeGreaterThan(radar(low).score);
    const a = await save({ state: low });
    const b = await save({ state: high, playerName: 'Ada' });
    const { entries } = await board(); // also proves the save cleared the cached empty board
    expect(entries.map(e => [e.id, e.name, e.score])).toEqual([[b.id, 'Ada', radar(high).score], [a.id, 'Anonymous', radar(low).score]]);
    expect(entries[0]).toMatchObject({ result: high.result, level: 1, infection: high.infection });
  });

  it('breaks a score tie in favour of the earlier game, and keeps only the top 10', async () => {
    let t = Date.UTC(2026, 10, 20);
    const { url, save } = await serve({ now: () => new Date(t += 1000) });
    const state = play(11, true);
    const ids: string[] = [];
    for (let i = 0; i < 12; i++) ids.push((await save({ state })).id);
    const { entries } = await (await fetch(`${url}/api/leaderboard`)).json() as LeaderboardResponse;
    expect(entries.map(e => e.id)).toEqual(ids.slice(0, 10));
  });

  it('does not cache a leaderboard read that raced a save', async () => {
    const files = fileStorage(await tempDir());
    let release = () => {}, started = () => {}, calls = 0;
    const gate = new Promise<void>(r => { release = r; }), listing = new Promise<void>(r => { started = r; });
    const storage: Storage = { ...files, list: async (prefix, limit) => { const keys = await files.list(prefix, limit); if (calls++ === 0) { started(); await gate; } return keys; } };
    const { url, save } = await serve({ storage });
    const board = async () => await (await fetch(`${url}/api/leaderboard`)).json() as LeaderboardResponse;
    const early = board(); // what the game-over screen does: it loads the board while the save is in flight
    await listing;
    const { id } = await save({ state: play(11, true) });
    release();
    expect((await early).entries).toEqual([]);
    expect((await board()).entries.map(e => e.id)).toEqual([id]);
  });

  it('limits saves per minute', async () => {
    const { post } = await serve({ maxSavesPerMinute: 1 });
    const state = play(11, true);
    expect((await post({ state })).status).toBe(200);
    expect((await post({ state })).status).toBe(429);
  });

  it('still answers when storage is down', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const saveGame = vi.fn(async () => {});
    const { url, post, store } = await serve({ storage: brokenStorage, saveGame });
    const res = await post({ state: play(11, true) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ shareUrl: null, score: radar(play(11, true)).score });
    expect(saveGame).toHaveBeenCalledOnce();
    expect((await fetch(`${url}/api/replays/000000000000`)).status).toBe(502);
    const board = await fetch(`${url}/api/leaderboard`);
    expect(board.status).toBe(200);
    expect(await board.json()).toEqual({ entries: [], source: 'object-storage' });
    expect(await store.health()).toBe('down');
    expect(error).toHaveBeenCalled();
  });

  it('calls the save hook with the id and score, and survives a failing one', async () => {
    const state = play(11, true);
    const games: SavedGame[] = [];
    const working = await serve({ saveGame: async g => { games.push(g); } });
    const a = await working.save({ state, refereeLog: [{ round: 1 }], classCode: ' 7B ', playerName: 'Ada' });
    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({ id: a.id, score: a.score, classCode: '7B', playerName: 'Ada', refereeLog: [{ round: 1 }] });
    expect(games[0].state.feed).toHaveLength(state.feed.length);

    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = await serve({ saveGame: async () => { throw new Error('database down'); } });
    const b = await failing.save({ state, classCode: 'x'.repeat(25), refereeLog: 'nope' });
    expect(b.shareUrl).toContain(b.id);

    const hanging = await serve({ saveGame: () => new Promise(() => {}) }); // a database that never answers
    const c = await hanging.save({ state });
    expect(c.shareUrl).toContain(c.id);

    hooks.saveGame = async g => { games.push(g); }; // what db/ will do
    const viaHooks = await serve();
    await viaHooks.save({ state, classCode: 'x'.repeat(25), refereeLog: 'nope' });
    expect(games[1]).toMatchObject({ classCode: null, playerName: null, refereeLog: [] });
  });
});
