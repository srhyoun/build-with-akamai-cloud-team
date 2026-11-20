import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { useDb } from '../db/db.ts';
import { createApp } from '../server/index.ts';

if (!existsSync(new URL('../dist/index.html', import.meta.url))) {
  console.error('Build the game first with npm run build, then rerun this command.');
  process.exit(1);
}

// The server reads replay settings on its first request. Keep this process on local storage
// even when the shell has settings for a deployed game.
for (const name of Object.keys(process.env)) {
  if (/^(?:S3_|OBJ_|PUBLIC_APP_URL$)/i.test(name)) delete process.env[name];
}
const storeDir = mkdtempSync(join(tmpdir(), 'wtb-offline-demo-'));
process.env.STORE_DIR = storeDir;
process.once('exit', () => {
  try {
    rmSync(storeDir, { recursive: true, force: true });
  } catch {
    console.error(`Could not remove the temporary replay directory at ${storeDir}.`);
  }
});

// Importing createApp bypasses the server CLI's .env loading.
useDb(null);
const server = createApp({ cfg: null });
const stop = () => server.close();
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address() as AddressInfo;
  console.log(`Offline demo: http://127.0.0.1:${port}`);
  console.log('Dialogue is scripted. Replays stay on this machine until you stop the demo with Ctrl+C.');
});
