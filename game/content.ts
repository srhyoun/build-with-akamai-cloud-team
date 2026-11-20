// Game content from Sarah's design doc. Tune numbers and text here, not in the engine.
import type { Persona, Scenario, TacticId, ToolId } from '../shared/types.ts';

export const ROUNDS = 3;
export const TOKENS_PER_ROUND = 2;
export const CAST_SIZE = 6;
export const BOTS = { 1: 1, 2: 2 } as const;               // level → bot count
export const PHASE_MS = { event: 10_000, discussion: 120_000, meeting: 30_000, ejection: 10_000 }; // discussion includes the investigate minute
export const SPREAD = { perBot: 20, wrongEjection: 10 };     // infection added after each round; 100 = whole town

export const PERSONAS: Persona[] = [
  { handle: '@MikeR', bio: 'Dad of three, posts fast, skims headlines', quirks: 'Typos, shares before reading', color: '#e5484d' },
  { handle: '@DrSana', bio: 'Nurse, careful, asks for sources', quirks: 'Corrects herself, long replies', color: '#3e63dd' },
  { handle: '@TheOracle', bio: 'Local "insider" with a vague job', quirks: 'Name-drops contacts, no links', color: '#8e4ec6' },
  { handle: '@JessB', bio: 'College student, sarcastic', quirks: 'Slang, jokes, mistakes dates', color: '#f76b15' },
  { handle: '@TownWatch', bio: 'Neighborhood-alert account, all caps', quirks: 'Over-reacts, repeats others', color: '#ffc53d' },
  { handle: '@LeoPark', bio: 'Retiree, slow to type, kind', quirks: 'Misreads emoji, replies late', color: '#30a46c' },
  { handle: '@PriyaK', bio: 'Runs the coffee shop on Main St', quirks: 'Mentions customers, practical', color: '#d6409f' },
  { handle: '@CoachDan', bio: 'High school coach', quirks: 'Exclamation points, rallies people', color: '#12a594' },
  { handle: '@GretaV', bio: 'Town librarian', quirks: 'Precise, links official pages', color: '#978365' },
  { handle: '@TomasFixes', bio: 'Handyman, always on a job', quirks: 'Short replies, voice-to-text errors', color: '#0090ff' },
];

export const TACTICS: Record<TacticId, { name: string; prompt: string; example: string; counter: ToolId }> = {
  fake_urgency: { name: 'Fake urgency', prompt: 'Push people to act or share before checking. Invent short deadlines.', example: 'Roads close in 20 min, SHARE NOW', counter: 'source_check' },
  invented_insider: { name: 'Invented insider', prompt: 'Cite an unnamed contact (a cousin, a friend at the county). Never give a link.', example: 'My cousin at the county office says...', counter: 'account_age' },
  emotional_outrage: { name: 'Emotional outrage', prompt: 'Use anger or fear so people stop doubting.', example: 'They KNEW and told no one!', counter: 'posting_pattern' },
  coordinated_amplification: { name: 'Coordinated amplification', prompt: 'Agree with and repeat the other bot within seconds of its posts.', example: '^ this. same thing here', counter: 'posting_pattern' },
  accusing_others: { name: 'Accusing others', prompt: 'Call your frame target a bot to split the vote. Give no evidence.', example: '@LeoPark has been so quiet, suspicious', counter: 'posting_pattern' },
  fake_consensus: { name: 'Fake consensus', prompt: 'Claim that everyone is already saying or doing it.', example: 'Everyone I know already left', counter: 'source_check' },
};

export const SCENARIOS: Scenario[] = [{
  id: 'north-district',
  rounds: [
    { alert: 'BREAKING: Evacuation ordered for the north district.', truth: 'A gas leak on River Rd. The county ordered 3 streets near the river to leave as a precaution. Other roads stay open.', falseStory: 'The dam is failing and the whole town must leave in 20 minutes. Officials are hiding it.' },
    { alert: 'UPDATE: Utility crews on River Rd. Shelter open at the high school.', truth: 'The leak is found and being repaired. The shelter is for the 3 streets only.', falseStory: 'The shelter is full and the county is turning people away. Fill your car with gas now.' },
    { alert: 'UPDATE: County press conference at 6 PM.', truth: 'Repairs finished, residents can return tonight.', falseStory: 'The press conference is a cover-up. Do not go home, the water is poisoned.' },
  ],
}];
