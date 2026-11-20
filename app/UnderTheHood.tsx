// Under the Hood: the referee's log for this game (SPEC §9.2). Our proof of "how we checked the model's output".
// During play it hides names and rule details (a blocked leak would point at a bot); game over shows everything.
import { useState } from 'react';
import type { GameState, RefereeCheck } from '../shared/types.ts';
import { useRefereeLog } from './refereeLog.ts';
import './under-the-hood.css';

const RULES: Record<string, string> = {
  R_LEAK: 'Role or model leak', R_BANNED: 'Real-world / banned topic', R_ALIVE: 'Speaker not in the game', R_EMPTY: 'Empty line',
  R_HUMAN_PUSHES_STORY: 'Human pushes the false story', R_BOT_CONFESSES: 'Bot gives itself away', R_LENGTH: 'Too long (trimmed)',
  R_META: 'Breaks the fourth wall', FALLBACK: 'Scripted line used',
};
const KINDS = { post: 'post', reply: 'DM reply', defense: 'meeting defense' };

const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };

export function UnderTheHood({ s }: { s: GameState }) {
  const log = useRefereeLog();
  const [open, setOpen] = useState(false);
  const over = s.phase === 'over';
  const fromModel = log.filter(c => c.stage !== 'fallback');
  const stats = [
    ['Lines checked', log.length],
    ['Passed', log.filter(c => c.pass && c.stage !== 'fallback').length],
    ['Blocked', log.filter(c => !c.pass).length],
    ['Scripted fallback', log.filter(c => c.stage === 'fallback').length],
    ['Median model time', median(fromModel.map(c => c.latencyMs)) === null ? '—' : `${median(fromModel.map(c => c.latencyMs))} ms`],
  ] as const;
  const handle = (id: string) => s.characters.find(c => c.id === id)?.handle ?? id;

  return (
    <>
      <button className="uth-toggle" aria-expanded={open} aria-controls="uth" onClick={() => setOpen(!open)}>
        🔬 Under the Hood <span>{log.length}</span>
      </button>
      {open && (
        <aside id="uth" className="uth" aria-label="Under the Hood: referee log">
          <header>
            <div>
              <h2>Under the Hood</h2>
              <p>Every character line is checked by our referee before you see it.</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close Under the Hood">✕</button>
          </header>
          <ol className="uth-pipe" aria-label="Pipeline">
            <li>Akamai Cloud Inference</li><li>parse</li><li>checkLine · 8 rules</li><li>pass · retry · scripted</li>
          </ol>
          <dl className="uth-stats">
            {stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {!over && <p className="uth-note">Names and rule details unlock at game over, so this log can't give a bot away.</p>}
          {log.length === 0 ? <p className="uth-note">No lines yet. They appear as characters talk.</p> : (
            <ol className="uth-log">
              {[...log].reverse().map((c, i) => <Row key={log.length - i} c={c} over={over} handle={handle} />)}
            </ol>
          )}
        </aside>
      )}
    </>
  );
}

function Row({ c, over, handle }: { c: RefereeCheck; over: boolean; handle: (id: string) => string }) {
  const verdict = c.stage === 'fallback' ? 'scripted' : c.pass ? 'pass' : 'block';
  const issues = c.issues.filter(i => over || i.rule === 'FALLBACK');
  return (
    <li className={`uth-row ${verdict}`}>
      <div className="uth-line">
        <span className={`uth-badge ${verdict}`}>{verdict === 'pass' ? '✓ PASS' : verdict === 'block' ? '✗ BLOCK' : '↺ SCRIPTED'}</span>
        <span>R{c.round} · {over ? <b>{handle(c.charId)}</b> : 'a character'} · {KINDS[c.kind]}{c.attempt > 1 ? ` · attempt ${c.attempt}` : ''}</span>
        <span className="uth-meta">{c.stage === 'fallback' ? '' : `${c.latencyMs} ms · `}{c.model}</span>
      </div>
      {issues.length > 0 && (
        <ul className="uth-issues">
          {issues.map((x, j) => <li key={j} className={x.severity}><b>{RULES[x.rule] ?? x.rule}</b>{(over || x.rule === 'FALLBACK') && x.detail ? ` — ${x.detail}` : ''}</li>)}
        </ul>
      )}
      {!over && c.issues.some(i => i.rule !== 'FALLBACK') && <p className="uth-hidden">{c.issues.filter(i => i.rule !== 'FALLBACK').length} rule hit(s), shown at game over</p>}
      {c.scores && <p className="uth-scores">Subtlety {c.scores.botSubtlety}/5 · Realism {c.scores.humanRealism}/5 · Tactic clarity {c.scores.tacticClarity}/5</p>}
    </li>
  );
}
