import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRooms } from './rooms.ts';
import type { Room } from './rooms.ts';
import { createLive } from './live.ts';
import type { LiveView, MakeLine } from './live.ts';

let server: Server;
let base: string;
let t: number;                 // the injected clock: the game only moves when a test moves it
let lineStatus: number;
let live: ReturnType<typeof createLive>;
let code: string;

beforeEach(async () => {
  t = 1_700_000_000_000;
  lineStatus = 200;
  let n = 0;
  const makeLine: MakeLine = async (_s, charId) => lineStatus === 200
    ? { status: 200, body: { type: 'say', author: charId, text: 'line ' + n++, check: { pass: true } } }
    : { status: lineStatus, body: { error: 'no model' } };
  const rooms = createRooms({ now: () => t });
  live = createLive({ getRoom: rooms.get, makeLine, now: () => t, random: () => 0.5, tickMs: 20 });
  server = createServer(async (req, res) => {
    if (await live.handle(req, res)) return;
    if (!(await rooms.handle(req, res))) res.writeHead(418).end('not rooms');
  });
  await new Promise<void>(r => server.listen(0, r));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
  code = ((await (await post('/api/rooms', { name: 'Ada' })).json()) as Room).code;
  await post(`/api/rooms/${code}/join`, { name: 'Bo' });
});
afterEach(() => { live.stop(); return new Promise<void>(r => { server.close(() => r()); server.closeAllConnections(); }); });

const post = (path: string, body?: unknown) => fetch(base + path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const start = async (name = 'Ada') => (await (await post(`/api/rooms/${code}/live/start`, { name })).json()) as LiveView;
const get = async (name = 'Bo') => (await (await fetch(`${base}/api/rooms/${code.toLowerCase()}/live?name=${name}`)).json()) as LiveView;
const cmd = (name: string, c: unknown) => post(`/api/rooms/${code}/live/cmd`, { name, cmd: c });
const view = async (name: string, c: unknown) => (await (await cmd(name, c)).json()) as LiveView;
async function until(ok: (v: LiveView) => boolean): Promise<LiveView> {
  for (let i = 0; i < 100; i++) { const v = await get(); if (ok(v)) return v; await new Promise(r => setTimeout(r, 10)); }
  throw new Error('the shared game never got there');
}
async function meeting(): Promise<LiveView> {
  await start();
  t += 10_001; // the event phase ends
  await until(v => v.state.phase === 'discussion');
  return view('Ada', { type: 'call_meeting' });
}

describe('live rooms', () => {
  it('is 404 before the start, 403 for a stranger, and starts once', async () => {
    expect((await fetch(`${base}/api/rooms/${code}/live?name=Ada`)).status).toBe(404);
    expect((await post(`/api/rooms/${code}/live/start`, { name: 'Eve' })).status).toBe(403);
    expect((await post('/api/rooms/ZZZZ/live/start', { name: 'Ada' })).status).toBe(404);
    const res = await post(`/api/rooms/${code}/live/start`, { name: 'Ada' });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const a = (await res.json()) as LiveView;
    const room = (await (await fetch(`${base}/api/rooms/${code}`)).json()) as Room;
    expect(room.live).toBe(true);
    expect(a).toMatchObject({ players: ['Ada', 'Bo'], voted: [], posters: {}, state: { seed: room.seed, level: room.level, phase: 'event' } });
    const b = await start('Bo');
    expect(b.state.feed[0]).toEqual(a.state.feed[0]); // the same game, not a second one
    expect(b.version).toBeGreaterThanOrEqual(a.version);
    expect((await fetch(`${base}/api/rooms/${code}/live?name=Eve`)).status).toBe(403);
    expect((await post(`/api/rooms/${code}/live`, { name: 'Ada' })).status).toBe(405);
  });

  it('shares a post with its poster, and the villager it was sent to answers', async () => {
    const who = (await start()).state.characters[0].id;
    const mine = await view('Ada', { type: 'post', text: '  hello\u0007town ' + 'x'.repeat(400) });
    const p = mine.state.feed.at(-1)!;
    expect(p).toMatchObject({ author: 'you' });
    expect(p.text.startsWith('hello town x')).toBe(true);
    expect(p.text.length).toBe(280);
    expect(mine.posters).toEqual({ [p.id]: 'Ada' });
    const dm = await view('Bo', { type: 'post', text: 'psst', to: who });
    const seen = await get('Ada');
    expect(seen.posters).toEqual({ [p.id]: 'Ada', [dm.state.feed.at(-1)!.id]: 'Bo' });
    expect(seen.version).toBeGreaterThan(mine.version);
    t += 3600; // past every reply delay
    const after = await until(v => v.state.feed.some(x => x.author === who && x.to === who));
    expect(after.state.feed.find(x => x.author === who && x.to === who)!.text).toMatch(/^line \d+$/);
    expect(JSON.stringify(after.state.feed)).not.toContain('check');
  });

  it('ejects by the team vote once every player has voted', async () => {
    const m = await meeting();
    expect(m.state.phase).toBe('meeting');
    const target = m.state.characters[1].id;
    const one = await view('Ada', { type: 'vote', target });
    expect(one.state.phase).toBe('meeting');
    expect(one.voted).toEqual(['Ada']);
    const two = await view('Bo', { type: 'vote', target });
    expect(two.state.phase).not.toBe('meeting');
    expect(two.state.votes[0]).toEqual({ voter: 'you', target });
  });

  it('skips on a split vote, and sends the votes it has when the meeting runs out', async () => {
    const m = await meeting();
    const [a, b] = m.state.characters;
    await view('Ada', { type: 'vote', target: a.id });
    const split = await view('Bo', { type: 'vote', target: b.id });
    expect(split.state.phase).not.toBe('meeting');
    expect(split.state.votes[0]).toEqual({ voter: 'you', target: null });

    t += 10_001; // ejection ends: round 2
    await until(v => v.state.round === 2 && v.state.phase === 'event');
    t += 10_001;
    await until(v => v.state.phase === 'discussion');
    const again = await view('Bo', { type: 'call_meeting' });
    expect(again.voted).toEqual([]);
    const target = again.state.characters.find(c => !c.ejected)!.id;
    await view('Ada', { type: 'vote', target });
    t += 29_500; // within 600 ms of the end, Bo never voted
    const done = await until(v => v.state.phase !== 'meeting');
    expect(done.state.votes[0]).toEqual({ voter: 'you', target });
  });

  it('starts a new town when the last game is finished', async () => {
    const first = await start();
    t += 21 * 60 * 1000; // past the 20 minute cap: the game is stopped
    await until(v => v.state.phase !== 'event');
    await new Promise(r => setTimeout(r, 60)); // the tick that stops it has run
    const next = await start('Bo');
    expect(next.state.phase).toBe('event');
    expect(next.state.seed).toBe(first.state.seed + 1);
    expect((await start()).state.seed).toBe(next.state.seed); // and that one is shared again
  });

  it('answers 400 for a bad command', async () => {
    await start();
    for (const c of [undefined, 'post', { type: 'say', author: 'x', text: 'hi' }, { type: 'tick', dt: 99999 }, { type: 'post' }, { type: 'post', text: ' ' },
      { type: 'post', text: 'hi', to: 'nobody' }, { type: 'use_tool', tool: 'nuke', target: 'x' }, { type: 'use_tool', tool: 'account_age', target: 'x'.repeat(61) },
      { type: 'vote', target: 'nobody' }, { type: 'vote', target: 7 }]) {
      expect((await cmd('Ada', c)).status, JSON.stringify(c)).toBe(400);
    }
    expect((await cmd('Eve', { type: 'call_meeting' })).status).toBe(403);
    expect((await post(`/api/rooms/${code}/live/cmd`, { name: 'Ada', cmd: { type: 'post', text: 'x'.repeat(5000) } })).status).toBe(413);
    expect((await fetch(`${base}/api/rooms/${code}/live/cmd`, { method: 'POST', body: '{' })).status).toBe(400);
  });

  it('leaves every other path alone', async () => {
    expect((await fetch(`${base}/api/rooms/${code}`)).status).toBe(200);
    expect((await fetch(`${base}/api/rooms/${code}/lively`)).status).toBe(404); // the rooms handler's 404
    expect((await fetch(`${base}/api/live`)).status).toBe(418);
  });

  it('falls back to a scripted line when the model is off', async () => {
    lineStatus = 503;
    await start();
    t += 3001; // the first chatter
    const v = await until(x => x.state.feed.some(p => p.author !== 'news' && p.author !== 'you'));
    expect(v.state.feed.at(-1)!.text).not.toMatch(/^line \d+$/);
  });
});
