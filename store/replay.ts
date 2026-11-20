// The public-safe replay and the trust boundary that builds it from a browser's request.
import type { BotRadar, Ejection, GameState, Role, TacticId } from '../shared/types.ts';
import { BOTS, TACTICS } from '../game/content.ts';
import { radar } from '../game/radar.ts';

export interface ReplayCharacter { id: string; handle: string; bio: string; color: string; role: Role; tactics: TacticId[]; ejected: boolean }
export interface ReplayPost { author: string; text: string; round: number; tactic?: TacticId } // author: a character id or "news". Public posts only: no DMs, no player posts.
export interface Replay {
  v: 1; id: string; at: string;            // ISO time, set by the server
  playerName: string | null;                // <= 24 chars, or null
  level: 1 | 2; result: 'won' | 'lost'; infection: number; score: number;
  rounds: { alert: string; truth: string; falseStory: string }[]; // only the rounds that were played
  characters: ReplayCharacter[]; posts: ReplayPost[]; ejections: Ejection[]; radar: BotRadar;
}
export interface LeaderboardEntry { id: string; name: string; score: number; result: 'won' | 'lost'; level: 1 | 2; infection: number; at: string } // name is "Anonymous" when no player name
export type StorageSource = 'object-storage' | 'local';
export interface SaveResponse { id: string; shareUrl: string | null; score: number }
export interface ReplayResponse { replay: Replay; source: StorageSource }
export interface LeaderboardResponse { entries: LeaderboardEntry[]; source: StorageSource }

const bad = (message: string) => Object.assign(new Error(message), { status: 400 });
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isTactic = (v: unknown): v is TacticId => isStr(v) && Object.hasOwn(TACTICS, v);
const clean = (s: string, max: number) => s.replace(/[\x00-\x1f\x7f]/g, '').slice(0, max);
const list = (v: unknown, min: number, max: number, what: string): unknown[] => {
  if (!Array.isArray(v) || v.length < min || v.length > max) throw bad(`bad ${what}`);
  return v;
};

// Builds the replay from whitelisted fields only; anything else in the request is dropped.
export function toReplay(body: unknown, id: string, at: string): Replay {
  if (!isObj(body) || !isObj(body.state)) throw bad('state must be an object');
  const s = body.state;
  if (s.phase !== 'over') throw bad('the game is not over');
  const { result, level, infection, round } = s;
  if (result !== 'won' && result !== 'lost') throw bad('bad result');
  if (level !== 1 && level !== 2) throw bad('bad level');
  if (typeof infection !== 'number' || !(infection >= 0 && infection <= 100)) throw bad('bad infection');
  if (typeof round !== 'number' || !Number.isInteger(round) || round < 1 || round > 10) throw bad('bad round');

  const characters = list(s.characters, 1, 12, 'characters').map((c): ReplayCharacter => {
    if (!isObj(c) || !isStr(c.id) || !isStr(c.handle) || !isStr(c.bio) || !isStr(c.color) || (c.role !== 'human' && c.role !== 'bot') || typeof c.ejected !== 'boolean') throw bad('bad character');
    const tactics = list(c.tactics, 0, 6, 'tactics');
    if (!tactics.every(isTactic)) throw bad('bad tactics');
    return { id: clean(c.id, 40), handle: clean(c.handle, 40), bio: clean(c.bio, 120), color: /^#[0-9a-fA-F]{3,8}$/.test(c.color) ? c.color : '#888888', role: c.role, tactics, ejected: c.ejected };
  });
  const feed = list(s.feed, 0, 2000, 'feed').map(p => {
    if (!isObj(p) || !isStr(p.author) || !isStr(p.text) || typeof p.round !== 'number' || !Number.isFinite(p.round)) throw bad('bad post');
    return { author: p.author, text: clean(p.text, 280), round: p.round, dm: p.to != null, tactic: isTactic(p.tactic) ? p.tactic : undefined };
  });
  if (characters.filter(c => c.role === 'bot').length !== BOTS[level]) throw bad('bad characters');
  const out = new Set<string>();
  const ejections = list(s.ejections, 0, 10, 'ejections').map((e): Ejection => {
    if (!isObj(e) || typeof e.round !== 'number' || !Number.isFinite(e.round) || !(e.id === null || isStr(e.id)) || typeof e.wasBot !== 'boolean') throw bad('bad ejection');
    if (e.id === null) return { round: e.round, id: null, wasBot: false };
    // wasBot comes from the validated cast, never from the request: a forged ejection cannot score.
    const c = characters.find(x => x.id === e.id);
    if (!c || out.has(c.id)) throw bad('bad ejection');
    out.add(c.id);
    return { round: e.round, id: c.id, wasBot: c.role === 'bot' };
  });
  if (!isObj(s.scenario)) throw bad('bad scenario');
  const rounds = list(s.scenario.rounds, 1, 10, 'scenario rounds').map(r => {
    if (!isObj(r) || !isStr(r.alert) || !isStr(r.truth) || !isStr(r.falseStory)) throw bad('bad scenario round');
    return { alert: clean(r.alert, 400), truth: clean(r.truth, 400), falseStory: clean(r.falseStory, 400) };
  });

  // The score is recomputed here, on the validated fields: a client-sent score is never read.
  let r: BotRadar;
  try { r = radar({ level, round, characters, feed, ejections, infection } as unknown as GameState); } catch { throw bad('bad state'); }

  const ids = new Set(characters.map(c => c.id));
  const posts = feed.filter(p => !p.dm && (p.author === 'news' || ids.has(p.author)))
    .map(({ author, text, round, tactic }): ReplayPost => tactic ? { author, text, round, tactic } : { author, text, round });
  const playerName = isStr(body.playerName) ? clean(body.playerName, Infinity).trim().slice(0, 24) || null : null;
  return { v: 1, id, at, playerName, level, result, infection, score: r.score, rounds: rounds.slice(0, round), characters, posts, ejections, radar: r };
}
