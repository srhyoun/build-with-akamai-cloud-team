import { useEffect, useState } from 'react';
import type { LeaderboardResponse } from '../store/replay.ts';
import { loadLeaderboard } from './share.ts';

export function Leaderboard({ highlightId, reloadKey }: { highlightId?: string; reloadKey?: unknown }) {
  const [data, setData] = useState<LeaderboardResponse | null | undefined>(undefined); // undefined = loading, null = failed
  useEffect(() => {
    let live = true;
    loadLeaderboard().then(d => { if (live) setData(d); });
    return () => { live = false; };
  }, [reloadKey]);

  if (data === null) return null;
  return (
    <section className="sh-board" aria-label="Global leaderboard">
      <h2>Global leaderboard</h2>
      {!data ? <p role="status">Loading the leaderboard…</p> : !data.entries.length ? <p>No games saved yet</p> : (
        <ol role="list">
          {data.entries.map((e, i) => (
            <li key={e.id} className={e.id === highlightId ? 'sh-me' : undefined} aria-current={e.id === highlightId ? 'true' : undefined}>
              <span className="sh-rank">{i + 1}</span>
              <span className="sh-name">{e.name}</span>
              <span className="sh-meta">{e.result} · {e.level === 3 ? 'boss level' : `level ${e.level}`}</span>
              <b>{e.score}</b>
            </li>
          ))}
        </ol>
      )}
      {data && <p className="sh-foot">{data.source === 'object-storage' ? 'Stored in Akamai Object Storage' : 'Stored locally (no Object Storage keys set)'}</p>}
    </section>
  );
}
