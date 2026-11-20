import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import type { GameState, Post, ToolId } from '../shared/types.ts';
import { alive, init, step } from '../game/engine.ts';
import { PHASE_MS, ROUNDS } from '../game/content.ts';
import { startDirector } from './director.ts';
import { voteResult } from './voteResult.ts';
import { GameLevelContext } from './gameLevel.ts';
import { UnderTheHood } from './UnderTheHood.tsx';
import { StatusPill } from './StatusPill.tsx';
import { Reveal } from './Reveal.tsx';
import { TownMap } from './TownMap.tsx';
import { SavePanel, ShareView } from './Share.tsx';
import { replayIdFromUrl } from './share.ts';
import { getRefereeLog } from './refereeLog.ts';
import { SoundToggle, useGameSounds } from './sound.ts';

export const TOOL_NAMES: Record<ToolId, string> = { account_age: 'Account Age', source_check: 'Source Check', posting_pattern: 'Posting Pattern' };
const PHASE_NAMES = { event: 'News', discussion: 'Investigate', meeting: 'Emergency meeting', ejection: 'Ejection', over: 'Game over' };

export function App() {
  const [n, setN] = useState(0); // a new key = a fresh game
  const replay = replayIdFromUrl();
  if (replay) return <ShareView id={replay} />;
  return <Game key={n} onAgain={() => setN(n + 1)} />;
}

function Game({ onAgain }: { onAgain: () => void }) {
  const level = useContext(GameLevelContext);
  const [game, dispatch] = useReducer(step, undefined, () => init(Date.now() % 1e9, level));
  const ref = useRef(game); ref.current = game;
  const [dmWith, setDmWith] = useState<string | null>(null);
  useEffect(() => startDirector(() => ref.current, dispatch), []);
  useGameSounds(game);

  const s = game;
  const who = (id: string) => s.characters.find(c => c.id === id);
  const secs = Math.max(0, Math.ceil((s.phaseEndsAt - s.clock) / 1000));
  const canInvestigate = s.phase === 'discussion' && s.tokens > 0;
  const publicFeed = s.feed.filter(p => !p.to);

  if (s.phase === 'over') return <><GameOver s={s} onAgain={onAgain} /><UnderTheHood s={s} /></>;

  return (
    <main>
      <header className="bar">
        <strong>Round {s.round}/{ROUNDS}</strong>
        <span>{PHASE_NAMES[s.phase]} · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
        <span title="Fact-Check Tokens left this round">🔍 {s.tokens}</span>
        <SoundToggle />
        <TownMap infection={s.infection} />
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
        <div className="actions">
          <Composer placeholder="Post to the town chat…" onSend={text => dispatch({ type: 'post', text })} />
          {s.phase === 'discussion' && <button className="meeting" onClick={() => dispatch({ type: 'call_meeting' })}>🚨 Call emergency meeting</button>}
        </div>
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
      <UnderTheHood s={s} />
      <footer className="status-pill-footer"><StatusPill /></footer>
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
      <div ref={end} className="feed-end" />
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
      {c ? (
        <>
          <div className="eject-stage" aria-hidden="true">
            <div className="eject-avatar"><Crew color={c.color} big /></div>
          </div>
          <h2>{c.handle} was {e.wasBot ? 'a Bot' : 'not a Bot'}.</h2>
        </>
      ) : <h2>Nobody was ejected.</h2>}
      <p><b>{voteResult(s)}</b></p>
      <p>{s.votes.map(v => `${v.voter === 'you' ? 'You' : s.characters.find(x => x.id === v.voter)?.handle} → ${v.target ? s.characters.find(x => x.id === v.target)?.handle : 'skip'}`).join(' · ')}</p>
    </div>
  );
}

function GameOver({ s, onAgain }: { s: GameState; onAgain: () => void }) {
  return <Reveal s={s} onAgain={onAgain}><SavePanel s={s} refereeLog={getRefereeLog()} /></Reveal>;
}

// Our own avatar: a colored "chat pebble" with dot eyes (SPEC §15: no crewmate shapes or visors).
export function Crew({ color, big }: { color: string; big?: boolean }) {
  const size = big ? 96 : 32;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 4c7.2 0 12 4.6 12 10.6S23.2 25 16 25c-1.5 0-2.9-.2-4.2-.6L6 28l1.3-5.4C5.2 20.7 4 18 4 14.6 4 8.6 8.8 4 16 4z" fill={color} />
      <circle cx="12" cy="14" r="2.2" fill="#fff" /><circle cx="20" cy="14" r="2.2" fill="#fff" />
      <circle cx="12.6" cy="14.4" r="1" fill="#14171f" /><circle cx="20.6" cy="14.4" r="1" fill="#14171f" />
    </svg>
  );
}
