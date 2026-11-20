// The game master's clock: ticks the engine and decides when characters speak.
// Lines come from the model server; if it's missing or slow, from scripted lines.
import type { Command, GameState, RefereeCheck } from '../shared/types.ts';
import { alive, rng } from '../game/engine.ts';
import { scriptedLine, type LineKind } from '../game/voice.ts';
import { checkLine, toCheck } from '../game/referee.ts';
import { logCheck, resetRefereeLog } from './refereeLog.ts';
import { createChatterOrder } from './chatter.ts';
import { getRoomSession } from './room.ts';

const TICK_MS = 250;
let off = ''; // why the model was switched off after a failure (so an offline game stays snappy); '' = still trying

// Every line goes through the referee and into the Under the Hood log. Nothing unchecked reaches the player.
async function line(s: GameState, charId: string, kind: LineKind, to?: string, share?: { room: string; slot: string }) {
  const c = s.characters.find(x => x.id === charId)!;
  let why = off;
  if (!off) {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/line', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state: s, charId, kind, to, ...share }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        const { check, ...say } = body;
        // The server checks lines (I2). Until it sends `check`, the browser runs the same checkLine().
        const verdict: RefereeCheck = check ?? toCheck(s, charId, kind, checkLine(s, c, say, kind), 1, Math.round(performance.now() - t0), 'model (checked in browser)');
        logCheck(verdict);
        if (verdict.pass) return say;
        why = 'blocked by the referee';
      } else {
        if (res.status === 422 && body.check) logCheck(body.check);
        why = res.status === 422 ? 'blocked twice by the referee' : `model error ${res.status}`;
        if (res.status === 503) off = why = 'no model configured';
        if (res.status === 404) off = why = 'no game server (404)';
      }
    } catch { off = why = 'model unreachable'; }
  }
  const say = scriptedLine(s, c, kind, to); // scripted lines always pass checkLine (game/referee.test.ts)
  logCheck(toCheck(s, charId, kind, [...checkLine(s, c, say, kind), { rule: 'FALLBACK', severity: 'warn', detail: why }], 1, 0, 'scripted', 'fallback'));
  return say;
}

export function startDirector(get: () => GameState, dispatch: (c: Command) => void) {
  resetRefereeLog();
  let last: GameState | undefined;
  let nextChatter = 3000;
  // In a play-together room the speaking order comes from the room's seed and each public line has a slot,
  // so every player in the room sees the same villagers say the same things.
  const room = getRoomSession();
  const nextSpeaker = createChatterOrder(room ? rng(room.seed) : undefined);
  let slotRound = 0, slotN = 0;
  const speak = (id: string, kind: LineKind, to?: string, delay = 0, slot?: string) =>
    setTimeout(async () => dispatch(await line(get(), id, kind, to, room && slot ? { room: room.code, slot } : undefined)), delay);

  let prev = performance.now();
  const timer = setInterval(() => {
    const now = performance.now(), dt = now - prev; prev = now; // real elapsed time: browsers slow timers in background tabs
    dispatch({ type: 'tick', dt });
    const s = get();
    if (s.phase === 'discussion' || s.phase === 'event') {
      nextChatter -= dt;
      if (nextChatter <= 0) {
        const who = nextSpeaker(alive(s).map(c => c.id));
        if (who) {
          if (s.round !== slotRound) { slotRound = s.round; slotN = 0; }
          speak(who, 'post', undefined, 0, `${s.round}:post:${slotN++}:${who}`);
        }
        nextChatter = 4000 + Math.random() * 5000;
      }
    }
    if (s.phase === 'meeting' && last?.phase !== 'meeting') alive(s).forEach((c, i) => speak(c.id, 'defense', undefined, 600 + i * 1200, `${s.round}:defense:${c.id}`));
    for (const p of s.feed.slice(last?.feed.length ?? s.feed.length)) {
      if (p.author !== 'you') continue;
      // The player DMed someone: they answer in the same DM thread.
      if (p.to) { speak(p.to, 'reply', p.to, 1500 + Math.random() * 2000); continue; }
      // The player posted in the town chat: anyone they @-mention answers (up to 2); with no mention, one villager does.
      const here = alive(s);
      const named = here.filter(c => p.text.toLowerCase().includes(c.handle.toLowerCase())).slice(0, 2);
      const answer = named.length ? named : here.length ? [here[Math.floor(Math.random() * here.length)]] : [];
      answer.forEach((c, i) => speak(c.id, 'reply', undefined, 1500 + i * 1800 + Math.random() * 1500));
    }
    last = s;
  }, TICK_MS);
  return () => clearInterval(timer);
}
