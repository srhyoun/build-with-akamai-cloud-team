// The game master's clock: ticks the engine and decides when characters speak.
// Lines come from the model server; if it's missing or slow, from scripted lines.
import type { Command, GameState } from '../shared/types.ts';
import { alive } from '../game/engine.ts';
import { scriptedLine, type LineKind } from '../game/voice.ts';

const TICK_MS = 250;
let model = true; // flips off after the first failure, so an offline game stays snappy

async function line(s: GameState, charId: string, kind: LineKind, to?: string) {
  const c = s.characters.find(x => x.id === charId)!;
  if (model) {
    try {
      const res = await fetch('/api/line', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state: s, charId, kind, to }) });
      if (res.ok) return await res.json();
      if (res.status === 503 || res.status === 404) model = false;
    } catch { model = false; }
  }
  return scriptedLine(s, c, kind, to);
}

export function startDirector(get: () => GameState, dispatch: (c: Command) => void) {
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
