// db/: every finished game → Akamai Managed PostgreSQL, and the live Tactics Stats it powers (decision 002).
// Config: the workshop's PG* env vars (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE), or DATABASE_URL.
// With neither set the database is off: saveGame() is a no-op and /api/stats/global answers 503.
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pg from 'pg';
import type { GameState, GlobalStats, RefereeCheck, TacticId } from '../shared/types.ts';
import { TACTICS } from '../game/content.ts';
import { radar } from '../game/radar.ts';
import { scoreQuiz, type QuizAnswer } from '../game/quiz.ts';

export interface Queryable { query(text: string, params?: unknown[]): Promise<{ rows: any[] }> }

let db: Queryable | null | undefined; // undefined = not configured yet
let ready: Promise<void> | null = null;

// Tests (and anyone else) can hand in their own connection, e.g. PGlite.
export function useDb(q: Queryable | null) { db = q; ready = null; cache = null; }

function connect(): Queryable | null {
  const env = process.env;
  if (!env.DATABASE_URL && !env.PGHOST) return null;
  // Managed DBs use their own CA: verify with PG_CA_CERT_PATH if given, otherwise encrypt without verifying.
  // shortcut: rejectUnauthorized false trusts any cert on the way to the DB; set PG_CA_CERT_PATH once the CA is downloaded.
  const ssl = env.PGSSLMODE === 'disable' ? false
    : env.PG_CA_CERT_PATH ? { ca: readFileSync(env.PG_CA_CERT_PATH, 'utf8') } : { rejectUnauthorized: false };
  let connectionString = env.DATABASE_URL;
  if (connectionString) { const u = new URL(connectionString); u.searchParams.delete('sslmode'); connectionString = u.toString(); } // our ssl option wins
  const pool = new pg.Pool({ connectionString, ssl, max: 5, connectionTimeoutMillis: 5000 });
  pool.on('error', e => console.error('[db] idle client error:', e.message));
  return pool;
}

async function get(): Promise<Queryable | null> {
  if (db === undefined) db = connect();
  if (!db) return null;
  ready ??= db.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')).then(() => {}, e => { ready = null; throw e; });
  await ready;
  return db;
}

export interface SaveInput { id: string; state: GameState; refereeLog?: RefereeCheck[]; classCode?: string; playerName?: string; score?: number }

// Rows for one finished game. Pure, so it's tested without a database.
export function toRows({ id, state: s, refereeLog = [], classCode, playerName }: SaveInput) {
  const role = new Map(s.characters.map(c => [c.id, c.role]));
  return {
    game: [id, s.level, s.scenario.id, s.result ?? 'lost', s.infection, s.round, radar(s).score, classCode?.slice(0, 24) || null, playerName?.slice(0, 24) || null, JSON.stringify(s)],
    characters: s.characters.map(c => ({ id: c.id, handle: c.handle, role: c.role, tactics: c.role === 'bot' ? c.tactics : [], ejected_round: s.ejections.find(e => e.id === c.id)?.round ?? null })),
    posts: s.feed.filter(p => role.has(p.author)).map(p => ({ id: p.id, round: p.round, author: p.author, role: role.get(p.author), tactic: p.tactic ?? null, is_dm: !!p.to, text: p.text.slice(0, 500) })),
    checks: refereeLog.slice(0, 500).map(c => ({ round: c.round, char_id: c.charId, kind: c.kind, attempt: c.attempt, stage: c.stage, pass: c.pass, issues: c.issues, latency_ms: Math.round(c.latencyMs), model: c.model })),
  };
}

// One statement, so a game is saved whole or not at all. A second save of the same id is ignored.
const SAVE = `
WITH g AS (
  INSERT INTO games (id, level, scenario_id, result, final_spread, rounds_played, score, class_code, player_name, state)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id
), c AS (
  INSERT INTO characters (game_id, id, handle, role, tactics, ejected_round)
  SELECT g.id, x.id, x.handle, x.role, ARRAY(SELECT jsonb_array_elements_text(x.tactics)), x.ejected_round
  FROM g, jsonb_to_recordset($11::jsonb) AS x(id text, handle text, role text, tactics jsonb, ejected_round int)
), p AS (
  INSERT INTO posts (game_id, id, round, author, role, tactic, is_dm, text)
  SELECT g.id, x.* FROM g, jsonb_to_recordset($12::jsonb) AS x(id text, round int, author text, role text, tactic text, is_dm boolean, text text)
), r AS (
  INSERT INTO referee_checks (game_id, round, char_id, kind, attempt, stage, pass, issues, latency_ms, model)
  SELECT g.id, x.* FROM g, jsonb_to_recordset($13::jsonb) AS x(round int, char_id text, kind text, attempt int, stage text, pass boolean, issues jsonb, latency_ms int, model text)
)
SELECT count(*)::int AS saved FROM g`;

// For store/: hooks.saveGame = saveGame. Throws on DB errors; store/ still uploads the replay.
export async function saveGame(input: SaveInput): Promise<boolean> {
  const q = await get();
  if (!q) return false;
  const r = toRows(input);
  const { rows } = await q.query(SAVE, [...r.game, JSON.stringify(r.characters), JSON.stringify(r.posts), JSON.stringify(r.checks)]);
  cache = null;
  return rows[0].saved === 1;
}

// "Survival" = a bot was alive in a round with this tactic assigned and wasn't ejected at that round's end.
// Uses assigned tactics, not per-post tags, because model lines carry no tag yet.
const STATS = `
WITH bot_rounds AS (
  SELECT c.ejected_round, gs.r AS round, unnest(c.tactics) AS tactic
  FROM characters c JOIN games g ON g.id = c.game_id,
       generate_series(1, COALESCE(c.ejected_round, g.rounds_played)) AS gs(r)
  WHERE c.role = 'bot'
)
SELECT
  (SELECT count(*)::int FROM games) AS games,
  (SELECT COALESCE(avg((result = 'won')::int), 0)::float FROM games) AS win_rate,
  (SELECT COALESCE(avg(final_spread), 0)::float FROM games) AS avg_spread,
  (SELECT COALESCE(avg((role = 'human')::int), 0)::float FROM characters WHERE ejected_round IS NOT NULL) AS false_accusation,
  (SELECT COALESCE(json_agg(t ORDER BY t.survival DESC, t.uses DESC), '[]') FROM (
     SELECT tactic, count(*)::int AS uses, avg((ejected_round IS DISTINCT FROM round)::int)::float AS survival
     FROM bot_rounds GROUP BY tactic) t) AS tactics`;

let cache: { at: number; stats: GlobalStats } | null = null;

export async function globalStats(now = Date.now()): Promise<GlobalStats | null> {
  if (cache && now - cache.at < 5000) return cache.stats;
  const q = await get();
  if (!q) return null;
  const [r] = (await q.query(STATS)).rows;
  const tactics = (typeof r.tactics === 'string' ? JSON.parse(r.tactics) : r.tactics) as { tactic: string; uses: number; survival: number }[];
  const stats: GlobalStats = {
    gamesPlayed: r.games, winRate: r.win_rate, avgSpread: r.avg_spread, humanFalseAccusationRate: r.false_accusation,
    tactics: tactics.filter(t => t.tactic in TACTICS).map(t => ({ id: t.tactic as TacticId, name: TACTICS[t.tactic as TacticId].name, uses: t.uses, survivalRate: t.survival })),
    updatedAt: new Date(now).toISOString(),
  };
  cache = { at: now, stats };
  return stats;
}

export async function dbHealth(): Promise<'up' | 'down' | 'off'> {
  try { const q = await get(); if (!q) return 'off'; await q.query('SELECT 1'); return 'up'; } catch { return 'down'; }
}

// Pre/post quiz (SPEC §16). Validates and scores server-side; throws Error('bad: …') on a bad body.
export type QuizPhase = 'pre' | 'post';
export function parseQuiz(body: any): { sessionId: string; phase: QuizPhase; answers: QuizAnswer[] } {
  const { sessionId, phase, answers } = body ?? {};
  if (typeof sessionId !== 'string' || !/^[\w-]{1,64}$/.test(sessionId)) throw new Error('bad: sessionId must be 1-64 letters, digits, - or _');
  if (phase !== 'pre' && phase !== 'post') throw new Error('bad: phase must be pre or post');
  try { scoreQuiz(answers); } catch (e) { throw new Error(`bad: ${(e as Error).message}`); }
  return { sessionId, phase, answers: answers.map((a: QuizAnswer) => ({ itemId: a.itemId, guess: a.guess, confidence: a.confidence })) };
}

// The first response per session and phase counts; a retake returns its score but isn't stored.
export async function saveQuiz(sessionId: string, phase: QuizPhase, answers: QuizAnswer[]): Promise<{ correct: number; total: number } | null> {
  const score = scoreQuiz(answers);
  const q = await get();
  if (!q) return null;
  await q.query(`INSERT INTO quiz_responses (session_id, phase, correct, total, answers) VALUES ($1, $2, $3, $4, $5::jsonb)
    ON CONFLICT (session_id, phase) DO NOTHING`, [sessionId, phase, score.correct, score.total, JSON.stringify(answers)]);
  return score;
}

// Accuracy is a share of items right (0-1); null when n = 0. change = post - pre for sessions that did both.
export interface QuizResults { pre: { n: number; accuracy: number | null }; post: { n: number; accuracy: number | null }; paired: { n: number; pre: number | null; post: number | null; change: number | null } }
const QUIZ_RESULTS = `
WITH r AS (SELECT session_id, phase, correct::float / total AS acc FROM quiz_responses),
p AS (SELECT a.acc AS pre, b.acc AS post FROM r a JOIN r b ON a.session_id = b.session_id AND a.phase = 'pre' AND b.phase = 'post')
SELECT
  (SELECT count(*)::int FROM r WHERE phase = 'pre') AS pre_n, (SELECT avg(acc) FROM r WHERE phase = 'pre') AS pre_acc,
  (SELECT count(*)::int FROM r WHERE phase = 'post') AS post_n, (SELECT avg(acc) FROM r WHERE phase = 'post') AS post_acc,
  (SELECT count(*)::int FROM p) AS paired_n, (SELECT avg(pre) FROM p) AS paired_pre, (SELECT avg(post) FROM p) AS paired_post,
  (SELECT avg(post - pre) FROM p) AS paired_change`;

export async function quizResults(): Promise<QuizResults | null> {
  const q = await get();
  if (!q) return null;
  const [r] = (await q.query(QUIZ_RESULTS)).rows;
  const num = (x: unknown) => x == null ? null : Number(x);
  return {
    pre: { n: r.pre_n, accuracy: num(r.pre_acc) }, post: { n: r.post_n, accuracy: num(r.post_acc) },
    paired: { n: r.paired_n, pre: num(r.paired_pre), post: num(r.paired_post), change: num(r.paired_change) },
  };
}

async function readJson(req: IncomingMessage, limit = 8192): Promise<unknown> {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > limit) throw new Error('bad: body too large'); }
  try { return JSON.parse(raw); } catch { throw new Error('bad: body is not JSON'); }
}

// Mounted by server/index.ts: `if (await handleDb(req, res)) return;`
// Handles GET /api/stats/global, POST /api/quiz, GET /api/quiz/results.
export async function handleDb(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const path = new URL(req.url ?? '/', 'http://x').pathname;
  const route = `${req.method} ${path}`;
  if (route !== 'GET /api/stats/global' && route !== 'POST /api/quiz' && route !== 'GET /api/quiz/results') return false;
  const send = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  const off = { error: 'no database configured (set PGHOST… or DATABASE_URL)' };
  try {
    if (route === 'POST /api/quiz') {
      const { sessionId, phase, answers } = parseQuiz(await readJson(req));
      const score = await saveQuiz(sessionId, phase, answers);
      send(score ? 200 : 503, score ?? off);
    } else {
      const body = route === 'GET /api/quiz/results' ? await quizResults() : await globalStats();
      send(body ? 200 : 503, body ?? off);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('bad: ')) return send(400, { error: msg.slice(5) }), true;
    console.error(`[db] ${route}:`, msg);
    send(502, { error: 'database unavailable' });
  }
  return true;
}
