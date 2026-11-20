export type Mood = 'sunny' | 'uneasy' | 'tense';

// cut-offs fit what the engine produces: a 1-bot level plays its rounds at 0, 20-30, 40-60
export const moodOf = (infection: number): Mood => (infection < 20 ? 'sunny' : infection < 40 ? 'uneasy' : 'tense');
