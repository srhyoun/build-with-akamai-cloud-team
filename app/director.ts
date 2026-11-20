// The game master's clock: ticks the engine and decides when characters speak.
// Lines come from the model server; if it's missing or slow, from scripted lines.
import type { Command, GameState, RefereeCheck } from '../shared/types.ts';
import { alive } from '../game/engine.ts';
import { scriptedLine, type LineKind } from '../game/voice.ts';
import { checkLine, toCheck } from '../game/referee.ts';
import { logCheck, resetRefereeLog } from './refereeLog.ts';

const TICK_MS = 250;
let model = true; // flips off after the first failure, so an offline game stays snappy

// Every line goes through the referee and into the Under the Hood log. Nothing unchecked reaches the player.
async function line(s: GameState, charId: string, kind: LineKind, to?: string) {
  const c = s.characters.find(x => x.id === charId)!;
  let why = 'no model configured';
  if (model) {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/line', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state: s, charId, kind, to }) });
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
        if (res.status === 503 || res.status === 404) model = false;
      }
    } catch { model = false; why = 'model unreachable'; }
  }
  const say = scriptedLine(s, c, kind, to); // scripted lines always pass checkLine (game/referee.test.ts)
  logCheck(toCheck(s, charId, kind, [...checkLine(s, c, say, kind), { rule: 'FALLBACK', severity: 'warn', detail: why }], 1, 0, 'scripted', 'fallback'));
  return say;
}

export function startDirector(get: () => GameState, dispatch: (c: Command) => void) {
  resetRefereeLog();
  let last: GameState | undefined;
  let nextChatter = 3000;
  const speak = (id: string, kind: LineKind, to?: string, delay = 0) =>
    setTimeout(async () => dispatch(await line(get(), id, kind, to)), delay);

  let prev = performance.now();
  const timer = setInterval(() => {
    const now = performance.now(), dt = now - prev; prev = now; // real elapsed time: browsers slow timers in background tabs
    dispatch({ type: 'tick', dt });
    const s = get();
    if (s.phase === 'discussion' || s.phase === 'event') {
      nextChatter -= dt;
      if (nextChatter <= 0) {
        const cast = alive(s);
        const bots = cast.filter(c => c.role === 'bot');
        const who = Math.random() < 0.4 && bots.length ? bots[Math.floor(Math.random() * bots.length)] : cast[Math.floor(Math.random() * cast.length)];
        speak(who.id, 'post');
        nextChatter = 4000 + Math.random() * 5000;
      }
    }
    if (s.phase === 'meeting' && last?.phase !== 'meeting') alive(s).forEach((c, i) => speak(c.id, 'defense', undefined, 600 + i * 1200));
    // The player DMed someone: they answer in the same DM thread.
    for (const p of s.feed.slice(last?.feed.length ?? s.feed.length)) if (p.author === 'you' && p.to) speak(p.to, 'reply', p.to, 1500 + Math.random() * 2000);
    last = s;
  }, TICK_MS);
  return () => clearInterval(timer);
}
