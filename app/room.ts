// Client for "Play together" rooms (rooms/). Every call answers null on failure: the game must keep working with no server.
import type { Command } from '../shared/types.ts';
import type { LiveView } from '../rooms/live.ts';
import type { Room } from '../rooms/rooms.ts';

// live: this player is in the room's one shared game (rooms/live.ts) instead of their own.
export interface RoomSession { code: string; seed: number; level: 1 | 2 | 3; name: string; live?: boolean }

const KEY = 'wtb-room';
export const CODE_RE = /^[A-HJ-NP-Z]{4}$/;

// sessionStorage: a reload keeps you in the room, a new tab does not.
export function getRoomSession(): RoomSession | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    return s && CODE_RE.test(s.code) && Number.isFinite(s.seed) && [1, 2, 3].includes(s.level) && typeof s.name === 'string' ? s : null;
  } catch { return null; }
}
export function setRoomSession(s: RoomSession | null): void {
  try { if (s) sessionStorage.setItem(KEY, JSON.stringify(s)); else sessionStorage.removeItem(KEY); } catch { /* private mode: the room lasts until reload */ }
}

export function roomCodeFromUrl(search: string = location.search): string | null {
  const code = new URLSearchParams(search).get('room')?.toUpperCase();
  return code && CODE_RE.test(code) ? code : null;
}

async function json<T>(url: string, body?: unknown): Promise<T | null> {
  try {
    const r = await fetch(url, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return r.status === 200 ? await r.json() as T : null;
  } catch { return null; }
}

const session = (room: Room, name: string): RoomSession => ({ code: room.code, seed: room.seed, level: room.level, name });

export async function createRoom(level: 1 | 2 | 3, name: string): Promise<{ room: Room; session: RoomSession } | null> {
  const room = await json<Room>('/api/rooms', { level, name });
  // The creator is the first player, so the name comes back as sent (trimmed by the server).
  return room ? { room, session: session(room, room.players[0]?.name ?? name) } : null;
}
export async function joinRoom(code: string, name: string): Promise<{ room: Room; session: RoomSession } | null> {
  const r = await json<{ room: Room; name: string }>(`/api/rooms/${code}/join`, { name });
  return r ? { room: r.room, session: session(r.room, r.name) } : null;
}
export const fetchRoom = (code: string) => json<Room>(`/api/rooms/${code}`);
export const sendResult = (s: RoomSession, r: { result: 'won' | 'lost'; score: number; infection: number }) =>
  json<Room>(`/api/rooms/${s.code}/result`, { name: s.name, ...r });

// The room's shared live game. `who` is the player's room session (only code and name are sent).
type Who = Pick<RoomSession, 'code' | 'name'>;
export const startLive = (s: Who) => json<LiveView>(`/api/rooms/${s.code}/live/start`, { name: s.name });
export const fetchLive = (s: Who) => json<LiveView>(`/api/rooms/${s.code}/live?name=${encodeURIComponent(s.name)}`);
export const sendLive = (s: Who, cmd: Command) => json<LiveView>(`/api/rooms/${s.code}/live/cmd`, { name: s.name, cmd });

export const roomLink = (code: string) => `${location.origin}/?room=${code}`;
