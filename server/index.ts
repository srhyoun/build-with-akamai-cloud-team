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

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MAX_BODY = 1024 * 1024; // a full GameState is a few KB
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

export interface AppOptions { cfg: ModelConfig | null; dist?: string; fetchImpl?: typeof fetch }

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

export function createApp({ cfg, dist = join(ROOT, 'dist'), fetchImpl = fetch }: AppOptions): Server {
  const distDir = resolve(dist);
  return createServer(async (req, res) => {
    try {
      let pathname: string;
      try { ({ pathname } = new URL(req.url ?? '/', 'http://localhost')); } catch { return send(res, 400, { error: 'bad request target' }); }
      if (pathname === '/api/line') {
        if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
        let body: unknown;
        try { body = await readJson(req); }
        catch (e) { return send(res, (e as { status?: number }).status ?? 400, { error: (e as Error).message }); }
        const r = await handleLine(body, cfg, fetchImpl);
        return send(res, r.status, r.body);
      }
      if (pathname === '/api/health') return send(res, 200, { ok: true, model: cfg?.model ?? null });
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
