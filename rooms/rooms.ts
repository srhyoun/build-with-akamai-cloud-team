// "Play together" rooms: a 4-letter code, one shared town (seed + level), and a scoreboard of who finished.
// shortcut: rooms live in memory, so they are lost on restart and only work with one server; fine for a demo, move to the db when we scale out.
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface RoomPlayer { name: string; joinedAt: number; done: boolean; result?: 'won' | 'lost'; score?: number; infection?: number; finishedAt?: number }
export interface Room { code: string; seed: number; level: 1 | 2 | 3; createdAt: number; players: RoomPlayer[]; live?: boolean } // live = the room has one shared game (rooms/live.ts)

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O
const MAX_BODY = 4096;
const TTL = 3 * 60 * 60 * 1000;
const MAX_PLAYERS = 30;

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

// Over the cap it keeps reading but stops storing: closing the socket mid-upload would lose the 413 answer.
async function readBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) { size += chunk.length; if (size <= MAX_BODY) chunks.push(chunk); }
  return size > MAX_BODY ? null : Buffer.concat(chunks).toString('utf8');
}

const cleanName = (v: unknown) => typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim().slice(0, 20).trim() : '';
const clamp = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null;

export function createRooms(opts: { now?: () => number; random?: () => number; maxRooms?: number } = {}) {
  const now = opts.now ?? Date.now;
  const random = opts.random ?? Math.random;
  const maxRooms = opts.maxRooms ?? 300;
  const rooms = new Map<string, Room>();

  // Adds a player under a name nobody in the room has yet: "Ada", then "Ada 2", "Ada 3"…
  function add(room: Room, base: string): string {
    let name = base;
    for (let n = 2; room.players.some(p => p.name === name); n++) name = `${base.slice(0, 20 - ` ${n}`.length)} ${n}`;
    room.players.push({ name, joinedAt: now(), done: false });
    return name;
  }

  // Same room + same slot = the same villager line for every player, so a room really plays one chat.
  // The first request makes the line; everyone else (also while it is still being made) gets that one.
  const lines = new Map<string, Promise<{ status: number; body: unknown }>>();
  function lineKey(body: unknown): string | null {
    const b = body as { room?: unknown; slot?: unknown } | null;
    if (!b || typeof b.room !== 'string' || typeof b.slot !== 'string' || !/^[\w:.-]{1,60}$/.test(b.slot)) return null;
    const code = b.room.toUpperCase();
    return rooms.has(code) ? `${code}|${b.slot}` : null;
  }
  function sharedLine<T extends { status: number; body: unknown }>(key: string, make: () => Promise<T>): Promise<T> {
    const hit = lines.get(key);
    if (hit) return hit as Promise<T>;
    if (lines.size >= 5000) lines.delete(lines.keys().next().value!); // shortcut: drop the oldest, never grows without bound
    const made = make().then(r => { if (r.status !== 200) lines.delete(key); return r; }, e => { lines.delete(key); throw e; });
    lines.set(key, made);
    return made;
  }

  async function route(req: IncomingMessage, res: ServerResponse, parts: string[]) {
    const t = now();
    for (const [code, room] of rooms) if (t - room.createdAt >= TTL) rooms.delete(code);

    const [rawCode, action] = parts;
    const known = rawCode === undefined ? parts.length === 0 : parts.length === 1 || (parts.length === 2 && (action === 'join' || action === 'result'));
    if (!known) return send(res, 404, { error: 'no such rooms route' });
    if (req.method !== (parts.length === 1 ? 'GET' : 'POST')) return send(res, 405, { error: 'method not allowed' });

    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      const raw = await readBody(req);
      if (raw === null) return send(res, 413, { error: 'body over 4 KB' });
      try { body = raw.trim() ? JSON.parse(raw) : {}; } catch { return send(res, 400, { error: 'body is not JSON' }); }
      if (typeof body !== 'object' || body === null || Array.isArray(body)) return send(res, 400, { error: 'body must be a JSON object' });
    }

    if (rawCode === undefined) {
      if (rooms.size >= maxRooms) return send(res, 429, { error: 'too many rooms, try again later' });
      let code = '';
      for (let tries = 0; tries < 50 && (!code || rooms.has(code)); tries++) {
        code = Array.from({ length: 4 }, () => LETTERS[Math.min(LETTERS.length - 1, Math.floor(random() * LETTERS.length))]).join('');
      }
      if (rooms.has(code)) return send(res, 429, { error: 'no free room code, try again' });
      const level = body.level === 2 || body.level === 3 ? body.level : 1;
      const room: Room = { code, seed: 1 + Math.floor(random() * (1e9 - 1)), level, createdAt: t, players: [] };
      const name = cleanName(body.name);
      if (name) add(room, name);
      rooms.set(code, room);
      return send(res, 200, room);
    }

    const room = rooms.get(rawCode.toUpperCase());
    if (!room) return send(res, 404, { error: 'room not found' });
    if (action === undefined) return send(res, 200, room);

    if (action === 'join') {
      const name = cleanName(body.name);
      if (!name) return send(res, 400, { error: 'name is required' });
      if (room.players.length >= MAX_PLAYERS) return send(res, 409, { error: 'room is full' });
      return send(res, 200, { room, name: add(room, name) });
    }

    // shortcut: the client reports its own score, which is fine for a party game; verify against the saved replay if scores ever matter.
    const score = clamp(body.score, -1000, 1000);
    const infection = clamp(body.infection, 0, 100);
    if (typeof body.name !== 'string' || (body.result !== 'won' && body.result !== 'lost') || score === null || infection === null) {
      return send(res, 400, { error: 'need name, result "won" or "lost", score and infection numbers' });
    }
    const player = room.players.find(p => p.name === body.name) ?? room.players.find(p => p.name === cleanName(body.name));
    if (!player) return send(res, 404, { error: 'no such player in this room' });
    if (!player.done) Object.assign(player, { done: true, result: body.result, score, infection, finishedAt: t }); // first result wins
    send(res, 200, room);
  }

  return {
    lineKey, sharedLine,
    get: (code: string): Room | undefined => rooms.get(code.toUpperCase()),
    async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
      const path = (req.url ?? '').split('?')[0];
      if (path !== '/api/rooms' && !path.startsWith('/api/rooms/')) return false;
      try {
        await route(req, res, path.slice('/api/rooms'.length).split('/').filter(Boolean));
      } catch (e) {
        console.error('rooms:', e);
        if (!res.headersSent) send(res, 500, { error: 'server error' });
        else res.end();
      }
      return true;
    },
  };
}

const rooms = createRooms();
export function handleRooms(req: IncomingMessage, res: ServerResponse): Promise<boolean> { return rooms.handle(req, res); }
export const getRoom = rooms.get;
export const roomLineKey = rooms.lineKey;
export const sharedRoomLine = rooms.sharedLine;
