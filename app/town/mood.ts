export type Mood = 'sunny' | 'uneasy' | 'tense';

// cut-offs fit what the engine produces: one bot adds 20 a round, two add 40, so round 2 is uneasy and the end is tense
export const moodOf = (infection: number): Mood => (infection < 20 ? 'sunny' : infection < 60 ? 'uneasy' : 'tense');
