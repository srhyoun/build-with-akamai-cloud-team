// How to play (/howto.html): the whole game on one short page, in the order a round happens.
// Numbers come from game/content.ts so the page can't drift from the rules.
import { createRoot } from 'react-dom/client';
import { BOTS, PHASE_MS, ROUNDS, SPREAD, TOKENS_PER_ROUND } from '../game/content.ts';
import { Villager } from './town/Villager.tsx';
import './style.css';
import './howto.css';
import './town/theme.css'; // the town theme, loaded last so it wins over the page's own stylesheet

const STEPS = [
  { title: 'News breaks', text: `Something happens in town and the group chat fills up. Most villagers are honest. ${BOTS[1]} or ${BOTS[2]} are bots pushing a false story.` },
  { title: 'Read and ask', text: 'Read the chat. Tap a villager to message them in private and compare what they say.' },
  { title: 'Fact-check', text: `You get ${TOKENS_PER_ROUND} checks each round. Spend them on the villagers or posts you doubt.` },
  { title: 'Meet and vote', text: `Call an emergency meeting, or it starts by itself after ${PHASE_MS.discussion / 1000} seconds. Everyone votes, you too. The most votes is ejected. A tie ejects nobody.` },
  { title: 'The story spreads', text: `After each round the town gets ${SPREAD.perBot}% more infected for every bot still in it, and ${SPREAD.wrongEjection}% more if you ejected a human.` },
];

const TOOLS = [
  { name: 'Account Age', text: 'When the account joined. Tap a villager, then the button.' },
  { name: 'Source Check', text: 'What a post really cites. Tap it under any post.' },
  { name: 'Posting Pattern', text: 'What the account usually posts. Tap a villager, then the button.' },
];

export function HowTo() {
  return (
    <main className="howto">
      <header>
        <div className="howto-cast" aria-hidden="true">
          <Villager color="#3e63dd" size={64} /><Villager color="#f76b15" size={72} talking /><Villager color="#30a46c" size={64} mood="uneasy" />
        </div>
        <h1>How to play</h1>
        <p>Find the bots in the town chat before their false story reaches everyone.</p>
      </header>

      <ol className="howto-steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="howto-icon" aria-hidden="true">{i + 1}</span>
            <div><h2>{s.title}</h2><p>{s.text}</p></div>
          </li>
        ))}
      </ol>

      <section aria-labelledby="howto-tools">
        <h2 id="howto-tools">Your three checks</h2>
        <ul className="howto-chips">{TOOLS.map(t => <li key={t.name}><b>{t.name}</b>{t.text}</li>)}</ul>
      </section>

      <section className="howto-ends" aria-labelledby="howto-ends">
        <h2 id="howto-ends">How it ends</h2>
        <p><b>You win</b> when every bot is ejected within {ROUNDS} rounds.</p>
        <p><b>You lose</b> if a bot is still in town after round {ROUNDS}, or the town reaches 100%.</p>
        <p><b>⭐ Score:</b> 100 for each bot caught, minus 75 for each human ejected, plus 100 minus the town’s infection.</p>
      </section>

      <section aria-labelledby="howto-levels">
        <h2 id="howto-levels">Levels</h2>
        <ul className="howto-chips">
          <li><b>Level 1</b>{BOTS[1]} bot.</li>
          <li><b>Level 2</b>{BOTS[2]} bots. They back each other up.</li>
          <li><b>Boss</b>{BOTS[3]} bots, and one copies the town reporter’s name with one character changed.</li>
        </ul>
      </section>

      <section aria-labelledby="howto-tips">
        <h2 id="howto-tips">Good to know</h2>
        <ul className="howto-tips">
          <li>A typo or a wrong detail does not make someone a bot. Honest people get things wrong too.</li>
          <li>A new account alone proves nothing. One honest villager is new in town.</li>
          <li>Bots call others bots without proof, to split the vote.</li>
          <li>While the news is breaking you can walk your villager around: arrow keys, WASD, or tap the square.</li>
        </ul>
      </section>

      <nav className="howto-nav" aria-label="Next">
        <a className="howto-cta" href="/">Play</a>
        <a href="/codex.html">The bots’ 6 tricks</a>
      </nav>
    </main>
  );
}

const root = typeof document !== 'undefined' && document.getElementById('howto-root');
if (root) createRoot(root).render(<HowTo />);
