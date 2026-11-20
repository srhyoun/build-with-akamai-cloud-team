// Where replays live: Akamai Object Storage (S3-compatible, signed by hand) or local files when no keys are set.
import { createHash, createHmac } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import type { StorageSource } from './replay.ts';

export interface Storage {
  kind: StorageSource;
  put(key: string, body: string, contentType: string): Promise<void>;
  get(key: string): Promise<string | null>;
  list(prefix: string, limit: number): Promise<string[]>; // keys in ascending order, at most limit
}

export function fileStorage(dir: string): Storage {
  const missing = (e: unknown) => { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; };
  return {
    kind: 'local',
    async put(key, body) {
      const file = join(dir, key);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, body);
    },
    get: key => readFile(join(dir, key), 'utf8').catch(missing),
    // shortcut: walks the whole folder on every call, fine for dev and tests; production uses the bucket.
    async list(prefix, limit) {
      const files = await readdir(dir, { recursive: true, withFileTypes: true }).catch(missing) ?? [];
      return files.filter(f => f.isFile()).map(f => relative(dir, join(f.parentPath, f.name)).split(sep).join('/'))
        .filter(k => k.startsWith(prefix)).sort().slice(0, limit);
    },
  };
}

export interface S3Config { endpoint: string; bucket: string; accessKey: string; secretKey: string; region: string }

export function s3ConfigFromEnv(env: NodeJS.ProcessEnv = process.env): S3Config | null {
  const v = (name: string) => env[`S3_${name}`] || env[`OBJ_${name}`];
  const endpoint = v('ENDPOINT')?.replace(/\/$/, ''), bucket = v('BUCKET'), accessKey = v('ACCESS_KEY'), secretKey = v('SECRET_KEY');
  if (!endpoint || !bucket || !accessKey || !secretKey) return null;
  return { endpoint: /^https?:\/\//.test(endpoint) ? endpoint : `https://${endpoint}`, bucket, accessKey, secretKey, region: env.S3_REGION || 'us-east-1' };
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const hmac = (key: string | Buffer, s: string) => createHmac('sha256', key).update(s).digest();
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()); // RFC 3986

// AWS Signature Version 4 for service "s3". `headers` are the headers to sign and must include host; returns the Authorization value.
export function signV4(o: { method: string; url: string | URL; headers: Record<string, string>; payloadHash: string; accessKey: string; secretKey: string; region: string; amzDate: string }): string {
  const url = new URL(o.url);
  const path = url.pathname.split('/').map(seg => enc(decodeURIComponent(seg))).join('/');
  const query = [...url.searchParams].map(([k, v]) => [enc(k), enc(v)]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${k}=${v}`).join('&');
  const headers = Object.entries(o.headers).map(([k, v]) => [k.toLowerCase(), v.trim().replace(/\s+/g, ' ')]).sort(([a], [b]) => a < b ? -1 : 1);
  const signed = headers.map(([k]) => k).join(';');
  const canonical = [o.method, path, query, ...headers.map(([k, v]) => `${k}:${v}`), '', signed, o.payloadHash].join('\n');
  const date = o.amzDate.slice(0, 8);
  const scope = `${date}/${o.region}/s3/aws4_request`;
  const key = hmac(hmac(hmac(hmac(`AWS4${o.secretKey}`, date), o.region), 's3'), 'aws4_request');
  const signature = createHmac('sha256', key).update(`AWS4-HMAC-SHA256\n${o.amzDate}\n${scope}\n${sha256(canonical)}`).digest('hex');
  return `AWS4-HMAC-SHA256 Credential=${o.accessKey}/${scope},SignedHeaders=${signed},Signature=${signature}`;
}

// Path-style URLs, no ACL (the bucket stays private), no x-amz-checksum-* and no chunked upload: Akamai Object Storage rejects both.
export function s3Storage(cfg: S3Config, fetchImpl: typeof fetch = fetch): Storage {
  const call = async (method: string, path: string, body = '', contentType?: string) => {
    const url = new URL(`${cfg.endpoint}/${cfg.bucket}${path}`);
    const headers: Record<string, string> = { 'x-amz-content-sha256': sha256(body), 'x-amz-date': new Date().toISOString().replace(/[-:]|\.\d{3}/g, '') };
    if (contentType) headers['content-type'] = contentType;
    headers.authorization = signV4({ method, url, headers: { ...headers, host: url.host }, payloadHash: headers['x-amz-content-sha256'], accessKey: cfg.accessKey, secretKey: cfg.secretKey, region: cfg.region, amzDate: headers['x-amz-date'] });
    const res = await fetchImpl(url, { method, headers, body: method === 'PUT' ? body : undefined, signal: AbortSignal.timeout(5000) });
    return { ok: res.ok, status: res.status, text: await res.text() };
  };
  const fail = (what: string, r: { status: number; text: string }) => new Error(`object storage ${what} failed: ${r.status} ${r.text.slice(0, 200)}`);
  return {
    kind: 'object-storage',
    async put(key, body, contentType) {
      const r = await call('PUT', `/${key}`, body, contentType);
      if (!r.ok) throw fail('put', r);
    },
    async get(key) {
      const r = await call('GET', `/${key}`);
      if (r.status === 404) return null;
      if (!r.ok) throw fail('get', r);
      return r.text;
    },
    async list(prefix, limit) {
      const r = await call('GET', `?list-type=2&max-keys=${limit}&prefix=${encodeURIComponent(prefix)}`);
      if (!r.ok) throw fail('list', r);
      return [...r.text.matchAll(/<Key>([^<]*)<\/Key>/g)].map(m => m[1]); // our keys are [a-z0-9/.-] only, so no XML entities
    },
  };
}
