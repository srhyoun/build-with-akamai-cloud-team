import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRooms } from './rooms.ts';
import type { Room } from './rooms.ts';

let server: Server;
let base: string;
let t: number;

beforeEach(async () => {
  t = 1_700_000_000_000;
  let i = 0;
  const rooms = createRooms({ now: () => t, random: () => ((i++ * 7919) % 1000) / 1000, maxRooms: 3 });
  server = createServer(async (req, res) => { if (!(await rooms.handle(req, res))) res.writeHead(418).end('not rooms'); });
  await new Promise<void>(r => server.listen(0, r));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});
afterEach(() => new Promise<void>(r => { server.close(() => r()); server.closeAllConnections(); }));

const post = (path: string, body?: unknown) => fetch(base + path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const create = async (body?: unknown) => (await (await post('/api/rooms', body)).json()) as Room;

describe('rooms', () => {
  it('creates a room with a 4-letter code, a seed and a level', async () => {
    const res = await post('/api/rooms', { level: 2 });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const room = (await res.json()) as Room;
    expect(room.code).toMatch(/^[A-HJ-NP-Z]{4}$/);
    expect(Number.isInteger(room.seed) && room.seed >= 1 && room.seed < 1e9).toBe(true);
    expect(room).toMatchObject({ level: 2, createdAt: t, players: [] });
    expect((await create()).level).toBe(1); // no body: level 1
    expect((await create({ level: 9 })).level).toBe(1);
  });

  it('puts a named creator in players', async () => {
    const room = await create({ name: '  Ada\u0007  ' });
    expect(room.players).toEqual([{ name: 'Ada', joinedAt: t, done: false }]);
  });

  it('joins, renames a taken name, accepts a lower-case code, and GET shows both', async () => {
    const { code } = await create();
    const a = await (await post(`/api/rooms/${code}/join`, { name: 'Ada' })).json();
    const b = await (await post(`/api/rooms/${code.toLowerCase()}/join`, { name: 'Ada' })).json();
    expect([a.name, b.name]).toEqual(['Ada', 'Ada 2']);
    const res = await fetch(`${base}/api/rooms/${code.toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(((await res.json()) as Room).players.map(p => p.name)).toEqual(['Ada', 'Ada 2']);
  });

  it('records a result once, clamped, and ignores a second one', async () => {
    const { code } = await create({ name: 'Ada' });
    const first = await post(`/api/rooms/${code}/result`, { name: 'Ada', result: 'won', score: 5000, infection: -3 });
    expect(first.status).toBe(200);
    expect(((await first.json()) as Room).players[0]).toEqual({ name: 'Ada', joinedAt: t, done: true, result: 'won', score: 1000, infection: 0, finishedAt: t });
    const second = (await (await post(`/api/rooms/${code}/result`, { name: 'Ada', result: 'lost', score: 1, infection: 50 })).json()) as Room;
    expect(second.players[0]).toMatchObject({ result: 'won', score: 1000 });
  });

  it('answers 404 for an unknown name or code, 400 for a bad body or an empty name', async () => {
    const { code } = await create({ name: 'Ada' });
    const good = { name: 'Ada', result: 'won', score: 10, infection: 10 };
    expect((await post(`/api/rooms/${code}/result`, { ...good, name: 'Bob' })).status).toBe(404);
    expect((await post(`/api/rooms/${code}/result`, { ...good, result: 'draw' })).status).toBe(400);
    expect((await post(`/api/rooms/${code}/result`, { ...good, score: 'ten' })).status).toBe(400);
    expect((await fetch(`${base}/api/rooms/ZZZZ`)).status).toBe(404);
    expect((await post('/api/rooms/ZZZZ/join', { name: 'Ada' })).status).toBe(404);
    expect((await post(`/api/rooms/${code}/join`, { name: '   ' })).status).toBe(400);
    expect((await post(`/api/rooms/${code}/join`, {})).status).toBe(400);
    expect((await fetch(base + '/api/rooms', { method: 'POST', body: '{not json' })).status).toBe(400);
    expect((await fetch(`${base}/api/rooms/${code}/join`)).status).toBe(405);
    expect((await post(`/api/rooms/${code}/nope`, {})).status).toBe(404);
  });

  it('answers 409 when the room is full', async () => {
    const { code } = await create();
    for (let n = 0; n < 30; n++) expect((await post(`/api/rooms/${code}/join`, { name: `P${n}` })).status).toBe(200);
    expect((await post(`/api/rooms/${code}/join`, { name: 'Late' })).status).toBe(409);
  });

  it('expires a room after 3 hours, which also frees its slot', async () => {
    const { code } = await create();
    await create(); await create();
    expect((await post('/api/rooms')).status).toBe(429); // maxRooms is 3 here
    t += 3 * 60 * 60 * 1000;
    expect((await fetch(`${base}/api/rooms/${code}`)).status).toBe(404);
    expect((await post('/api/rooms')).status).toBe(200);
  });

  it('leaves other paths alone and refuses a 5 KB body', async () => {
    expect((await fetch(base + '/api/leaderboard')).status).toBe(418);
    expect((await fetch(base + '/api/roomsx')).status).toBe(418);
    expect((await post('/api/rooms', { name: 'x'.repeat(5000) })).status).toBe(413);
  });
});

describe('shared room lines', () => {
  it('gives every player in a room the same line for the same slot, and makes it once', async () => {
    const { createRooms } = await import('./rooms.ts');
    const { createServer } = await import('node:http');
    const r = createRooms();
    const server = createServer((req, res) => { void r.handle(req, res); }).listen(0);
    const port = (server.address() as { port: number }).port;
    const room = await (await fetch(`http://localhost:${port}/api/rooms`, { method: 'POST', body: '{}' })).json() as { code: string };
    server.close();

    const key = r.lineKey({ room: room.code.toLowerCase(), slot: '1:post:0:mike' });
    expect(key).toBe(`${room.code}|1:post:0:mike`);
    expect(r.lineKey({ room: 'ZZZZ', slot: '1:post:0:mike' })).toBeNull();      // unknown room: not shared
    expect(r.lineKey({ room: room.code, slot: 'bad slot!' })).toBeNull();
    expect(r.lineKey({ state: {} })).toBeNull();                                 // a normal game: not shared

    let made = 0;
    const make = async () => ({ status: 200, body: { text: `line ${++made}` } });
    const [a, b] = await Promise.all([r.sharedLine(key!, make), r.sharedLine(key!, make)]); // two players at once
    const c = await r.sharedLine(key!, make);
    expect([a.body, b.body, c.body]).toEqual([{ text: 'line 1' }, { text: 'line 1' }, { text: 'line 1' }]);
    expect(made).toBe(1);

    // a failed line is not kept: the next player's request tries again
    let tries = 0;
    const flaky = async () => ({ status: ++tries === 1 ? 502 : 200, body: { text: `try ${tries}` } });
    expect((await r.sharedLine('X|1', flaky)).status).toBe(502);
    expect((await r.sharedLine('X|1', flaky)).body).toEqual({ text: 'try 2' });
  });
});
