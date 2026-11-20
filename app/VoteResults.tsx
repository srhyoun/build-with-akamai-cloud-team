// [C3] The meeting's outcome as three screens inside the 10 s ejection phase: the result, your vote, everyone's votes.
import { useEffect, useState } from 'react';
import type { GameState } from '../shared/types.ts';
import { voteResult } from './voteResult.ts';
import { Villager } from './town/Villager.tsx';
import './vote-results.css';

const STEP_MS = 3200; // 3 screens fit in the engine's 10 s ejection phase

export interface Tally { target: string | null; votes: number; voters: string[]; top: boolean }

// One row per vote target (null = skip), most votes first; `top` marks the majority (all tied rows if it's a tie).
export function tallies(s: GameState): Tally[] {
  const rows = new Map<string | null, string[]>();
  for (const v of s.votes) rows.set(v.target, [...(rows.get(v.target) ?? []), v.voter]);
  const out = [...rows].map(([target, voters]) => ({ target, votes: voters.length, voters, top: false })).sort((a, b) => b.votes - a.votes);
  for (const t of out) t.top = t.votes === out[0].votes;
  return out;
}

export function VoteResults({ s, start = 0 }: { s: GameState; start?: number }) {
  const [step, setStep] = useState(start);
  useEffect(() => {
    if (step >= 2) return;
    const t = setTimeout(() => setStep(step + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step]);

  const who = (id: string | null) => s.characters.find(c => c.id === id);
  const name = (id: string) => id === 'you' ? 'You' : who(id)?.handle ?? id;
  const e = s.ejections.at(-1);
  const out = who(e?.id ?? null);
  const mine = s.votes.find(v => v.voter === 'you');
  const picked = who(mine?.target ?? null);

  return (
    <div className="overlay vr" role="dialog" aria-label="Vote results" onClick={() => setStep(n => Math.min(n + 1, 2))}>
      <ol className="vr-dots" aria-hidden="true">{[0, 1, 2].map(i => <li key={i} className={i === step ? 'on' : ''} />)}</ol>
      {step === 0 && (
        <section key="result" className="vr-screen">
          {out ? (
            <>
              <div className="vr-out"><Villager color={out.color} mood="tense" size={110} ejected /></div>
              <h2>{out.handle} was ejected.</h2>
              <p className={`vr-verdict ${e!.wasBot ? 'bot' : 'human'}`}>{e!.wasBot ? 'They were a Bot!' : 'They were not a Bot.'}</p>
            </>
          ) : (
            <>
              <div className="vr-empty" aria-hidden="true">🤷</div>
              <h2>Nobody was ejected.</h2>
            </>
          )}
        </section>
      )}
      {step === 1 && (
        <section key="mine" className="vr-screen">
          <h2>Your vote</h2>
          <div className="vr-pick">
            <span className="vr-you">You</span>
            <span className="vr-arrow" aria-hidden="true">→</span>
            {picked ? <span className="vr-target"><Villager color={picked.color} size={72} /><b>{picked.handle}</b></span>
              : <span className="vr-target vr-skip"><b>{mine ? 'Skip' : 'No vote'}</b></span>}
          </div>
          {mine && <p>{mine.target === (e?.id ?? null) ? 'The town went your way.' : 'The town voted differently.'}</p>}
        </section>
      )}
      {step === 2 && (
        <section key="all" className="vr-screen">
          <h2>Everyone's votes</h2>
          <ul className="vr-tally">
            {tallies(s).map(t => {
              const c = who(t.target);
              return (
                <li key={t.target ?? 'skip'} className={t.top ? 'top' : ''}>
                  {c ? <Villager color={c.color} size={44} /> : <span className="vr-skipdot" aria-hidden="true">⏭</span>}
                  <span className="vr-who"><b>{c?.handle ?? 'Skip'}</b><small>{t.voters.map(name).join(', ')}</small></span>
                  <span className="vr-n">{t.votes}</span>
                </li>
              );
            })}
          </ul>
          <p>{voteResult(s)}</p>
        </section>
      )}
      {step < 2 && <p className="vr-hint">Tap to skip ahead</p>}
    </div>
  );
}
