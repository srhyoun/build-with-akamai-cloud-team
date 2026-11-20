import { useEffect, useRef, useState } from 'react';
import { BOTS, PERSONAS } from '../game/content.ts';
import type { GameState } from '../shared/types.ts';
import { initialClassCode, setClassCode } from './classCode.ts';
import { Icon } from './Icon.tsx';
import { RoomLobby } from './RoomPanel.tsx';
import { getRoomSession } from './room.ts';
import { TownScene } from './town/TownScene.tsx';
import './start-screen.css';

const DEMO_CAST = PERSONAS.slice(0, 6).map(p => ({ id: p.handle.slice(1).toLowerCase(), handle: p.handle, color: p.color }));
const LEAVE_MS = 1200;
const LEVELS = [1, 2, 3] as const;
const levelLabel = (l: GameState['level']) => l === 3 ? 'Boss' : `${BOTS[l]} ${BOTS[l] === 1 ? 'bot' : 'bots'}`;

export function StartScreen({ onStart }: { onStart: (level: GameState['level']) => void }) {
  const [classCode, setCode] = useState(initialClassCode);
  const [picked, setLevel] = useState<GameState['level']>(1);
  const [room, setRoom] = useState(getRoomSession);
  const level = room?.level ?? picked; // in a room everyone plays the room's level
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return onStart(level);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLeaving(true);
    timer.current = window.setTimeout(() => onStart(level), LEAVE_MS);
  };

  return (
    <main className={`start-screen${leaving ? ' leaving' : ''}`} aria-labelledby="start-title">
      <header className="start-title">
        <p className="start-welcome">Welcome to</p>
        <h1 id="start-title">Who's the Bot?</h1>
        <p className="start-team">by <b>Kimchi Trenchers</b></p>
      </header>

      <div className="start-hero">
        <TownScene view={leaving ? 'ground' : 'aerial'} cast={DEMO_CAST} infection={0} />
      </div>

      <div className="start-go">
        <button type="button" className="start-button" disabled={leaving} onClick={start}>Start</button>
        <div className="start-level" role="radiogroup" aria-label="Level">
          {LEVELS.map(l => (
            <button key={l} type="button" role="radio" aria-checked={level === l} disabled={leaving || !!room} onClick={() => setLevel(l)}
                    aria-label={l === 3 ? `Boss level: ${BOTS[3]} bots, one poses as the town reporter` : `Level ${l}: ${levelLabel(l)}`}>
              {levelLabel(l)}
            </button>
          ))}
        </div>
        <RoomLobby level={picked} onRoom={setRoom} onLive={start} />
      </div>

      <footer className="start-tutorial" aria-labelledby="tutorial-title">
        <h2 id="tutorial-title">How to play</h2>
        <ol>
          <li><Icon name="eye" size={30} /><b>Read</b> the town chat</li>
          <li><Icon name="search" size={30} /><b>Check</b> who you doubt</li>
          <li><Icon name="vote" size={30} /><b>Vote</b> the bots out</li>
        </ol>
        <nav className="start-links" aria-label="Learn more">
          <a href="/howto.html">Full guide</a>
          <a href="/codex.html">Codex</a>
          <a href="/quiz.html?phase=pre">Quiz</a>
        </nav>
        <details className="start-class" open={!!classCode}>
          <summary>Class code</summary>
          <label htmlFor="class-code">From your teacher</label>
          <input id="class-code" value={classCode} maxLength={24} autoComplete="off" autoCapitalize="characters" placeholder="7B"
                 onChange={e => { setCode(e.target.value.toUpperCase()); setClassCode(e.target.value); }} />
          {classCode.trim() && <a href={`/stats.html?class=${encodeURIComponent(classCode.trim())}`}>Results for {classCode.trim()} →</a>}
        </details>
      </footer>
    </main>
  );
}
