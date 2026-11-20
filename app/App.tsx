import { useEffect, useReducer, useRef, useState } from 'react';
import type { Character, GameState, Post, ToolId } from '../shared/types.ts';
import { alive, init, step } from '../game/engine.ts';
import { PHASE_MS, ROUNDS, TACTICS } from '../game/content.ts';
import { startDirector } from './director.ts';

const TOOL_NAMES: Record<ToolId, string> = { account_age: 'Account Age', source_check: 'Source Check', posting_pattern: 'Posting Pattern' };
const PHASE_NAMES = { event: 'Breaking news', discussion: 'Discuss & investigate', meeting: 'Emergency meeting', ejection: 'Ejection', over: 'Game over' };

export function App() {
  const [n, setN] = useState(0); // a new key = a fresh game
  return <Game key={n} onAgain={() => setN(n + 1)} />;
}

function Game({ onAgain }: { onAgain: () => void }) {
  const [game, dispatch] = useReducer(step, undefined, () => init(Date.now() % 1e9));
  const ref = useRef(game); ref.current = game;
  const [dmWith, setDmWith] = useState<string | null>(null);
  useEffect(() => startDirector(() => ref.current, dispatch), []);

  const s = game;
  const who = (id: string) => s.characters.find(c => c.id === id);
  const secs = Math.max(0, Math.ceil((s.phaseEndsAt - s.clock) / 1000));
  const canInvestigate = s.phase === 'discussion' && s.tokens > 0;
  const publicFeed = s.feed.filter(p => !p.to);

  if (s.phase === 'over') return <GameOver s={s} onAgain={onAgain} />;

  return (
    <main>
      <header className="bar">
        <strong>Round {s.round}/{ROUNDS}</strong>
        <span>{PHASE_NAMES[s.phase]} · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
        <span title="Fact-Check Tokens left this round">🔍 {s.tokens}</span>
        <div className="spread" role="meter" aria-label="Town infected" aria-valuenow={s.infection} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${s.infection}%` }} /><span>Town infected {s.infection}%</span>
        </div>
      </header>

      <nav className="cast" aria-label="Characters">
        {s.characters.map(c => (
          <button key={c.id} className={`avatar ${c.ejected ? 'out' : ''} ${dmWith === c.id ? 'on' : ''}`} onClick={() => setDmWith(dmWith === c.id ? null : c.id)} aria-pressed={dmWith === c.id}>
            <Crew color={c.color} /><span>{c.handle}</span>
          </button>
        ))}
      </nav>

      {dmWith && who(dmWith) && (
        <section className="panel" aria-label={`DM with ${who(dmWith)!.handle}`}>
          <h2>DM {who(dmWith)!.handle} <small>{who(dmWith)!.bio}</small></h2>
          {(['account_age', 'posting_pattern'] as const).map(t => (
            <button key={t} disabled={!canInvestigate || who(dmWith)!.ejected} onClick={() => dispatch({ type: 'use_tool', tool: t, target: dmWith })}>🔍 {TOOL_NAMES[t]}</button>
          ))}
          <Clues s={s} target={dmWith} />
          <Feed s={s} posts={s.feed.filter(p => p.to === dmWith)} />
          {!who(dmWith)!.ejected && <Composer placeholder={`Ask ${who(dmWith)!.handle}…`} onSend={text => dispatch({ type: 'post', text, to: dmWith })} />}
        </section>
      )}

      <section aria-label="Town group chat">
        <Feed s={s} posts={publicFeed} onCheck={canInvestigate ? id => dispatch({ type: 'use_tool', tool: 'source_check', target: id }) : undefined} />
        <Composer placeholder="Post to the town chat…" onSend={text => dispatch({ type: 'post', text })} />
        {s.phase === 'discussion' && <button className="meeting" onClick={() => dispatch({ type: 'call_meeting' })}>🚨 Call emergency meeting</button>}
      </section>

      {s.phase === 'meeting' && (
        <div className="overlay" role="dialog" aria-label="Emergency meeting">
          <h2>🚨 Emergency meeting · {secs}s</h2>
          <Feed s={s} posts={publicFeed.filter(p => p.at >= s.phaseEndsAt - PHASE_MS.meeting)} />
          <p>Who's the bot?</p>
          <div className="votes">
            {alive(s).map(c => <button key={c.id} onClick={() => dispatch({ type: 'vote', target: c.id })}><Crew color={c.color} />{c.handle}</button>)}
            <button onClick={() => dispatch({ type: 'vote', target: null })}>Skip vote</button>
          </div>
        </div>
      )}

      {s.phase === 'ejection' && <Ejection s={s} />}
    </main>
  );
}

function Feed({ s, posts, onCheck }: { s: GameState; posts: Post[]; onCheck?: (id: string) => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [posts.length]);
  return (
    <ol className="feed" aria-live="polite">
      {posts.map(p => {
        const c = s.characters.find(x => x.id === p.author);
        const clue = s.clues.find(k => k.tool === 'source_check' && k.target === p.id);
        return (
          <li key={p.id} className={p.author === 'news' ? 'news' : p.author === 'you' ? 'you' : ''}>
            {c && <Crew color={c.color} />}
            <div>
              <b>{p.author === 'news' ? '📢 NEWS' : p.author === 'you' ? 'You' : c?.handle}</b> {p.text}
              {clue && <p className="clue">🔍 {clue.text}</p>}
              {onCheck && c && !c.ejected && !clue && <button className="link" onClick={() => onCheck(p.id)}>🔍 Source Check</button>}
            </div>
          </li>
        );
      })}
      <div ref={end} />
    </ol>
  );
}

function Clues({ s, target }: { s: GameState; target: string }) {
  return <>{s.clues.filter(k => k.target === target).map((k, i) => <p key={i} className="clue">🔍 {TOOL_NAMES[k.tool]}: {k.text}</p>)}</>;
}

function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <form className="composer" onSubmit={e => { e.preventDefault(); if (text.trim()) { onSend(text.trim()); setText(''); } }}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={280} />
      <button>Send</button>
    </form>
  );
}

function Ejection({ s }: { s: GameState }) {
  const e = s.ejections.at(-1)!;
  const c = s.characters.find(x => x.id === e.id);
  return (
    <div className="overlay eject" role="dialog" aria-label="Ejection">
      {c ? <><Crew color={c.color} big /><h2>{c.handle} was {e.wasBot ? 'a Bot' : 'not a Bot'}.</h2></> : <h2>Nobody was ejected.</h2>}
      <p>{s.votes.map(v => `${v.voter === 'you' ? 'You' : s.characters.find(x => x.id === v.voter)?.handle} → ${v.target ? s.characters.find(x => x.id === v.target)?.handle : 'skip'}`).join(' · ')}</p>
    </div>
  );
}

function GameOver({ s, onAgain }: { s: GameState; onAgain: () => void }) {
  return (
    <main className="over">
      <h1>{s.result === 'won' ? '✅ You found every bot!' : '❌ The false story reached the town.'}</h1>
      <p>Town infected: {s.infection}%</p>
      <ul className="reveal">
        {s.characters.map((c: Character) => (
          <li key={c.id}><Crew color={c.color} /> <b>{c.handle}</b> was {c.role === 'bot' ? <>a <b>Bot</b> · {c.tactics.map(t => TACTICS[t].name).join(', ')}</> : 'human'}{c.ejected ? ' (ejected)' : ''}</li>
        ))}
      </ul>
      <button onClick={onAgain}>Play again</button>
    </main>
  );
}

// Our own crewmate-style avatar: a rounded body with a visor. Not any existing game's character.
function Crew({ color, big }: { color: string; big?: boolean }) {
  const size = big ? 96 : 32;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="7" y="4" width="18" height="24" rx="9" fill={color} />
      <rect x="14" y="9" width="12" height="7" rx="3.5" fill="#cfe8ff" stroke="#0005" />
    </svg>
  );
}
