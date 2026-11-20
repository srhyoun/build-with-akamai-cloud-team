// Client for the replay store (store/). Every call answers null on failure: the game must keep working with no server.
import type { GameState, RefereeCheck } from '../shared/types.ts';
import type { LeaderboardResponse, ReplayResponse, SaveResponse } from '../store/replay.ts';
import { getClassCode } from './classCode.ts';

export function replayIdFromUrl(search: string = location.search): string | null {
  const id = new URLSearchParams(search).get('replay');
  return id && /^[a-f0-9]{12}$/.test(id) ? id : null;
}

async function json<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(url, init);
    return r.status === 200 ? await r.json() as T : null;
  } catch { return null; }
}

export function saveReplay(state: GameState, opts: { refereeLog?: RefereeCheck[]; playerName?: string | null; keepalive?: boolean } = {}): Promise<SaveResponse | null> {
  const body = JSON.stringify({ state, refereeLog: opts.refereeLog, playerName: opts.playerName ?? undefined, classCode: getClassCode() ?? undefined });
  // Browsers reject keepalive bodies over 64 KB; a bigger game is sent as a normal request instead of being lost.
  const keepalive = opts.keepalive && new Blob([body]).size < 60_000;
  return json('/api/replays', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive });
}

export const loadReplay = (id: string) => json<ReplayResponse>(`/api/replays/${id}`);
export const loadLeaderboard = () => json<LeaderboardResponse>('/api/leaderboard');
