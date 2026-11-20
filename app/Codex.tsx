// Tactic Codex (SPEC §15, F5): every bot tactic in the game, what it sounds like, how to spot it, and the tool that exposes it.
// Its own page at /codex.html; /codex.html#<tacticId> jumps to and highlights one tactic (for links from the reveal).
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { TacticId, ToolId } from '../shared/types.ts';
import { TACTICS } from '../game/content.ts';
import './style.css';
import './codex.css';
import.meta.glob('./town/theme.css', { eager: true }); // [V6] town theme, loaded last; matches nothing until ethan/town-design merges

// Player-facing copy. TACTICS[t].prompt is written for the bots, so it isn't shown here.
const SPOT: Record<TacticId, string> = {
  fake_urgency: 'A tiny deadline and “share now”. Real warnings come with a notice you can check; rushing you is the point.',
  invented_insider: 'A cousin or a friend “at the county”: someone you can never ask. No name, no link.',
  emotional_outrage: 'Anger or fear doing the work that facts should. Ask what they actually know.',
  coordinated_amplification: 'Two accounts agreeing with each other within seconds, again and again. One voice made to sound like a crowd.',
  accusing_others: 'Calling someone else a bot with no proof, to split the vote and take the heat off itself.',
  fake_consensus: '“Everyone is already doing it.” Ask who, exactly.',
};

const TOOLS: Record<ToolId, { name: string; does: string }> = {
  account_age: { name: 'Account Age', does: 'shows when the account joined and its followers. Brand new, or thousands of followers while following no one, is a red flag.' },
  source_check: { name: 'Source Check', does: 'checks what a post cites. No source at all, or a source that doesn’t say that, is a red flag.' },
  posting_pattern: { name: 'Posting Pattern', does: 'shows what the account usually posts. Only this story, only anger, or always seconds after another account, is a red flag.' },
};

export function Codex() {
  // The page renders after the browser's own jump to #id, so jump again once the cards exist.
  useEffect(() => { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); }, []);
  return (
    <main className="codex">
      <header>
        <h1>Tactic Codex</h1>
        <p>The {Object.keys(TACTICS).length} tricks the bots use in Who’s the Bot?, how to spot each one, and the fact-check tool that exposes it.</p>
      </header>
      <ol className="codex-list">
        {(Object.keys(TACTICS) as TacticId[]).map(id => {
          const t = TACTICS[id], tool = TOOLS[t.counter];
          return (
            <li key={id} id={id} tabIndex={-1}>
              <h2>{t.name}</h2>
              <p className="codex-example">“{t.example}”</p>
              <p><b>How to spot it:</b> {SPOT[id]}</p>
              <p className="codex-tool"><b>{tool.name}</b> {tool.does}</p>
            </li>
          );
        })}
      </ol>
      <nav className="codex-nav" aria-label="Next">
        <a className="codex-cta" href="/">Play Who’s the Bot?</a>
        <a href="/quiz.html?phase=pre">Bot or human? Take the 1-minute quiz</a>
      </nav>
    </main>
  );
}

const root = typeof document !== 'undefined' && document.getElementById('codex-root');
if (root) createRoot(root).render(<Codex />);
