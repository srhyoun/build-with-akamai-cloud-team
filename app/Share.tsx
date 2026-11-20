// Save + share on the game-over screen, and the public replay card at /?replay=<id>.
import { useEffect, useId, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import type { GameState, RefereeCheck, TacticId } from '../shared/types.ts';
import type { ReplayResponse, SaveResponse } from '../store/replay.ts';
import { TACTICS } from '../game/content.ts';
import { Leaderboard } from './Leaderboard.tsx';
import { loadReplay, saveReplay } from './share.ts';
import './share.css';

const NAME_KEY = 'wtb.name';
const storedName = () => { try { return localStorage.getItem(NAME_KEY); } catch { return null; } };

export function SavePanel({ s, refereeLog }: { s: GameState; refereeLog?: RefereeCheck[] }) {
  const [remembered, setRemembered] = useState(storedName);
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<'form' | 'saving' | 'failed'>(remembered ? 'saving' : 'form');
  const [saved, setSaved] = useState<SaveResponse | null>(null);
  const [note, setNote] = useState('');
  const sent = useRef(false);    // a save is in flight or done: never send a second one
  const mounted = useRef(false);
  const asked = useRef(remembered); asked.current = remembered; // the effect below runs from the first-render closure
  const nameId = useId();

  const save = async (playerName: string | null, keepalive = false) => {
    if (sent.current) return;
    sent.current = true;
    setPhase('saving');
    const r = await saveReplay(s, { refereeLog, playerName, keepalive });
    if (r) { setSaved(r); setNote(`Saved. Score ${r.score}.`); } else { sent.current = false; setPhase('failed'); }
  };

  useEffect(() => {
    mounted.current = true;
    if (remembered) save(remembered);
    // Closing the tab skips React cleanup; pagehide is the last event phones reliably fire.
    const bye = () => { save(asked.current, true); };
    addEventListener('pagehide', bye);
    return () => {
      removeEventListener('pagehide', bye);
      mounted.current = false;
      // React's dev double-mount runs this cleanup too; only a real unmount is still unmounted a tick later.
      setTimeout(() => { if (!mounted.current && !sent.current) { sent.current = true; saveReplay(s, { refereeLog, playerName: asked.current, keepalive: true }); } });
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n) { try { localStorage.setItem(NAME_KEY, n); } catch { /* private mode: just not remembered */ } setRemembered(n); }
    save(n || null);
  };
  const forget = () => {
    try { localStorage.removeItem(NAME_KEY); } catch { /* nothing stored */ }
    setRemembered(null);
    setNote('Name cleared. You will be asked again next game.');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(saved!.shareUrl!); setNote('Copied'); } catch { setNote('Could not copy. Select the link instead.'); }
    setTimeout(() => setNote(''), 2500);
  };

  return (
    <>
      <section className="sh-panel" aria-label="Save and share">
        {saved ? (
          <>
            <p className="sh-score">Score <b>{saved.score}</b></p>
            {saved.shareUrl ? (
              <>
                <div className="sh-link">
                  <input readOnly value={saved.shareUrl} aria-label="Share link" onFocus={e => e.target.select()} />
                  <button onClick={copy}>Copy link</button>
                </div>
                <Qr url={saved.shareUrl} />
                <p className="sh-foot">Scan to open this replay on your phone</p>
              </>
            ) : <p>Saved, but the share link is unavailable right now.</p>}
          </>
        ) : phase === 'saving' ? <p role="status">Saving your game…</p> : phase === 'failed' ? (
          <>
            <p role="status">Couldn't save this game. The server may be offline.</p>
            <button onClick={() => save(remembered)}>Try again</button>
          </>
        ) : (
          <form className="sh-form" onSubmit={submit}>
            <label htmlFor={nameId}>Name for the leaderboard <small>(optional)</small></label>
            <div className="sh-link">
              <input id={nameId} value={name} onChange={e => setName(e.target.value)} maxLength={24} autoComplete="nickname" />
              <button>Save &amp; share</button>
            </div>
          </form>
        )}
        {remembered && <button className="sh-small" onClick={forget}>Not you? Change name</button>}
        <p className="sh-foot" aria-live="polite">{note}</p>
      </section>
      <Leaderboard highlightId={saved?.id} reloadKey={saved?.id} />
    </>
  );
}

function Qr({ url }: { url: string }) {
  const q = qrcode(0, 'M'); q.addData(url); q.make();
  const n = q.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
  return (
    <svg className="sh-qr" viewBox={`0 0 ${n + 8} ${n + 8}`} role="img" aria-label="QR code that opens this replay" shapeRendering="crispEdges">
      <rect width={n + 8} height={n + 8} rx="2" fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

// Our own avatar: a rounded chat pebble with two dot eyes.
function Pebble({ color }: { color: string }) {
  return (
    <svg className="sh-pebble" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M12 3h4a9 9 0 0 1 0 18h-5l-5 4 1-5.2A9 9 0 0 1 12 3z" fill={color} />
      <circle cx="10.5" cy="12" r="2" fill="#fff" /><circle cx="17.5" cy="12" r="2" fill="#fff" />
      <circle cx="10.5" cy="12" r="1" fill="#16181d" /><circle cx="17.5" cy="12" r="1" fill="#16181d" />
    </svg>
  );
}

// Safety: bot text is never shown without this chip. An unknown tactic id still gets "BOT".
function BotChip({ tactics }: { tactics: (TacticId | undefined)[] }) {
  const names = tactics.map(t => t && TACTICS[t]?.name).filter(Boolean);
  return <span className="sh-chip sh-bot">BOT{names.length ? ` · ${names.join(', ')}` : ''}</span>;
}

export function ShareView({ id }: { id: string }) {
  const [res, setRes] = useState<ReplayResponse | null | undefined>(undefined); // undefined = loading, null = not found / failed
  useEffect(() => {
    let live = true;
    loadReplay(id).then(r => { if (live) setRes(r); });
    return () => { live = false; };
  }, [id]);

  if (res === undefined) return <main className="sh-view"><p role="status">Loading the replay…</p></main>;
  if (!res) return <main className="sh-view"><h1>This replay isn't available.</h1><a className="sh-play" href="/">Play it yourself</a></main>;

  const r = res.replay;
  const who = (cid: string | null) => r.characters.find(c => c.id === cid);
  return (
    <main className="sh-view">
      <h1>{r.playerName || 'A player'} {r.result === 'won' ? 'found every bot' : 'lost the town to the bots'}</h1>
      <p className="sh-stats">Level {r.level} · Score <b>{r.score}</b> · Town infected {r.infection}%</p>
      <p className="sh-callout">{r.radar.headline}</p>

      <h2>The cast</h2>
      <ul className="sh-cast">
        {r.characters.map(c => {
          const out = r.ejections.find(e => e.id === c.id);
          return (
            <li key={c.id}>
              <Pebble color={c.color} />
              <div>
                <b>{c.handle}</b> {c.role === 'bot' ? <BotChip tactics={c.tactics} /> : <span className="sh-chip">Human</span>}
                {out && <small> ejected in round {out.round}</small>}
              </div>
            </li>
          );
        })}
      </ul>

      {r.rounds.map((round, i) => (
        <section key={i}>
          <h2>Round {i + 1}</h2>
          <p className="sh-alert">{round.alert}</p>
          <div className="sh-stories">
            <p className="sh-true"><b>What was true</b>{round.truth}</p>
            <p className="sh-false"><b>The false story</b>{round.falseStory}</p>
          </div>
          <ol className="sh-posts" role="list">
            {r.posts.filter(p => p.round === i + 1 && !(p.author === 'news' && p.text === round.alert)).map((p, j) => {
              const c = who(p.author);
              return (
                <li key={j}>
                  {c && <Pebble color={c.color} />}
                  <div><b>{c?.handle ?? (p.author === 'news' ? 'NEWS' : p.author)}</b> {c?.role === 'bot' && <BotChip tactics={[p.tactic]} />} {p.text}</div>
                </li>
              );
            })}
          </ol>
          {r.ejections.filter(e => e.round === i + 1).map((e, j) => (
            <p key={j} className="sh-eject">{e.id ? <>Ejected: <b>{who(e.id)?.handle ?? e.id}</b>, {e.wasBot ? 'a bot' : 'a human, not a bot'}.</> : 'Nobody was ejected this round.'}</p>
          ))}
        </section>
      ))}

      <a className="sh-play" href="/">Play it yourself</a>
      <p className="sh-foot">{res.source === 'object-storage' ? 'This replay is stored in Akamai Object Storage.' : 'Replay stored locally (dev mode).'}</p>
      <Leaderboard highlightId={id} />
    </main>
  );
}
