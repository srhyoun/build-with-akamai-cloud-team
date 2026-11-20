// `node store/selftest.ts`: checks the real Object Storage bucket named in .env (or the environment) in one command.
// Writes one small object (selftest/check.json, overwritten each run), reads it back and lists it. Prints no keys.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { s3ConfigFromEnv, s3Storage } from './storage.ts';

const HINTS: Record<string, string> = {
  SignatureDoesNotMatch: 'The secret key is wrong (copy it again), or the service wants another signing region: set S3_REGION to the region id of the bucket from Cloud Manager (Chicago is us-ord).',
  InvalidAccessKeyId: 'The access key is wrong, or it is seconds old: run this once more, then copy the key again.',
  AccessDenied: 'The key has no Read/Write access to this bucket, or S3_BUCKET has a typo.',
  NoSuchBucket: 'S3_BUCKET does not match a bucket at S3_ENDPOINT. The bucket must be in Chicago: https://us-ord-10.linodeobjects.com',
};

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
const cfg = s3ConfigFromEnv();
if (!cfg) {
  console.error('FAIL  no Object Storage settings. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY (or the OBJ_* names) in .env');
  process.exit(1);
}

console.log(`bucket ${cfg.bucket} at ${cfg.endpoint}, signing region ${cfg.region}`);
const s3 = s3Storage(cfg), key = 'selftest/check.json', body = JSON.stringify({ at: new Date().toISOString() });
try {
  await s3.put(key, body, 'application/json');
  console.log('ok    put');
  if (await s3.get(key) !== body) throw new Error('read back something other than what was written');
  console.log('ok    get');
  if (!(await s3.list('selftest/', 10)).includes(key)) throw new Error('the object is missing from the listing');
  console.log('ok    list');
  console.log('PASS  Object Storage works. Replays and the leaderboard will be stored there.');
} catch (e) {
  const msg = (e as Error).message;
  console.error(`FAIL  ${msg}`);
  const hint = Object.keys(HINTS).find(code => msg.includes(code));
  console.error(hint ? `fix:  ${HINTS[hint]}` : 'fix:  check that this machine can reach S3_ENDPOINT (a timeout means it cannot).');
  process.exit(1);
}
