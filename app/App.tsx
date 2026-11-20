import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import type { GameState, Post, ToolId } from '../shared/types.ts';
import { alive, init, step } from '../game/engine.ts';
import { PHASE_MS, ROUNDS } from '../game/content.ts';
import { startDirector } from './director.ts';
import { VoteResults } from './VoteResults.tsx';
import { GameLevelContext } from './gameLevel.ts';
import { UnderTheHood } from './UnderTheHood.tsx';
import { StatusPill } from './StatusPill.tsx';
import { Reveal } from './Reveal.tsx';
import { TownMap } from './TownMap.tsx';
import { Icon } from './Icon.tsx';
import { SavePanel, ShareView } from './Share.tsx';
import { replayIdFromUrl } from './share.ts';
import { getRefereeLog } from './refereeLog.ts';
import { SoundToggle, useGameSounds } from './sound.ts';
import { TownScene } from './town/TownScene.tsx';
import { Villager } from './town/Villager.tsx';
import { useSpeaking } from './town/useSpeaking.ts';

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
  const speaking = useSpeaking(game);

  const s = game;
  const who = (id: string) => s.characters.find(c => c.id === id);
  const secs = Math.max(0, Math.ceil((s.phaseEndsAt - s.clock) / 1000));
  const canInvestigate = s.phase === 'discussion' && s.tokens > 0;
  const publicFeed = s.feed.filter(p => !p.to);

  if (s.phase === 'over') return <><GameOver s={s} onAgain={onAgain} /><UnderTheHood s={s} /></>;

  return (
    <main>
      <header className={dmWith ? 'bar dm' : 'bar'}>
        <TownScene cast={s.characters} infection={s.infection} speaking={speaking} walk={s.phase === 'event'} />
        <strong>Round {s.round}/{ROUNDS}</strong>
        <span>{PHASE_NAMES[s.phase]} · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
        <span title="Fact-Check Tokens left this round" aria-label={`${s.tokens} Fact-Check Tokens left`}><Icon name="search" /> {s.tokens}</span>
        <SoundToggle />
      </header>
      <TownMap infection={s.infection} />

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
            <button key={t} disabled={!canInvestigate || who(dmWith)!.ejected} onClick={() => dispatch({ type: 'use_tool', tool: t, target: dmWith })}>{TOOL_NAMES[t]}</button>
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
          {s.phase === 'discussion' && <button className="meeting" onClick={() => dispatch({ type: 'call_meeting' })}>Call emergency meeting</button>}
        </div>
      </section>

      {s.phase === 'meeting' && (
        <div className="overlay" role="dialog" aria-label="Emergency meeting">
          <h2>Emergency meeting · {secs}s</h2>
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
              <b>{p.author === 'news' ? 'NEWS' : p.author === 'you' ? 'You' : c?.handle}</b> {p.text}
              {clue && <p className="clue">{clue.text}</p>}
              {onCheck && c && !c.ejected && !clue && <button className="link" onClick={() => onCheck(p.id)}>Source Check</button>}
            </div>
          </li>
        );
      })}
      <div ref={end} className="feed-end" />
    </ol>
  );
}

function Clues({ s, target }: { s: GameState; target: string }) {
  return <>{s.clues.filter(k => k.target === target).map((k, i) => <p key={i} className="clue"><b>{TOOL_NAMES[k.tool]}:</b> {k.text}</p>)}</>;
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
  return <VoteResults key={s.ejections.length} s={s} />; // key: each meeting starts again at screen 1
}

function GameOver({ s, onAgain }: { s: GameState; onAgain: () => void }) {
  useEffect(() => window.scrollTo(0, 0), []); // the feed may have left the page scrolled down
  return <><div className="tw-over"><TownScene cast={s.characters} infection={s.infection} sunny={s.result === 'won'} /></div><Reveal s={s} onAgain={onAgain}><SavePanel s={s} refereeLog={getRefereeLog()} /></Reveal></>;
}

// Avatars are the town's own villagers, so the chat matches the scene (SPEC §15: original art).
export function Crew({ color, big }: { color: string; big?: boolean }) {
  return <Villager color={color} size={big ? 96 : 32} />;
}
