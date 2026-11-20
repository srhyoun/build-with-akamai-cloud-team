import { useEffect, useRef, useState } from 'react';
import { BOTS, PERSONAS, TOKENS_PER_ROUND } from '../game/content.ts';
import type { GameState } from '../shared/types.ts';
import { initialClassCode, setClassCode } from './classCode.ts';
import { TownScene } from './town/TownScene.tsx';
import './start-screen.css';

const DEMO_CAST = PERSONAS.slice(0, 6).map(p => ({ id: p.handle.slice(1).toLowerCase(), handle: p.handle, color: p.color }));
const GLIDE_MS = 1200;

export function StartScreen({ onStart }: { onStart: (level: GameState['level']) => void }) {
  const [classCode, setCode] = useState(initialClassCode);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = (level: GameState['level']) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return onStart(level);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLeaving(true);
    timer.current = window.setTimeout(() => onStart(level), GLIDE_MS);
  };

  return (
    <main className={`start-screen${leaving ? ' leaving' : ''}`} aria-labelledby="start-title">
      <div className="start-hero">
        <TownScene view={leaving ? 'ground' : 'aerial'} cast={DEMO_CAST} infection={0} />
      </div>

      <header>
        <h1 id="start-title">Who's the Bot?</h1>
        <p>Find the bots in the town group chat before their false story spreads.</p>
      </header>

      <section className="start-class" aria-labelledby="class-title">
        <label id="class-title" htmlFor="class-code">Class code <small>(optional, from your teacher)</small></label>
        <input id="class-code" value={classCode} maxLength={24} autoComplete="off" autoCapitalize="characters" placeholder="e.g. 7B"
               onChange={e => { setCode(e.target.value.toUpperCase()); setClassCode(e.target.value); }} />
        {classCode.trim() && <a href={`/stats.html?class=${encodeURIComponent(classCode.trim())}`}>Class results for {classCode.trim()} →</a>}
      </section>

      <section aria-labelledby="level-title">
        <h2 id="level-title">Choose a level</h2>
        <div className="start-levels">
          {([1, 2] as const).map(level => (
            <button key={level} type="button" disabled={leaving} onClick={() => start(level)}>
              <strong>Level {level}</strong>
              <span>{BOTS[level]} {BOTS[level] === 1 ? 'bot' : 'bots'}</span>
            </button>
          ))}
          <button type="button" className="start-boss" disabled={leaving} onClick={() => start(3)}>
            <strong>Boss level</strong>
            <span>{BOTS[3]} bots, and one poses as the town reporter</span>
          </button>
        </div>
      </section>

      <section className="start-rules" aria-labelledby="rules-title">
        <h2 id="rules-title">How to play</h2>
        <ol>
          <li>Read the breaking news and DM characters to compare their stories.</li>
          <li>Spend {TOKENS_PER_ROUND} Fact-Check Tokens each round on Account Age, Source Check, or Posting Pattern.</li>
          <li>Call an emergency meeting and vote to eject a suspect.</li>
        </ol>
      </section>

      <nav className="start-links" aria-label="Learn more">
        <a href="/codex.html">Tactic Codex: the bots’ 6 tricks</a>
        <a href="/quiz.html?phase=pre">Quiz: bot or human? (1 min)</a>
      </nav>
    </main>
  );
}
