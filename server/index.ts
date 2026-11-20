// The game's server: POST /api/line (characters via Akamai Cloud Inference) and, in production,
// the built game from dist/. Run with `npm start` (node server/index.ts). Settings: server/README.md.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { existsSync, realpathSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleLine } from './line.ts';
import { configProblem, modelConfig, type ModelConfig } from './inference.ts';
import type { RefereeCheck } from '../shared/types.ts';
import { handleStore, hooks, storageHealth } from '../store/handler.ts';
import { dbHealth, handleDb, saveGame } from '../db/db.ts';
import { handleRooms, roomLineKey, sharedRoomLine } from '../rooms/rooms.ts';

// Every saved replay also becomes a row in Managed PostgreSQL (a no-op with no DB). The referee log comes from the
// player's browser, so only object entries go on; one bad entry would otherwise lose the whole row.
hooks.saveGame = g => saveGame({
  ...g, classCode: g.classCode ?? undefined, playerName: g.playerName ?? undefined,
  refereeLog: g.refereeLog.filter((c): c is RefereeCheck => typeof c === 'object' && c !== null && !Array.isArray(c)),
});

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MAX_BODY = 1024 * 1024; // a full GameState is a few KB
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

export interface AppOptions { cfg: ModelConfig | null; dist?: string; fetchImpl?: typeof fetch; linesPerMinute?: number }

// Who's asking: behind Caddy (same machine) the client is the last X-Forwarded-For hop; never trust the header otherwise.
function clientIp(req: IncomingMessage) {
  const peer = req.socket.remoteAddress ?? '';
  const fwd = String(req.headers['x-forwarded-for'] ?? '').split(',').pop()?.trim();
  return fwd && /^(127\.|::1$|::ffff:127\.)/.test(peer) ? fwd : peer;
}

// /api/line spends the team's shared per-minute token budget: cap each player. A game asks ~10-15 lines a minute.
// shortcut: in-memory fixed window, resets on restart; fine for one Linode, needs a shared store if we scale out.
function rateLimiter(perMinute: number) {
  const seen = new Map<string, { start: number; count: number }>();
  return (ip: string, now = Date.now()) => {
    if (seen.size > 10_000) seen.clear(); // bounded memory under a flood
    const w = seen.get(ip);
    if (!w || now - w.start >= 60_000) { seen.set(ip, { start: now, count: 1 }); return true; }
    return ++w.count <= perMinute;
  };
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('body too large'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('body is not JSON'), { status: 400 }); }
}

const isFile = (p: string) => stat(p).then(s => s.isFile(), () => false);

// Static files from dist/, with index.html for client routes like /?replay=… or /play.
async function serveStatic(dist: string, pathname: string, res: ServerResponse) {
  let rel: string;
  try { rel = decodeURIComponent(pathname); } catch { return send(res, 400, { error: 'bad path' }); }
  const file = resolve(dist, '.' + rel);
  if (file !== dist && !file.startsWith(dist + sep)) return send(res, 403, { error: 'forbidden' });
  let target = (await isFile(file)) ? file : (await isFile(join(file, 'index.html'))) ? join(file, 'index.html') : null;
  if (!target && !extname(rel) && (await isFile(join(dist, 'index.html')))) target = join(dist, 'index.html');
  if (!target) {
    const hint = existsSync(dist) ? 'not found' : 'no dist/ yet: run `npm run build` first, or use `npm run dev` for the game';
    return send(res, 404, { error: hint });
  }
  const data = await readFile(target); // before writeHead: a failed read must be a 500, never an empty (cached) 200
  const hashed = target.startsWith(join(dist, 'assets') + sep);
  res.writeHead(200, {
    'content-type': TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
  }).end(data);
}

export function createApp({ cfg, dist = join(ROOT, 'dist'), fetchImpl = fetch, linesPerMinute = 40 }: AppOptions): Server {
  const distDir = resolve(dist);
  const allowLine = rateLimiter(linesPerMinute);
  return createServer(async (req, res) => {
    try {
      let pathname: string;
      try { ({ pathname } = new URL(req.url ?? '/', 'http://localhost')); } catch { return send(res, 400, { error: 'bad request target' }); }
      if (pathname === '/api/line') {
        if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
        if (!allowLine(clientIp(req))) return send(res, 429, { error: 'too many lines this minute' }); // app uses a scripted line
        let body: unknown;
        try { body = await readJson(req); }
        catch (e) { return send(res, (e as { status?: number }).status ?? 400, { error: (e as Error).message }); }
        const key = roomLineKey(body); // in a play-together room, every player gets the same line for the same slot
        const r = await (key ? sharedRoomLine(key, () => handleLine(body, cfg, fetchImpl)) : handleLine(body, cfg, fetchImpl));
        return send(res, r.status, r.body);
      }
      if (pathname === '/api/health') {
        const [db, storage] = await Promise.all([dbHealth(), storageHealth()]);
        return send(res, 200, { ok: true, model: cfg?.model ?? null, db, storage });
      }
      if (await handleStore(req, res)) return; // /api/replays, /api/leaderboard (Object Storage)
      if (await handleDb(req, res)) return;    // /api/stats/global (Managed PostgreSQL)
      if (await handleRooms(req, res)) return; // /api/rooms (play-together rooms, in memory)
      if (pathname.startsWith('/api/')) return send(res, 404, { error: 'no such API route' });
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'GET only' });
      await serveStatic(distDir, pathname, res);
    } catch (e) {
      console.error('[server]', e);
      if (!res.headersSent) send(res, 500, { error: 'server error' });
      else res.end();
    }
  });
}

// Run directly (`node server/index.ts`, also through a symlinked deploy path) rather than imported by tests.
const realPath = (p: string) => { try { return realpathSync(p); } catch { return resolve(p); } };
const isMain = !!process.argv[1] && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url));

// Load .env if there is one (local dev only, it's gitignored), then listen.
if (isMain) {
  const envFile = join(ROOT, '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const cfg = modelConfig();
  const p = Number(process.env.PORT);
  const server = createApp({ cfg });
  server.listen(process.env.PORT && Number.isInteger(p) && p >= 0 ? p : 8787, () => {
    console.log(`Who's the Bot? server on http://localhost:${(server.address() as AddressInfo).port}`);
    console.log(cfg ? `Characters: Akamai Cloud Inference, model ${cfg.model}`
      : `Characters: no model (${configProblem()}), so /api/line answers 503 and the game uses scripted lines`);
  });
}
