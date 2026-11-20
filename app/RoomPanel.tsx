// "Play together" rooms: everyone in a room plays the same town on their own device and shares one scoreboard.
import { useEffect, useId, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import type { GameState } from '../shared/types.ts';
import type { Room, RoomPlayer } from '../rooms/rooms.ts';
import { radar } from '../game/radar.ts';
import type { RoomSession } from './room.ts';
import { CODE_RE, createRoom, fetchRoom, getRoomSession, joinRoom, roomCodeFromUrl, roomLink, sendResult, setRoomSession, startLive } from './room.ts';
import './room.css';

const NAME_KEY = 'wtb.name'; // the same remembered name as the save panel in Share.tsx
const storedName = () => { try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; } };

// undefined = loading, null = could not be fetched. A failed poll after a good one keeps the last good room.
function useRoom(code: string | undefined, before?: () => Promise<unknown>): Room | null | undefined {
  const [room, setRoom] = useState<Room | null>();
  useEffect(() => {
    if (!code) return setRoom(undefined);
    let live = true;
    const poll = () => { fetchRoom(code).then(r => { if (live) setRoom(prev => r ?? prev ?? null); }); };
    (before?.() ?? Promise.resolve()).then(poll);
    const t = setInterval(poll, 3000);
    return () => { live = false; clearInterval(t); };
  }, [code]);
  return room;
}

function Invite({ code, caption }: { code: string; caption: string }) {
  const [note, setNote] = useState('');
  const q = qrcode(0, 'M'); q.addData(roomLink(code)); q.make();
  const n = q.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(roomLink(code)); setNote('Copied'); } catch { setNote(roomLink(code)); }
  };
  return (
    <div className="rm-invite">
      <p className="rm-code" aria-label={`Join code ${code.split('').join(' ')}`}>{code}</p>
      <svg className="rm-qr" viewBox={`0 0 ${n + 8} ${n + 8}`} role="img" aria-label={`QR code to join room ${code}`} shapeRendering="crispEdges">
        <rect width={n + 8} height={n + 8} rx="2" fill="#fff" />
        <path d={d} fill="#000" />
      </svg>
      <p className="rm-foot">{caption}</p>
      <button type="button" onClick={copy}>Copy link</button>
      <p className="rm-foot" aria-live="polite">{note}</p>
    </div>
  );
}

export function RoomLobby({ level, onRoom, onLive }: { level: 1 | 2 | 3; onRoom: (s: RoomSession | null) => void; onLive?: () => void }) {
  const [urlCode] = useState(roomCodeFromUrl);
  const [session, setSession] = useState(getRoomSession);
  const [open, setOpen] = useState(!!urlCode || !!session);
  const [name, setName] = useState(storedName);
  const [code, setCode] = useState(urlCode ?? '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const room = useRoom(session?.code);
  const id = useId();

  const enter = (s: RoomSession | null) => { setRoomSession(s); setSession(s); onRoom(s); };
  // A link to another room beats the one this tab was in: show the join form for the new code.
  useEffect(() => { if (urlCode && session && session.code !== urlCode) enter(null); }, []);

  // The room's one shared game: whoever presses the button starts it, and everyone in the lobby (or joining later) is pulled in.
  const goLive = (s: RoomSession) => { enter({ ...s, live: true }); onLive?.(); };
  useEffect(() => { if (session && !session.live && room?.live) goLive(session); }, [room?.live, session?.code]);
  // A remembered shared game whose room is gone would be a frozen screen: fall back to this player's own game.
  useEffect(() => { if (session?.live && room === null) enter({ ...session, live: undefined }); }, [room]);
  const together = async () => {
    if (!session) return;
    setBusy(true); setNote('');
    const v = await startLive(session);
    setBusy(false);
    if (v) goLive(session); else setNote('Could not start the shared game.');
  };

  const go = async (join: boolean) => {
    const n = name.trim();
    if (!n) return setNote('Type your name first.');
    if (join && !CODE_RE.test(code)) return setNote('A join code is 4 letters.');
    setBusy(true); setNote('');
    try { localStorage.setItem(NAME_KEY, n); } catch { /* private mode: just not remembered */ }
    const r = join ? await joinRoom(code, n) : await createRoom(level, n);
    setBusy(false);
    // shortcut: a failed join is reported as an unknown code (a full room or a dead server reads the same), split by status if that confuses players.
    if (r) enter(r.session); else setNote(join ? 'That code was not found.' : 'Could not reach the server.');
  };

  if (!open) return <button type="button" className="rm-open" onClick={() => setOpen(true)}>Play together</button>;

  if (session) return (
    <section className="rm-panel" aria-label={`Room ${session.code}`}>
      <Invite code={session.code} caption="Scan to join" />
      <ul className="rm-players" aria-label="Players in this room">
        {(room?.players ?? [{ name: session.name }]).map(p => <li key={p.name} aria-current={p.name === session.name ? 'true' : undefined}>{p.name}</li>)}
      </ul>
      <button type="button" disabled={busy} style={{ background: '#7a4e2b', color: '#fff' }} onClick={together}>Play one game together</button>
      <p className="rm-foot">Everyone joins the same live game and votes as a team.</p>
      <p className="rm-foot" role="status">{note}</p>
      <p>Same town, same bots. Everyone plays their own game. Press Start when you are ready.</p>
      <button type="button" onClick={() => enter(null)}>Leave room</button>
    </section>
  );

  return (
    <form className="rm-panel" aria-label="Play together" onSubmit={e => { e.preventDefault(); go(true); }}>
      <label htmlFor={`${id}n`}>Your name</label>
      <input id={`${id}n`} value={name} maxLength={20} autoComplete="nickname" autoFocus={!!urlCode && !name} onChange={e => setName(e.target.value)} />
      <label htmlFor={`${id}c`}>Join code</label>
      <div className="rm-row">
        <input id={`${id}c`} className="rm-codein" value={code} maxLength={4} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ABCD"
               autoFocus={!!urlCode && !!name} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} />
        <button disabled={busy}>Join</button>
      </div>
      <button type="button" disabled={busy} onClick={() => go(false)}>Create room</button>
      <p className="rm-foot" role="status">{note}</p>
    </form>
  );
}

const rank = (a: RoomPlayer, b: RoomPlayer) => Number(b.done) - Number(a.done) || (b.score ?? 0) - (a.score ?? 0);

export function RoomBoard({ s }: { s: GameState }) {
  const [session, setSession] = useState(getRoomSession);
  const sent = useRef(false); // this game's result goes out once
  const room = useRoom(session?.code, () => {
    if (sent.current || !session || !s.result) return Promise.resolve();
    sent.current = true;
    return sendResult(session, { result: s.result, score: radar(s).score, infection: s.infection });
  });

  if (!session || room === undefined) return null;
  if (!room) return <p className="rm-panel" role="status">Room scoreboard unavailable.</p>;
  return (
    <section className="rm-panel" aria-labelledby="rm-board">
      <h2 id="rm-board">Room {room.code}</h2>
      <ol className="rm-board">
        {[...room.players].sort(rank).map(p => (
          <li key={p.name} aria-current={p.name === session.name ? 'true' : undefined}>
            <span className="rm-name">{p.name}</span>
            {p.done ? <><span>{p.result}</span><b>{p.score}</b></> : <span className="rm-foot">playing…</span>}
          </li>
        ))}
      </ol>
      <h3>Invite more players</h3>
      <Invite code={room.code} caption="Scan to join" />
      <button type="button" onClick={() => { setRoomSession(null); setSession(null); }}>Leave room</button>
    </section>
  );
}
