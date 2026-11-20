// Live Tactics Stats (SPEC §16): what fools people, from every finished game in Akamai Managed PostgreSQL.
// Big-screen page at /stats.html; refreshes every 5 s. Shows real numbers only, always with n.
// /stats.html?class=7B: the same view for one class, plus average score and the player list (teacher view).
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { GlobalStats } from '../shared/types.ts';
import type { ClassStats } from '../db/db.ts';
import { TACTICS } from '../game/content.ts';
import './style.css';
import './stats.css';
import './town/theme.css'; // the town theme, loaded last so it wins over the page's own stylesheet

const MIN_N = 3; // below this a tactic shows "not enough data yet"
const pct = (x: number) => `${Math.round(x * 100)}%`;

type Load = { stats: GlobalStats | ClassStats; at: number } | { error: string };
const classCode = new URLSearchParams(location.search).get('class')?.trim() || null;

export function Stats() {
  const [load, setLoad] = useState<Load | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const res = await fetch(classCode ? `/api/stats/class/${encodeURIComponent(classCode)}` : '/api/stats/global');
        const body = await res.json().catch(() => ({}));
        if (alive) setLoad(res.ok ? { stats: body, at: Date.now() } : { error: res.status === 503 ? 'No database connected yet.' : 'Database unavailable right now.' });
      } catch { if (alive) setLoad({ error: 'Server unreachable.' }); }
    };
    pull();
    const a = setInterval(pull, 5000), b = setInterval(() => tick(n => n + 1), 1000);
    return () => { alive = false; clearInterval(a); clearInterval(b); };
  }, []);

  return (
    <main className="stats">
      <header>
        <h1>{classCode ? `Class ${classCode.toUpperCase()}: what fools you?` : 'What fools people?'}</h1>
        <p>{classCode ? `Live from every game played with class code ${classCode.toUpperCase()}.` : "Live from every game of Who's the Bot? played today."}</p>
      </header>
      {!load ? <p className="stats-note">Loading…</p> : 'error' in load ? <p className="stats-note">{load.error}</p> : <Board s={load.stats} />}
      <footer>Powered by Akamai Managed PostgreSQL{load && 'stats' in load ? ` · updated ${Math.max(0, Math.round((Date.now() - load.at) / 1000))} s ago` : ''}</footer>
    </main>
  );
}

function Board({ s }: { s: GlobalStats | ClassStats }) {
  if (s.gamesPlayed === 0) return <p className="stats-note">No finished games yet. Play one{'players' in s ? ' with this class code' : ''} and it shows up here.</p>;
  const enough = s.tactics.filter(t => t.uses >= MIN_N);
  const thin = s.tactics.filter(t => t.uses < MIN_N);
  const top = enough[0];
  return (
    <>
      <dl className="stats-tiles">
        <div><dt>Games played</dt><dd>{s.gamesPlayed}</dd></div>
        <div><dt>Players who won</dt><dd>{pct(s.winRate)}</dd></div>
        {'players' in s && <div><dt>Average score</dt><dd>{Math.round(s.avgScore)}</dd></div>}
        <div><dt>Average town infected</dt><dd>{Math.round(s.avgSpread)}%</dd></div>
        <div><dt>Ejections that hit a real person</dt><dd>{pct(s.humanFalseAccusationRate)}</dd></div>
      </dl>

      {top && (
        <p className="stats-callout">
          Most effective tactic: <b>{top.name}</b>. Bots that posted it survived <b>{pct(top.survivalRate)}</b> of those rounds (n = {top.uses} bot rounds).
          <span>{TACTICS[top.id].example ? `e.g. “${TACTICS[top.id].example}”` : ''}</span>
        </p>
      )}

      <section aria-label="Bot survival by tactic">
        <h2>How often a bot survived a round it used the tactic in</h2>
        <p className="stats-note">n = rounds where a bot posted the tactic in the town chat (tagged posts; DMs not counted).</p>
        {enough.length === 0 ? <p className="stats-note">Not enough rounds per tactic yet (need {MIN_N}).</p> : (
          <ol className="stats-bars">
            {enough.map(t => (
              <li key={t.id}>
                <span className="stats-name">{t.name}</span>
                <span className="stats-track" aria-hidden="true"><span style={{ width: pct(t.survivalRate) }} /></span>
                <span className="stats-val">{pct(t.survivalRate)} <small>n = {t.uses}</small></span>
              </li>
            ))}
          </ol>
        )}
        {thin.length > 0 && <p className="stats-note">Not enough data yet: {thin.map(t => `${t.name} (n = ${t.uses})`).join(', ')}.</p>}
      </section>

      {'players' in s && (
        <section aria-label="Players">
          <h2>Players ({s.players.length}{s.players.length === 100 ? ', top 100' : ''})</h2>
          <ol className="stats-players">
            {s.players.map((p, i) => (
              <li key={i}><span>{p.name || 'Anonymous'}</span><span>{p.result === 'won' ? 'found the bots' : 'lost the town'}</span><b>{p.score}</b></li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}

const root = document.getElementById('stats-root');
if (root) createRoot(root).render(<Stats />);
