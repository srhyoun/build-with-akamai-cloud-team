import { BOTS, TOKENS_PER_ROUND } from '../game/content.ts';
import type { GameState } from '../shared/types.ts';
import './start-screen.css';

export function StartScreen({ onStart }: { onStart: (level: GameState['level']) => void }) {
  return (
    <main className="start-screen" aria-labelledby="start-title">
      <header>
        <h1 id="start-title">Who's the Bot?</h1>
        <p>Find the bots in the town group chat before their false story spreads.</p>
      </header>

      <section className="start-rules" aria-labelledby="rules-title">
        <h2 id="rules-title">How to play</h2>
        <ol>
          <li>Read the breaking news and DM characters to compare their stories.</li>
          <li>Spend {TOKENS_PER_ROUND} Fact-Check Tokens each round on Account Age, Source Check, or Posting Pattern.</li>
          <li>Call an emergency meeting and vote to eject a suspect.</li>
        </ol>
      </section>

      <section aria-labelledby="level-title">
        <h2 id="level-title">Choose a level</h2>
        <div className="start-levels">
          {([1, 2] as const).map(level => (
            <button key={level} type="button" onClick={() => onStart(level)}>
              <strong>Level {level}</strong>
              <span>{BOTS[level]} {BOTS[level] === 1 ? 'bot' : 'bots'}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
