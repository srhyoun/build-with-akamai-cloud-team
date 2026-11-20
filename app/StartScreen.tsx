import { useEffect, useRef, useState } from 'react';
import { BOTS, PERSONAS } from '../game/content.ts';
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
        <p>Spot the bots. Save the town.</p>
      </header>

      <ul className="start-rules" aria-label="How to play">
        <li><span aria-hidden="true">👀</span>Read</li>
        <li><span aria-hidden="true">🔍</span>Check</li>
        <li><span aria-hidden="true">📣</span>Vote</li>
      </ul>

      <section aria-labelledby="level-title">
        <h2 id="level-title">Play</h2>
        <div className="start-levels">
          {([1, 2, 3] as const).map(level => {
            const label = level === 3 ? 'Boss level' : `${BOTS[level]} ${BOTS[level] === 1 ? 'bot' : 'bots'}`;
            return (
              <button key={level} type="button" className={level === 3 ? 'start-boss' : undefined} disabled={leaving} onClick={() => start(level)}
                      aria-label={level === 3 ? `Boss level: ${BOTS[3]} bots, one poses as the town reporter` : `Level ${level}: ${label}`}>
                <strong aria-hidden="true">{level === 3 ? '★' : level}</strong>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="start-class">
        <label htmlFor="class-code">Class code</label>
        <input id="class-code" value={classCode} maxLength={24} autoComplete="off" autoCapitalize="characters" placeholder="7B"
               onChange={e => { setCode(e.target.value.toUpperCase()); setClassCode(e.target.value); }} />
        {classCode.trim() && <a href={`/stats.html?class=${encodeURIComponent(classCode.trim())}`}>Results for {classCode.trim()} →</a>}
      </section>

      <nav className="start-links" aria-label="Learn more">
        <a href="/howto.html"><span aria-hidden="true">🧭</span>How to play</a>
        <a href="/codex.html"><span aria-hidden="true">📖</span>Codex</a>
        <a href="/quiz.html?phase=pre"><span aria-hidden="true">❓</span>Quiz</a>
      </nav>
    </main>
  );
}
