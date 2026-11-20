// The three HTTP routes: save a finished game, read a replay, read the leaderboard.
import { randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { GameState } from '../shared/types.ts';
import { toReplay } from './replay.ts';
import type { LeaderboardEntry, LeaderboardResponse, Replay } from './replay.ts';
import { fileStorage, s3ConfigFromEnv, s3Storage } from './storage.ts';
import type { Storage } from './storage.ts';

export interface SavedGame { id: string; state: GameState; refereeLog: unknown[]; classCode: string | null; playerName: string | null; score: number }
export interface StoreOptions { storage: Storage; publicAppUrl?: string; now?: () => Date; saveGame?: (g: SavedGame) => Promise<unknown>; maxSavesPerMinute?: number }

export const hooks: { saveGame?: (g: SavedGame) => Promise<unknown> } = {}; // the db/ lane sets hooks.saveGame

const MAX_BODY = 1_000_000;

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

const origin = (req: IncomingMessage) => {
  const proto = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim();
  const host = req.headers.host ?? '';
  return `${proto === 'https' ? 'https' : 'http'}://${/^[a-zA-Z0-9.:[\]-]+$/.test(host) ? host : 'localhost'}`;
};

export function createStore(opts: StoreOptions) {
  const { storage } = opts;
  const now = opts.now ?? (() => new Date());
  let saves: number[] = [];
  let cache: { at: number; body: LeaderboardResponse } | null = null;
  let scores = 0; // score writes so far: a leaderboard read that raced one is answered but not cached

  async function save(req: IncomingMessage, res: ServerResponse) {
    // shortcut: one limit for the whole process, counting every POST; make it per IP when one class can lock out another.
    const t = now().getTime();
    saves = saves.filter(x => x > t - 60_000);
    if (saves.length >= (opts.maxSavesPerMinute ?? 60)) return send(res, 429, { error: 'too many saves, try again in a minute' });
    saves.push(t);

    const raw = await readBody(req);
    if (raw === null) return send(res, 413, { error: 'body over 1 MB' });
    let body: { state: GameState; refereeLog?: unknown; classCode?: unknown };
    try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'body is not JSON' }); }
    const id = randomBytes(6).toString('hex');
    let replay: Replay;
    try { replay = toReplay(body, id, new Date(t).toISOString()); } catch (e) {
      if ((e as { status?: number }).status !== 400) throw e;
      return send(res, 400, { error: (e as Error).message });
    }

    // The key sorts best score first, then earliest game, and is unique per save: listing it IS the leaderboard, no read-modify-write.
    const rank = `${String(Math.round(10000 - replay.score)).padStart(5, '0')}-${String(t).padStart(14, '0')}`;
    const entry: LeaderboardEntry = { id, name: replay.playerName ?? 'Anonymous', score: replay.score, result: replay.result, level: replay.level, infection: replay.infection, at: replay.at };
    const base = opts.publicAppUrl?.replace(/\/$/, '') || origin(req);
    // Storage being down must not break the game: the save still answers 200, without a share link.
    const shareUrl = await storage.put(`replays/${id}.json`, JSON.stringify(replay), 'application/json')
      .then(() => `${base}/?replay=${id}`, e => { console.error('store: replay not saved:', e); return null; });
    if (shareUrl) await storage.put(`scores/${rank}-${id}.json`, JSON.stringify(entry), 'application/json')
      .then(() => { cache = null; scores++; }, e => console.error('store: leaderboard entry not saved:', e));

    const saveGame = opts.saveGame ?? hooks.saveGame;
    const classCode = typeof body.classCode === 'string' && body.classCode.trim() && body.classCode.trim().length <= 24 ? body.classCode.trim() : null;
    const refereeLog = Array.isArray(body.refereeLog) ? body.refereeLog.slice(0, 2000) : [];
    send(res, 200, { id, shareUrl, score: replay.score }); // answer first: a hanging database must not hold the share link
    try { await saveGame?.({ id, state: body.state, refereeLog, classCode, playerName: replay.playerName, score: replay.score }); }
    catch (e) { console.error('store: saveGame failed:', e); } // a failing database must not fail the save
  }

  async function load(id: string, res: ServerResponse) {
    if (!/^[a-f0-9]{12}$/.test(id)) return send(res, 404, { error: 'replay not found' }); // also the path-traversal guard
    let raw: string | null;
    try { raw = await storage.get(`replays/${id}.json`); } catch (e) {
      console.error('store: replay not read:', e);
      return send(res, 502, { error: 'storage unavailable' });
    }
    if (raw === null) return send(res, 404, { error: 'replay not found' });
    send(res, 200, { replay: JSON.parse(raw), source: storage.kind });
  }

  async function leaderboard(): Promise<LeaderboardResponse> {
    const t = now().getTime();
    if (cache && t - cache.at < 10_000) return cache.body;
    const parse = (raw: string | null): LeaderboardEntry | null => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
    try {
      const before = scores;
      const keys = await storage.list('scores/', 10);
      const entries = (await Promise.all(keys.map(k => storage.get(k).then(parse, () => null)))).filter(e => e !== null);
      const body: LeaderboardResponse = { entries, source: storage.kind };
      if (before === scores) cache = { at: t, body };
      return body;
    } catch (e) {
      console.error('store: leaderboard not read:', e);
      return { entries: [], source: storage.kind }; // the page must still render
    }
  }

  return {
    async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
      const path = (req.url ?? '').split('?')[0];
      const id = path.startsWith('/api/replays/') ? path.slice('/api/replays/'.length) : null;
      if (id === null && path !== '/api/replays' && path !== '/api/leaderboard') return false;
      try {
        if (req.method !== (path === '/api/replays' ? 'POST' : 'GET')) send(res, 405, { error: 'method not allowed' });
        else if (path === '/api/replays') await save(req, res);
        else if (id === null) send(res, 200, await leaderboard());
        else await load(id, res);
      } catch (e) {
        console.error('store:', e);
        if (!res.headersSent) send(res, 500, { error: 'server error' });
      }
      return true;
    },
    health: (): Promise<'up' | 'down'> => storage.list('replays/', 1).then(() => 'up' as const, () => 'down' as const),
  };
}

let store: ReturnType<typeof createStore> | undefined;
function defaultStore() {
  if (!store) {
    const cfg = s3ConfigFromEnv();
    const dir = process.env.STORE_DIR || fileURLToPath(new URL('.data', import.meta.url));
    console.log(cfg ? `store: Object Storage, bucket ${cfg.bucket} at ${cfg.endpoint}` : `store: local files in ${dir} (no S3_* keys set)`);
    store = createStore({ storage: cfg ? s3Storage(cfg) : fileStorage(dir), publicAppUrl: process.env.PUBLIC_APP_URL });
  }
  return store;
}
export function handleStore(req: IncomingMessage, res: ServerResponse): Promise<boolean> { return defaultStore().handle(req, res); }
export function storageHealth(): Promise<'up' | 'down'> { return defaultStore().health(); }
