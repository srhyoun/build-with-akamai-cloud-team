// Reveal (SPEC §15, F1): the star of the game. Who was who, the Bot Radar, and every tactic the bots used.
// `children` is the slot for ethanL30's save / QR panel (F2).
import type { ReactNode } from 'react';
import type { GameState, TacticId } from '../shared/types.ts';
import { TACTICS } from '../game/content.ts';
import { radar } from '../game/radar.ts';
import { Crew, TOOL_NAMES } from './App.tsx';
import { TownMap } from './TownMap.tsx';
import './reveal.css';

export function Reveal({ s, onAgain, children }: { s: GameState; onAgain: () => void; children?: ReactNode }) {
  const r = radar(s);
  const bots = s.characters.filter(c => c.role === 'bot');
  const handle = (id: string) => s.characters.find(c => c.id === id)?.handle ?? id;
  const outIn = (id: string) => s.ejections.find(e => e.id === id)?.round;
  const botPosts = s.feed.filter(p => p.tactic && bots.some(b => b.id === p.author));

  return (
    <main className="rv">
      <h1>{s.result === 'won' ? '✅ You found every bot!' : '❌ The false story reached the town.'}</h1>
      <p className="rv-headline">{r.headline}</p>

      <section className="rv-card" aria-labelledby="rv-radar">
        <h2 id="rv-radar">Bot Radar</h2>
        <p className="rv-score"><b>{r.score}</b> points</p>
        <dl className="rv-stats">
          <div><dt>Bots caught</dt><dd>{r.botsCaught}/{bots.length}</dd></div>
          <div><dt>Humans voted out</dt><dd>{r.humansEjected}</dd></div>
          <div><dt>Town infected</dt><dd>{r.finalSpread}%</dd></div>
          <div><dt>First catch</dt><dd>{r.roundsToFirstCatch ? `Round ${r.roundsToFirstCatch}` : '—'}</dd></div>
        </dl>
        <TownMap infection={r.finalSpread} />
        {r.blindSpot && <p className="rv-tip">Next time, try <b>{TOOL_NAMES[TACTICS[r.blindSpot].counter]}</b>: it exposes {TACTICS[r.blindSpot].name.toLowerCase()}.</p>}
      </section>

      <section aria-labelledby="rv-cast">
        <h2 id="rv-cast">Who was who</h2>
        <ul className="rv-cast">
          {s.characters.map(c => (
            <li key={c.id} className={c.role}>
              <Crew color={c.color} />
              <div>
                <b>{c.handle}</b> <span className="rv-role">{c.role === 'bot' ? 'Bot' : 'Human'}</span>
                {outIn(c.id) && <small> · voted out in round {outIn(c.id)}</small>}
                <small className="rv-bio">{c.bio}</small>
                {c.role === 'bot' && <div className="rv-chips">{c.tactics.map(t => <Chip key={t} t={t} />)}</div>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="rv-timeline">
        <h2 id="rv-timeline">What the bots did</h2>
        {botPosts.length === 0 ? <p className="rv-muted">No tagged bot posts this game.</p> : (
          <ol className="rv-timeline">
            {botPosts.map(p => (
              <li key={p.id}>
                <span className="rv-round">R{p.round}</span>
                <div><b>{handle(p.author)}</b>{p.to && <small> (DM to you)</small>} {p.text}<Chip t={p.tactic!} /></div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {children}
      <a className="rv-link rv-quiz" href="/quiz.html?phase=post">Take the after-quiz: did you get better at spotting bots? →</a>
      <button className="rv-again" onClick={onAgain}>Play again</button>
    </main>
  );
}

// Tap to open (works on phones, unlike a hover tooltip): the tactic's example and the tool that counters it.
function Chip({ t }: { t: TacticId }) {
  const x = TACTICS[t];
  return (
    <details className="rv-chip">
      <summary>{x.name}</summary>
      <p>e.g. “{x.example}” · Counter: {TOOL_NAMES[x.counter]}</p>
      <a className="rv-link" href={`/codex.html#${t}`}>How to spot it →</a>
    </details>
  );
}
