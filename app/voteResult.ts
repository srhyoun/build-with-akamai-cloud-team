// Explains a meeting's outcome, so a player whose vote lost knows why (engine: plurality ejects, a tie or skip-majority ejects nobody).
import type { GameState } from '../shared/types.ts';

export function voteResult(s: GameState): string {
  const handle = (id: string | null) => id === null ? 'Skip' : s.characters.find(c => c.id === id)?.handle ?? id;
  const tally = new Map<string | null, number>();
  for (const v of s.votes) tally.set(v.target, (tally.get(v.target) ?? 0) + 1);
  const sorted = [...tally].sort((a, b) => b[1] - a[1]);
  const counts = sorted.map(([id, n]) => `${handle(id)} ${n}`).join(' · ');
  const out = s.ejections.at(-1)?.id ?? null;
  if (out) return `${handle(out)} got the most votes (${counts}).`;
  const mine = s.votes.find(v => v.voter === 'you')?.target ?? null;
  const [top, second] = sorted;
  if (top && second && top[1] === second[1]) {
    const tied = sorted.filter(([, n]) => n === top[1]).map(([id]) => handle(id)).join(' and ');
    return `It's a tie: ${tied} got ${top[1]} votes each (${counts}).`;
  }
  if (mine === null) return `You skipped, and most votes were to skip (${counts}).`;
  return `Most votes were to skip, so your vote for ${handle(mine)} wasn't enough (${counts}).`;
}
