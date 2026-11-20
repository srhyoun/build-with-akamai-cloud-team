// Pre/post quiz (SPEC §16): /quiz.html?phase=pre before playing, ?phase=post after, ?view=results for the room.
// Phone-first. The server scores answers (POST /api/quiz); answers and explanations show only after the post quiz.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TACTICS } from '../game/content.ts';
import { QUIZ, scoreQuiz, type Guess, type QuizAnswer } from '../game/quiz.ts';
import type { QuizResults } from '../db/db.ts';
import './style.css';
import './quiz.css';
import './town/theme.css'; // the town theme, loaded last so it wins over the page's own stylesheet

const SMALL_N = 30; // below this every number carries "small sample"
const pct = (x: number) => `${Math.round(x * 100)}%`;

function sessionId(): string {
  const make = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  try {
    const id = localStorage.getItem('wtb-quiz-session') ?? make();
    localStorage.setItem('wtb-quiz-session', id);
    return id;
  } catch { return make(); } // private mode: this visit only, so it won't pair with the other phase
}

const shuffled = <T,>(xs: T[]) => xs.map(x => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

type Sent = { correct: number; total: number; saved: boolean; note?: string };

function Take({ phase }: { phase: 'pre' | 'post' }) {
  const [order] = useState(() => shuffled(QUIZ));
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const item = order[answers.length];

  const answer = async (confidence: number) => {
    const next = [...answers, { itemId: item.id, guess: guess!, confidence }];
    setAnswers(next); setGuess(null);
    if (next.length < order.length) return;
    try {
      const res = await fetch('/api/quiz', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: sessionId(), phase, answers: next }) });
      if (res.ok) return setSent({ ...(await res.json()), saved: true });
      setSent({ ...scoreQuiz(next), saved: false, note: res.status === 503 ? 'No database connected, so this wasn’t saved.' : 'Couldn’t save your answers.' });
    } catch { setSent({ ...scoreQuiz(next), saved: false, note: 'Server unreachable, so this wasn’t saved.' }); }
  };

  if (item) return (
    <>
      <p className="quiz-progress" aria-live="polite">{answers.length + 1} of {order.length}</p>
      <article className="quiz-post">
        <b>{item.handle}</b>
        <p>{item.text}</p>
      </article>
      <div className="quiz-pick" role="group" aria-label="Bot or human?">
        {(['bot', 'human'] as const).map(g => (
          <button key={g} aria-pressed={guess === g} onClick={() => setGuess(g)}>{g === 'bot' ? '🤖 Bot' : '🙂 Human'}</button>
        ))}
      </div>
      {guess && (
        <div className="quiz-sure" role="group" aria-label="How sure are you?">
          <p>How sure are you?</p>
          <div>{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => answer(n)}>{n}</button>)}</div>
          <p className="quiz-scale"><span>guessing</span><span>certain</span></p>
        </div>
      )}
    </>
  );

  if (!sent) return <p className="quiz-note">Checking your answers…</p>;
  const mine = new Map(answers.map(a => [a.itemId, a.guess]));
  return (
    <>
      <p className="quiz-score">You got <b>{sent.correct} of {sent.total}</b> right.</p>
      {sent.note && <p className="quiz-note">{sent.note}</p>}
      {phase === 'pre' ? (
        <>
          <p>Now play a round of Who’s the Bot?, then take the same quiz again to see if you got better.</p>
          <a className="quiz-cta" href="/">Play Who’s the Bot?</a>
          <a className="quiz-link" href="?phase=post">I played, take the after-quiz</a>
        </>
      ) : (
        <>
          <ol className="quiz-review">
            {QUIZ.map(q => (
              <li key={q.id} className={mine.get(q.id) === q.answer ? 'right' : 'wrong'}>
                <span className="quiz-tag">{q.answer === 'bot' ? `BOT · ${TACTICS[q.tactic!].name}` : 'HUMAN'}</span>
                <b>{q.handle}</b> <span className="quiz-you">{mine.get(q.id) === q.answer ? '✓ you got it' : `✗ you said ${mine.get(q.id)}`}</span>
                <p>{q.text}</p>
                <p className="quiz-why">{q.why}</p>
              </li>
            ))}
          </ol>
          <a className="quiz-link" href="?view=results">See everyone’s results</a>
        </>
      )}
    </>
  );
}

const sample = (n: number) => n === 0 ? 'no answers yet' : `n = ${n}${n < SMALL_N ? ', small sample' : ''}`;

function Results() {
  const [r, setR] = useState<QuizResults | { error: string } | null>(null);
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const res = await fetch('/api/quiz/results');
        const body = await res.json().catch(() => ({}));
        if (alive) setR(res.ok ? body : { error: res.status === 503 ? 'No database connected yet.' : 'Database unavailable right now.' });
      } catch { if (alive) setR({ error: 'Server unreachable.' }); }
    };
    pull();
    const t = setInterval(pull, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!r) return <p className="quiz-note">Loading…</p>;
  if ('error' in r) return <p className="quiz-note">{r.error}</p>;
  const { pre, post, paired } = r;
  const change = paired.change == null ? null : Math.round(paired.change * 100);
  return (
    <>
      <dl className="quiz-tiles">
        <div><dt>Before playing</dt><dd>{pre.accuracy == null ? '–' : pct(pre.accuracy)}</dd><small>{sample(pre.n)}</small></div>
        <div><dt>After playing</dt><dd>{post.accuracy == null ? '–' : pct(post.accuracy)}</dd><small>{sample(post.n)}</small></div>
      </dl>
      <p className="quiz-callout">
        {change == null ? 'No one has taken both quizzes yet.' : <>
          People who took both went from <b>{pct(paired.pre!)}</b> to <b>{pct(paired.post!)}</b> right:{' '}
          <b>{change > 0 ? '+' : ''}{change} points</b> ({sample(paired.n)}).
        </>}
      </p>
      <p className="quiz-note">Accuracy = share of the 6 posts labeled correctly; a coin flip gets 50%. Same posts before and after, in a different order.</p>
    </>
  );
}

export function Quiz() {
  const q = new URLSearchParams(location.search);
  const view = q.get('view') === 'results' ? 'results' : q.get('phase') === 'post' ? 'post' : 'pre';
  return (
    <main className="quiz">
      <header>
        <h1>{view === 'results' ? 'Do players spot bots better?' : 'Bot or human?'}</h1>
        <p>{view === 'results' ? 'Quiz before and after playing Who’s the Bot?' : view === 'pre' ? 'Before you play: 6 posts from a small-town feed. Pick Bot or Human for each.' : 'After playing: the same 6 posts. Pick Bot or Human for each.'}</p>
      </header>
      {view === 'results' ? <Results /> : <Take phase={view} />}
      <footer>Answers saved in Akamai Managed PostgreSQL. No names, just a random id on this device.</footer>
    </main>
  );
}

const root = document.getElementById('quiz-root');
if (root) createRoot(root).render(<Quiz />);
