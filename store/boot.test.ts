// Starts the real server the way `npm start` does. tsc and vitest pass on an import that Node's type
// stripping rejects (a type imported without `import type`), so only a real start catches a broken deploy.
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
let child: ChildProcess, base: string, dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wtb-boot-'));
  child = spawn(process.execPath, ['server/index.ts'], { cwd: root, env: { ...process.env, PORT: '0', STORE_DIR: dir } });
  let out = '';
  base = await new Promise<string>((ok, fail) => {
    const seen = (b: Buffer) => { out += b; const m = /server on (http:\/\/localhost:\d+)/.exec(out); if (m) ok(m[1]); };
    child.stdout!.on('data', seen);
    child.stderr!.on('data', (b: Buffer) => { out += b; });
    child.on('exit', code => fail(new Error(`node server/index.ts exited with ${code} before listening:\n${out}`)));
  });
}, 15_000);

afterAll(async () => { child?.kill(); await rm(dir, { recursive: true, force: true }); });

describe('node server/index.ts', () => {
  it('starts and reports its services', async () => {
    const r = await fetch(`${base}/api/health`);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, storage: 'up' });
  });

  it('has the replay routes mounted', async () => {
    const board = await fetch(`${base}/api/leaderboard`);
    expect(board.status).toBe(200);
    expect(await board.json()).toHaveProperty('entries');
    const bad = await fetch(`${base}/api/replays`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect(bad.status).toBe(400); // reached store/'s validation, not the "no such API route" 404
  });
});
