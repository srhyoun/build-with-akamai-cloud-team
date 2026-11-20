// Pure game engine: init(seed, level) → state, step(state, command) → new state.
// No I/O, no Date.now, no Math.random: same seed + same commands = same game.
import type { Character, Command, GameState, Post, TacticId, Vote } from '../shared/types.ts';
import { BOTS, CAST_SIZE, PERSONAS, PHASE_MS, ROUNDS, SCENARIOS, SPREAD, TACTICS, TOKENS_PER_ROUND } from './content.ts';

export function rng(seed: number) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
}
const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];
const shuffle = <T,>(r: () => number, xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const alive = (s: GameState) => s.characters.filter(c => !c.ejected);
export const aliveBots = (s: GameState) => alive(s).filter(c => c.role === 'bot');

export function init(seed: number, level: 1 | 2 = 2): GameState {
  const r = rng(seed);
  const cast = shuffle(r, PERSONAS).slice(0, CAST_SIZE);
  const botIdx = new Set(shuffle(r, cast.map((_, i) => i)).slice(0, BOTS[level]));
  const tacticPool = (Object.keys(TACTICS) as TacticId[]).filter(t => BOTS[level] > 1 || t !== 'coordinated_amplification');
  const characters: Character[] = cast.map((p, i) => ({
    ...p, id: p.handle.slice(1).toLowerCase(), role: botIdx.has(i) ? 'bot' : 'human',
    tactics: botIdx.has(i) ? shuffle(r, tacticPool).slice(0, 2 + Math.floor(r() * 2)) : [],
    ejected: false, clues: { account_age: '', posting_pattern: '' },
  }));
  const humans = characters.filter(c => c.role === 'human');
  const newcomer = pick(r, humans); // one honest new account, so Account Age alone never proves a bot
  for (const c of characters) {
    if (c.role === 'bot') {
      c.frameTarget = pick(r, humans).id;
      c.clues.account_age = r() < 0.5 ? `Joined ${2 + Math.floor(r() * 12)} days ago · ${5 + Math.floor(r() * 40)} followers` : `Joined 3 weeks ago · ${(2000 + Math.floor(r() * 8000)).toLocaleString('en-US')} followers, follows 0`;
      const other = characters.find(o => o.role === 'bot' && o !== c);
      c.clues.posting_pattern =
        c.tactics.includes('coordinated_amplification') && other ? `Posts within seconds of ${other.handle}, again and again.`
        : c.tactics.includes('emotional_outrage') ? 'Every post this week is angry or scary. Never answers a question.'
        : c.tactics.includes('accusing_others') ? 'Has called 4 people bots this week. Never linked any proof.'
        : 'Only posts about this story. Silent before today.';
    } else {
      c.clues.account_age = c === newcomer ? `Joined 2 months ago · ${40 + Math.floor(r() * 60)} followers (new in town)` : `Joined ${2012 + Math.floor(r() * 10)} · ${100 + Math.floor(r() * 900)} followers`;
      c.clues.posting_pattern = `Mixed posts: ${pick(r, ['school pickups', 'the farmers market', 'a lost cat', 'road work', 'the high school game'])}, ${pick(r, ['weather', 'local food', 'a town meeting', 'jokes'])}. Normal hours.`;
    }
  }
  const scenario = SCENARIOS[Math.floor(r() * SCENARIOS.length)];
  return {
    seed, level, scenario, round: 1, phase: 'event', clock: 0, phaseEndsAt: PHASE_MS.event,
    characters, feed: [alert(scenario.rounds[0].alert, 0, 1, 0)], tokens: TOKENS_PER_ROUND,
    clues: [], votes: [], ejections: [], infection: 0,
  };
}

const alert = (text: string, at: number, round: number, n: number): Post => ({ id: `p${n}`, author: 'news', text, at, round });

export function step(state: GameState, cmd: Command): GameState {
  if (state.phase === 'over') return state;
  const s: GameState = structuredClone(state);
  const add = (p: Omit<Post, 'id' | 'at' | 'round'>) => s.feed.push({ ...p, id: `p${s.feed.length}`, at: s.clock, round: s.round });
  switch (cmd.type) {
    case 'tick':
      s.clock += cmd.dt;
      while (s.phase !== 'over' && s.clock >= s.phaseEndsAt) advance(s);
      return s;
    case 'post':
      add({ author: 'you', text: cmd.text.slice(0, 280), to: cmd.to });
      return s;
    case 'say': {
      const c = s.characters.find(x => x.id === cmd.author);
      if (!c || c.ejected) return state;
      add({ author: c.id, text: cmd.text.slice(0, 280), to: cmd.to, source: cmd.source, tactic: cmd.tactic });
      return s;
    }
    case 'use_tool': {
      if (s.phase !== 'discussion' || s.tokens <= 0) return state;
      let text: string | undefined;
      if (cmd.tool === 'source_check') {
        const p = s.feed.find(x => x.id === cmd.target && x.author !== 'you' && x.author !== 'news');
        if (p) text = p.source ? `Cites ${p.source.cited}: ${p.source.verdict}` : 'Cites no source at all.';
      } else {
        text = s.characters.find(x => x.id === cmd.target)?.clues[cmd.tool];
      }
      if (!text) return state;
      s.tokens--;
      s.clues.push({ tool: cmd.tool, target: cmd.target, text, round: s.round });
      return s;
    }
    case 'call_meeting':
      if (s.phase !== 'discussion') return state;
      s.phase = 'meeting'; s.phaseEndsAt = s.clock + PHASE_MS.meeting; s.votes = [];
      return s;
    case 'vote':
      if (s.phase !== 'meeting') return state;
      resolveVote(s, cmd.target);
      return s;
  }
}

function advance(s: GameState) {
  if (s.phase === 'event') { s.phase = 'discussion'; s.phaseEndsAt += PHASE_MS.discussion; }
  else if (s.phase === 'discussion') { s.phase = 'meeting'; s.phaseEndsAt += PHASE_MS.meeting; s.votes = []; }
  else if (s.phase === 'meeting') resolveVote(s, null); // ran out of time: the player skips
  else if (s.phase === 'ejection') endRound(s);
}

// Everyone votes; the player's vote is one of them. Plurality ejects, a tie or skip-majority ejects nobody.
function resolveVote(s: GameState, playerTarget: string | null) {
  const r = rng(s.seed + s.round * 7919);
  const living = alive(s);
  const votes: Vote[] = [{ voter: 'you', target: playerTarget }];
  for (const c of living) {
    const others = living.filter(o => o.id !== c.id);
    let target: string | null;
    if (c.role === 'bot') target = living.some(o => o.id === c.frameTarget) ? c.frameTarget! : pick(r, others.filter(o => o.role === 'human'))?.id ?? null;
    else target = playerTarget && playerTarget !== c.id && r() < 0.5 ? playerTarget : r() < 0.2 ? null : pick(r, others).id;
    votes.push({ voter: c.id, target });
  }
  const tally = new Map<string | null, number>();
  for (const v of votes) tally.set(v.target, (tally.get(v.target) ?? 0) + 1);
  const sorted = [...tally].sort((a, b) => b[1] - a[1]);
  const out = sorted.length && (sorted.length === 1 || sorted[0][1] > sorted[1][1]) ? sorted[0][0] : null;
  const c = s.characters.find(x => x.id === out);
  if (c) c.ejected = true;
  s.votes = votes;
  s.ejections.push({ round: s.round, id: c?.id ?? null, wasBot: c?.role === 'bot' });
  s.phase = 'ejection'; s.phaseEndsAt = s.clock + PHASE_MS.ejection;
}

function endRound(s: GameState) {
  const wrong = s.ejections.at(-1)?.id && !s.ejections.at(-1)!.wasBot;
  s.infection = Math.min(100, s.infection + aliveBots(s).length * SPREAD.perBot + (wrong ? SPREAD.wrongEjection : 0));
  if (aliveBots(s).length === 0) { s.phase = 'over'; s.result = 'won'; return; }
  if (s.infection >= 100 || s.round >= ROUNDS) { s.phase = 'over'; s.result = 'lost'; return; }
  s.round++; s.tokens = TOKENS_PER_ROUND; s.phase = 'event'; s.phaseEndsAt = s.clock + PHASE_MS.event;
  s.feed.push(alert(s.scenario.rounds[s.round - 1].alert, s.clock, s.round, s.feed.length));
}
