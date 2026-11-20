// Runs the real SQL against PGlite (Postgres compiled to WASM), so no database server is needed.
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'node:http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../shared/types.ts';
import { init } from '../game/engine.ts';
import { QUIZ } from '../game/quiz.ts';
import { classStats, dbHealth, globalStats, handleDb, parseQuiz, quizResults, saveGame, saveQuiz, toRows, useDb } from './db.ts';

// k right answers (first k items), the rest wrong.
const answers = (k: number) => QUIZ.map((q, i) => ({ itemId: q.id, guess: i < k ? q.answer : q.answer === 'bot' ? 'human' as const : 'bot' as const, confidence: 3 }));

// A finished level-2 game: bot 0 ejected in round `catchRound` (or never), plus one bot post and one DM.
function finished(seed: number, catchRound: number | null, result: 'won' | 'lost', infection: number): GameState {
  const s = init(seed, 2);
  const [b0] = s.characters.filter(c => c.role === 'bot');
  const human = s.characters.find(c => c.role === 'human')!;
  s.phase = 'over'; s.round = 3; s.result = result; s.infection = infection;
  s.feed.push({ id: 'x1', author: b0.id, text: 'SHARE NOW', at: 1, round: 1, tactic: b0.tactics[0] },
              { id: 'x2', author: human.id, text: 'no?', at: 2, round: 1, to: human.id },
              { id: 'x3', author: 'you', text: 'hi', at: 3, round: 1 });
  s.ejections = catchRound ? [{ round: catchRound, id: b0.id, wasBot: true }] : [{ round: 1, id: human.id, wasBot: false }];
  return s;
}

async function fresh() {
  const pg = new PGlite();
  // PGlite's query() takes one statement; exec() runs the multi-statement schema.
  useDb({ query: (t, p) => p ? pg.query(t, p) : pg.exec(t).then(r => r.at(-1)!) });
  return pg;
}

describe('toRows', () => {
  it('keeps character posts (incl. DMs), drops the player and news, caps names', () => {
    const s = finished(3, 1, 'won', 30);
    const r = toRows({ id: 'g1', state: s, playerName: 'x'.repeat(40), classCode: 'MRSLEE3' });
    expect(r.posts.map(p => p.id)).toEqual(['x1', 'x2']);
    expect(r.posts[1].is_dm).toBe(true);
    expect(r.game[8]).toHaveLength(24);
    expect(r.characters.filter(c => c.role === 'human').every(c => c.tactics.length === 0)).toBe(true);
    expect(r.characters.find(c => c.ejected_round === 1)?.role).toBe('bot');
  });
});

describe('with a database', () => {
  beforeEach(fresh);

  it('saves a game once (same id twice = one game) and reads it back', async () => {
    const s = finished(3, 1, 'won', 30);
    expect(await saveGame({ id: 'g1', state: s, refereeLog: [{ round: 1, charId: 'a', kind: 'post', attempt: 1, stage: 'pass', pass: true, issues: [], latencyMs: 12.4, model: 'm' }] })).toBe(true);
    expect(await saveGame({ id: 'g1', state: s })).toBe(false);
    const stats = (await globalStats(1))!;
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.winRate).toBe(1);
    expect(stats.avgSpread).toBe(30);
  });

  it('tactic survival: a bot caught in round 1 never survived; one never caught survived every round', async () => {
    const s = finished(5, 1, 'lost', 70);
    await saveGame({ id: 'g2', state: s });
    const [caught, free] = s.characters.filter(c => c.role === 'bot');
    const stats = (await globalStats(1))!;
    for (const t of caught.tactics.filter(t => !free.tactics.includes(t)))
      expect(stats.tactics.find(x => x.id === t)).toMatchObject({ uses: 1, survivalRate: 0 });
    for (const t of free.tactics.filter(t => !caught.tactics.includes(t)))
      expect(stats.tactics.find(x => x.id === t)).toMatchObject({ uses: 3, survivalRate: 1 });
    expect(stats.tactics.map(t => t.survivalRate)).toEqual([...stats.tactics.map(t => t.survivalRate)].sort((a, b) => b - a));
  });

  it('false-accusation rate = share of ejections that removed a human', async () => {
    await saveGame({ id: 'a', state: finished(3, null, 'lost', 90) }); // ejected a human
    await saveGame({ id: 'b', state: finished(4, 2, 'won', 40) });    // ejected a bot
    expect((await globalStats(1))!.humanFalseAccusationRate).toBe(0.5);
  });

  it('caches stats for 5 s, and a save clears the cache', async () => {
    await saveGame({ id: 'a', state: finished(3, 1, 'won', 10) });
    expect((await globalStats(1000))!.gamesPlayed).toBe(1);
    await saveGame({ id: 'b', state: finished(4, 1, 'won', 10) });
    expect((await globalStats(1001))!.gamesPlayed).toBe(2);
  });

  it('health is up', async () => { expect(await dbHealth()).toBe('up'); });

  it('class stats: only that class (any case), avg score, players by score; unknown class is empty', async () => {
    await saveGame({ id: 'a', state: finished(3, 1, 'won', 10), classCode: '7b', playerName: 'Ada' });
    await saveGame({ id: 'b', state: finished(4, null, 'lost', 90), classCode: '7B' });
    await saveGame({ id: 'c', state: finished(5, 1, 'won', 20), classCode: 'other' });
    await saveGame({ id: 'd', state: finished(6, 1, 'won', 20) });
    const c = (await classStats(' 7b ', 1))!;
    expect(c).toMatchObject({ classCode: '7B', gamesPlayed: 2, winRate: 0.5, avgSpread: 50 });
    expect(c.players.map(p => p.name)).toEqual(['Ada', null]);
    expect(c.players[0].score).toBeGreaterThanOrEqual(c.players[1].score);
    expect(c.avgScore).toBe((c.players[0].score + c.players[1].score) / 2);
    expect((await globalStats(1))!.gamesPlayed).toBe(4);
    expect(await classStats('nobody', 1)).toMatchObject({ gamesPlayed: 0, players: [], tactics: [] });
  });
});

describe('without a database', () => {
  beforeEach(() => useDb(null));
  it('save is a no-op, stats are null, health is off', async () => {
    expect(await saveGame({ id: 'a', state: finished(3, 1, 'won', 10) })).toBe(false);
    expect(await globalStats()).toBeNull();
    expect(await dbHealth()).toBe('off');
  });
});

describe('handleDb', () => {
  it('answers /api/stats/global and ignores other paths', async () => {
    await fresh();
    await saveGame({ id: 'a', state: finished(3, 1, 'won', 10) });
    const srv = createServer(async (req, res) => { if (!(await handleDb(req, res))) { res.writeHead(404); res.end(); } });
    await new Promise<void>(r => srv.listen(0, r));
    const port = (srv.address() as { port: number }).port;
    try {
      const ok = await fetch(`http://localhost:${port}/api/stats/global`);
      expect(ok.status).toBe(200);
      expect((await ok.json()).gamesPlayed).toBeGreaterThanOrEqual(1);
      expect((await fetch(`http://localhost:${port}/api/line`)).status).toBe(404);
      expect((await (await fetch(`http://localhost:${port}/api/stats/class/MRS%20LEE`)).json()).gamesPlayed).toBe(0);
      for (const bad of ['', 'x'.repeat(25), '%E0', 'a/b'])
        expect((await fetch(`http://localhost:${port}/api/stats/class/${bad}`)).status, bad).toBe(400);
      useDb(null);
      expect((await fetch(`http://localhost:${port}/api/stats/global`)).status).toBe(503);
    } finally { srv.close(); }
  });
});

describe('quiz', () => {
  beforeEach(fresh);

  it('parseQuiz rejects bad ids, phases and answers, and drops extra fields', () => {
    const ok = { sessionId: 's-1', phase: 'pre', answers: answers(6) };
    expect(parseQuiz({ ...ok, answers: [...answers(5).slice(1), { ...answers(6)[0], extra: 'x' }] }).answers.every(a => !('extra' in a))).toBe(true);
    for (const bad of [{ ...ok, sessionId: 'x'.repeat(65) }, { ...ok, sessionId: '' }, { ...ok, sessionId: 'a b' }, { ...ok, phase: 'mid' },
                       { ...ok, answers: answers(6).slice(1) }, { ...ok, answers: 'no' }, null])
      expect(() => parseQuiz(bad)).toThrow(/^bad: /);
  });

  it('results: pre and post accuracy with n, paired change only for sessions that did both, first answer counts', async () => {
    expect(await quizResults()).toEqual({ pre: { n: 0, accuracy: null }, post: { n: 0, accuracy: null }, paired: { n: 0, pre: null, post: null, change: null } });
    expect(await saveQuiz('a', 'pre', answers(3))).toEqual({ correct: 3, total: 6 });
    await saveQuiz('a', 'post', answers(6));
    await saveQuiz('a', 'post', answers(0)); // retake: ignored
    await saveQuiz('b', 'pre', answers(6));
    await saveQuiz('c', 'post', answers(3));
    const r = (await quizResults())!;
    expect(r.pre).toEqual({ n: 2, accuracy: 0.75 });
    expect(r.post).toEqual({ n: 2, accuracy: 0.75 });
    expect(r.paired).toEqual({ n: 1, pre: 0.5, post: 1, change: 0.5 });
  });

  it('routes: POST /api/quiz scores server-side, 400 on bad body, results readable, 503 without a DB', async () => {
    const srv = createServer(async (req, res) => { if (!(await handleDb(req, res))) { res.writeHead(404); res.end(); } });
    await new Promise<void>(r => srv.listen(0, r));
    const url = `http://localhost:${(srv.address() as { port: number }).port}/api/quiz`;
    const post = (body: unknown) => fetch(url, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
    try {
      const ok = await post({ sessionId: 'z', phase: 'pre', answers: answers(4), correct: 6 });
      expect(ok.status).toBe(200);
      expect(await ok.json()).toEqual({ correct: 4, total: 6 });
      expect((await post({ sessionId: 'z', phase: 'pre', answers: [] })).status).toBe(400);
      expect((await post('{not json')).status).toBe(400);
      expect((await post('x'.repeat(9000))).status).toBe(400);
      expect((await fetch(url)).status).toBe(404); // GET /api/quiz is not a route
      expect((await (await fetch(`${url}/results`)).json()).pre).toEqual({ n: 1, accuracy: 4 / 6 });
      useDb(null);
      expect((await post({ sessionId: 'z', phase: 'post', answers: answers(4) })).status).toBe(503);
      expect((await fetch(`${url}/results`)).status).toBe(503);
    } finally { srv.close(); }
  });
});
