// Runs the real SQL against PGlite (Postgres compiled to WASM), so no database server is needed.
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'node:http';
import { beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../shared/types.ts';
import { init } from '../game/engine.ts';
import { dbHealth, globalStats, handleDb, saveGame, toRows, useDb } from './db.ts';

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
      useDb(null);
      expect((await fetch(`http://localhost:${port}/api/stats/global`)).status).toBe(503);
    } finally { srv.close(); }
  });
});
