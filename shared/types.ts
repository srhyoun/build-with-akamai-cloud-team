// The contract every module agrees on. Change only with a decision record (see .agents/CONTRACTS.md).

export type Role = 'human' | 'bot';
export type TacticId = 'fake_urgency' | 'invented_insider' | 'emotional_outrage' | 'coordinated_amplification' | 'accusing_others' | 'fake_consensus';
export type ToolId = 'account_age' | 'source_check' | 'posting_pattern';
export type Phase = 'event' | 'discussion' | 'meeting' | 'ejection' | 'over';

export interface Persona {
  handle: string;      // "@MikeR"
  bio: string;         // "Dad of three, posts fast, skims headlines"
  quirks: string;      // "Typos, shares before reading"
  color: string;       // avatar color
}

export interface Character extends Persona {
  id: string;          // handle without "@", lowercased
  role: Role;          // hidden from the player until ejected or game over
  tactics: TacticId[]; // bots only, 2–3
  frameTarget?: string;// bots only: the human they try to get voted out
  ejected: boolean;
  clues: { account_age: string; posting_pattern: string }; // pre-generated at setup
}

export interface Post {
  id: string;
  author: string;      // character id, or "you"
  text: string;
  at: number;          // game clock, ms
  round: number;
  to?: string;         // set = DM between the player and this character
  source?: { cited: string; verdict: string }; // what Source Check reveals
  tactic?: TacticId;   // tag for the post-round replay
}

export interface Clue { tool: ToolId; target: string; text: string; round: number }
export interface Vote { voter: string; target: string | null } // null = skip
export interface Ejection { round: number; id: string | null; wasBot: boolean }

export interface Scenario {
  id: string;
  rounds: { alert: string; truth: string; falseStory: string }[]; // one per round; later rounds escalate
}

export interface GameState {
  seed: number;
  level: 1 | 2;
  scenario: Scenario;
  round: number;          // 1..ROUNDS
  phase: Phase;
  clock: number;          // ms since game start
  phaseEndsAt: number;
  characters: Character[];
  feed: Post[];           // public posts and DMs
  tokens: number;         // Fact-Check Tokens left this round
  clues: Clue[];
  votes: Vote[];          // last meeting's votes
  ejections: Ejection[];
  infection: number;      // 0..100, town map spread
  result?: 'won' | 'lost';
}

// The only way to change the game. The engine never does I/O; the app turns these into state.
export type Command =
  | { type: 'tick'; dt: number }
  | { type: 'post'; text: string; to?: string }                                  // the player
  | { type: 'say'; author: string; text: string; to?: string; source?: Post['source']; tactic?: TacticId } // a character (scripted or model)
  | { type: 'use_tool'; tool: ToolId; target: string }                            // target: character id, or post id for source_check
  | { type: 'call_meeting' }
  | { type: 'vote'; target: string | null };
