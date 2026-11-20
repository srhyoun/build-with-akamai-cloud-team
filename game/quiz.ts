// Pre/post quiz (SPEC §16): do people spot bots better after playing? Same 6 fictional posts before and after.
// Pure: the page shows the items, the server scores them (db/db.ts), so a client can't fake its score.
import type { TacticId } from '../shared/types.ts';

export type Guess = 'bot' | 'human';
export interface QuizItem { id: string; handle: string; text: string; answer: Guess; tactic?: TacticId; why: string }
export interface QuizAnswer { itemId: string; guess: Guess; confidence: number }

export const QUIZ: QuizItem[] = [
  { id: 'q1', handle: '@AlertNow_77', answer: 'bot', tactic: 'fake_urgency',
    text: 'Elm St bridge closes for GOOD in 15 min. SHARE before they take this down!!',
    why: 'Fake urgency: a tiny deadline and "share now", with no notice you could check.' },
  { id: 'q2', handle: '@RealTalkRon', answer: 'bot', tactic: 'invented_insider',
    text: 'My buddy at the water plant says the tap water is bad and they will sit on it till Friday. Can\'t say more.',
    why: 'Invented insider: an unnamed contact, no link, and a secret nobody else can confirm.' },
  { id: 'q3', handle: '@HometownHeidi', answer: 'bot', tactic: 'fake_consensus',
    text: 'Literally everyone on my street already packed up and left. Why are you all still home??',
    why: 'Fake consensus: "everyone is already doing it" so you act before you check.' },
  { id: 'q4', handle: '@tomsplumbing', answer: 'human',
    text: 'anyone kno if the libary is open sat? my kid has 3 books due b4 the fine kicks in lol',
    why: 'Human: typos, a small personal detail, a real question, and no push to share anything.' },
  { id: 'q5', handle: '@NanaJo', answer: 'human',
    text: 'I am so upset. Our dog slipped out during the storm and we still can\'t find her. Brown with one white paw. Please tell the animal shelter if you see her.',
    why: 'Human: strong feelings, but specific details you can check and nothing to believe or fear.' },
  { id: 'q6', handle: '@GreenGrocerAmy', answer: 'human',
    text: 'County page says the boil-water notice was lifted at 9 AM, notice BW-114. Still double-checking with the clinic before I tell customers.',
    why: 'Human: names a source you can look up and says what is still unconfirmed.' },
];

const BY_ID = new Map(QUIZ.map(q => [q.id, q]));

// One answer per item, each item exactly once. Throws on anything else (trust boundary: the request body).
export function scoreQuiz(answers: QuizAnswer[]): { correct: number; total: number } {
  if (!Array.isArray(answers) || answers.length !== QUIZ.length) throw new Error(`need ${QUIZ.length} answers`);
  const seen = new Set<string>();
  let correct = 0;
  for (const a of answers) {
    const item = BY_ID.get(a?.itemId);
    if (!item || seen.has(item.id)) throw new Error('unknown or repeated itemId');
    if (a.guess !== 'bot' && a.guess !== 'human') throw new Error('guess must be bot or human');
    if (!Number.isInteger(a.confidence) || a.confidence < 1 || a.confidence > 5) throw new Error('confidence must be 1-5');
    seen.add(item.id);
    if (a.guess === item.answer) correct++;
  }
  return { correct, total: QUIZ.length };
}
