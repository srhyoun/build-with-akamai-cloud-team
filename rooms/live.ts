// One shared live game per room ("Play one game together"): the server is the game master (a port of
// app/director.ts startDirector), every player polls the same state and the team shares the engine's one player seat.
// shortcut: games live in memory like rooms, so they are lost on restart and only work with one server; move with rooms when we scale out.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { GameState, ToolId } from '../shared/types.ts';
import { alive, init, step } from '../game/engine.ts';
import { scriptedLine, type LineKind, type Say } from '../game/voice.ts';
import { createChatterOrder } from '../app/chatter.ts';
import { getRoom as defaultGetRoom, type Room } from './rooms.ts';

export interface LiveView {
  state: GameState;                 // the one shared game, as the engine has it
  version: number;                  // goes up on every change
  players: string[];                // names of the room's players
  voted: string[];                  // names that have voted in the current meeting
  posters: Record<string, string>;  // post id → the player name who wrote it (posts whose author is "you")
}
export type MakeLine = (state: GameState, charId: string, kind: LineKind, to?: string) => Promise<{ status: number; body: unknown }>;

interface Game {
  room: Room; state: GameState; version: number;
  voted: Map<string, string | null>; posters: Record<string, string>;
  timer?: ReturnType<typeof setInterval>;
  pending: { at: number; run: () => void }[]; // delayed lines, run by the tick so one interval is the only timer
  set(next: GameState): void;
  teamVote(dt?: number): void;
}

const MAX_BODY = 4096;
const MAX_MS = 20 * 60 * 1000;
const TOOLS: readonly string[] = ['account_age', 'source_check', 'posting_pattern'] satisfies ToolId[];
const PATH = /^\/api\/rooms\/([^/]+)\/live(?:\/(start|cmd))?\/?$/;
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const short = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 60;

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

// Over the cap it keeps reading but stops storing: closing the socket mid-upload would lose the 413 answer.
async function readBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) { size += chunk.length; if (size <= MAX_BODY) chunks.push(chunk); }
  return size > MAX_BODY ? null : Buffer.concat(chunks).toString('utf8');
}

export function createLive(opts: { getRoom: (code: string) => Room | undefined; makeLine: MakeLine; now?: () => number; random?: () => number; tickMs?: number; maxGames?: number }) {
  const now = opts.now ?? Date.now;
  const random = opts.random ?? Math.random;
  const tickMs = opts.tickMs ?? 250;
  const maxGames = opts.maxGames ?? 12;
  const games = new Map<string, Game>();

  const halt = (g: Game) => { clearInterval(g.timer); g.timer = undefined; g.pending = []; };

  function start(room: Room, seed: number): Game {
    const nextSpeaker = createChatterOrder(random);
    let nextChatter = 3000;
    let prev = now();
    const startedAt = prev;

    // One character line: the model's if it answers 200, else a scripted one. Always on the state as it is when it lands.
    const line = async (id: string, kind: LineKind, to?: string) => {
      try {
        const there = () => g.state.characters.find(c => c.id === id && !c.ejected);
        if (!there() || g.state.phase === 'over') return;
        let say: Say | undefined;
        try {
          const r = await opts.makeLine(g.state, id, kind, to);
          if (r.status === 200 && isObj(r.body) && r.body.type === 'say' && r.body.author === id && typeof r.body.text === 'string') {
            const body: Record<string, unknown> = { ...r.body, to }; // a reply to a DM stays in that thread whatever the line maker sent
            delete body.check;
            say = body as unknown as Say;
          }
        } catch { /* scripted line below */ }
        const c = there();
        if (c) g.set(step(g.state, say ?? scriptedLine(g.state, c, kind, to)));
      } catch (e) { console.error('live line:', e); }
    };
    const speak = (id: string, kind: LineKind, to?: string, delay = 0) => g.pending.push({ at: now() + delay, run: () => void line(id, kind, to) });

    const g: Game = {
      room, state: init(seed, room.level), version: 1, voted: new Map(), posters: {}, pending: [],
      // Every change of state goes through here, so what director.ts notices on its next tick happens once per change.
      set(next) {
        const last = g.state;
        if (next === last) return;
        g.state = next;
        g.version++;
        if (next.phase === 'meeting' && last.phase !== 'meeting') {
          g.voted.clear();
          alive(next).forEach((c, i) => speak(c.id, 'defense', undefined, 600 + i * 1200));
        }
        for (const p of next.feed.slice(last.feed.length)) {
          if (p.author !== 'you') continue;
          if (p.to) { speak(p.to, 'reply', p.to, 1500 + random() * 2000); continue; } // a DM: they answer in the same thread
          const here = alive(next);
          const named = here.filter(c => p.text.toLowerCase().includes(c.handle.toLowerCase())).slice(0, 2);
          const answer = named.length ? named : here.length ? [here[Math.min(here.length - 1, Math.floor(random() * here.length))]] : [];
          answer.forEach((c, i) => speak(c.id, 'reply', undefined, 1500 + i * 1800 + random() * 1500));
        }
      },
      // The team's one vote: plurality of the players' votes, a tie = skip. Sent when everyone voted or the meeting is about to end.
      teamVote(dt = 0) {
        const s = g.state;
        if (s.phase !== 'meeting' || g.voted.size === 0) return;
        const everyone = room.players.every(p => g.voted.has(p.name));
        if (!everyone && s.clock + dt < s.phaseEndsAt - 600) return;
        const tally = new Map<string | null, number>();
        for (const v of g.voted.values()) tally.set(v, (tally.get(v) ?? 0) + 1);
        const top = [...tally].sort((a, b) => b[1] - a[1]);
        g.set(step(s, { type: 'vote', target: top.length === 1 || top[0][1] > top[1][1] ? top[0][0] : null }));
      },
    };

    g.timer = setInterval(() => {
      try {
        const t = now(), dt = Math.max(0, t - prev);
        prev = t;
        g.teamVote(dt); // before the tick: at the timeout the engine would skip for the team
        g.set(step(g.state, { type: 'tick', dt }));
        const s = g.state;
        if (s.phase === 'discussion' || s.phase === 'event') {
          nextChatter -= dt;
          if (nextChatter <= 0) {
            const who = nextSpeaker(alive(s).map(c => c.id));
            if (who) speak(who, 'post');
            nextChatter = 4000 + random() * 5000;
          }
        }
        const due = g.pending.filter(p => p.at <= t);
        g.pending = g.pending.filter(p => p.at > t);
        for (const p of due) p.run();
        if (g.state.phase === 'over' || t - startedAt >= MAX_MS) halt(g); // the final state stays for players to fetch
      } catch (e) { console.error('live tick:', e); }
    }, tickMs);
    g.timer.unref(); // a running game never keeps the process (or a test run) alive
    return g;
  }

  // Returns an error message for a 400, or null when the command was taken.
  function command(g: Game, name: string, cmd: unknown): string | null {
    if (!isObj(cmd)) return 'cmd must be an object';
    const s = g.state;
    switch (cmd.type) {
      case 'post': {
        if (typeof cmd.text !== 'string') return 'text must be a string';
        const text = cmd.text.replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ').trim().slice(0, 280);
        if (!text) return 'text is empty';
        const to = cmd.to ?? undefined;
        if (to !== undefined && !(short(to) && s.characters.some(c => c.id === to))) return 'to must be a character id';
        g.set(step(s, { type: 'post', text, to }));
        if (g.state !== s) g.posters[`p${s.feed.length}`] = name; // the engine appends it, ids are p<index>
        return null;
      }
      case 'use_tool':
        if (typeof cmd.tool !== 'string' || !TOOLS.includes(cmd.tool) || !short(cmd.target)) return 'need a tool and a target';
        g.set(step(s, { type: 'use_tool', tool: cmd.tool as ToolId, target: cmd.target }));
        return null;
      case 'call_meeting':
        g.set(step(s, { type: 'call_meeting' }));
        return null;
      case 'vote': {
        const target = cmd.target ?? null;
        if (target !== null && !(short(target) && alive(s).some(c => c.id === target))) return 'target must be null or a living character id';
        if (s.phase !== 'meeting') return null; // a late vote (the meeting just ended) is not an error, the answer shows why
        g.voted.set(name, target);
        g.version++;
        g.teamVote();
        return null;
      }
      default: return 'unknown cmd type';
    }
  }

  async function route(req: IncomingMessage, res: ServerResponse, code: string, action: string | undefined) {
    if (req.method !== (action ? 'POST' : 'GET')) return send(res, 405, { error: 'method not allowed' });
    let body: Record<string, unknown> = {};
    if (action) {
      const raw = await readBody(req);
      if (raw === null) return send(res, 413, { error: 'body over 4 KB' });
      let parsed: unknown;
      try { parsed = raw.trim() ? JSON.parse(raw) : {}; } catch { return send(res, 400, { error: 'body is not JSON' }); }
      if (!isObj(parsed)) return send(res, 400, { error: 'body must be a JSON object' });
      body = parsed;
    }
    const room = opts.getRoom(code);
    if (!room) return send(res, 404, { error: 'room not found' });
    const name = action ? body.name : new URLSearchParams((req.url ?? '').split('?')[1] ?? '').get('name');
    if (typeof name !== 'string' || !room.players.some(p => p.name === name)) return send(res, 403, { error: 'not a player in this room' });

    let g = games.get(room.code);
    if (g && g.room !== room) { halt(g); games.delete(room.code); g = undefined; } // the code was reused by a newer room
    if (action === 'start') {
      let seed = room.seed;
      if (g && !g.timer) { seed = g.state.seed + 1; games.delete(room.code); g = undefined; } // the last game is finished: "Play again" gets a new town
      if (!g) {
        for (const [k, x] of games) if (opts.getRoom(k) !== x.room) { halt(x); games.delete(k); } // the room expired
        if ([...games.values()].filter(x => x.timer).length >= maxGames) return send(res, 429, { error: 'too many shared games running, try again later' });
        g = start(room, seed);
        games.set(room.code, g);
      }
      room.live = true;
    }
    if (!g) return send(res, 404, { error: 'this room has no shared game' });
    if (action === 'cmd') {
      const error = command(g, name, body.cmd);
      if (error) return send(res, 400, { error });
    }
    const view: LiveView = { state: g.state, version: g.version, players: room.players.map(p => p.name), voted: [...g.voted.keys()], posters: g.posters };
    send(res, 200, view);
  }

  return {
    async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
      const m = PATH.exec((req.url ?? '').split('?')[0]);
      if (!m) return false;
      try {
        await route(req, res, m[1], m[2]);
      } catch (e) {
        console.error('live:', e);
        if (!res.headersSent) send(res, 500, { error: 'server error' });
        else res.end();
      }
      return true;
    },
    stop() { for (const g of games.values()) halt(g); },
  };
}

let live: ReturnType<typeof createLive> | undefined;
export function handleLive(req: IncomingMessage, res: ServerResponse, makeLine: MakeLine): Promise<boolean> {
  return (live ??= createLive({ getRoom: defaultGetRoom, makeLine })).handle(req, res);
}
