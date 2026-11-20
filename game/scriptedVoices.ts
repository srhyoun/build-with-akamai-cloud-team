import type { LineKind } from './voice.ts';

// A character keeps the same conversational habits whichever role they draw.
const voices: ReadonlyMap<string, Record<LineKind, string>> = new Map([
  ['miker', { post: 'Between school pickups.', reply: 'sry, typing one-handed.', defense: 'My kids are asking too.' }],
  ['drsana', { post: 'Updating my earlier note.', reply: 'Thanks for checking with me.', defense: 'Let’s stick to what we can verify.' }],
  ['theoracle', { post: 'Word around town:', reply: 'People have been texting me too.', defense: 'My phone’s been buzzing all day.' }],
  ['jessb', { post: 'well, there goes my study break.', reply: 'yeah, my group chat is a mess too.', defense: 'okay, pause the pile-on.' }],
  ['townwatch', { post: 'NEIGHBORHOOD UPDATE:', reply: 'GOT YOUR MESSAGE.', defense: 'PLEASE KEEP THE CHAT ON TOPIC.' }],
  ['leopark', { post: 'Just got back to my phone.', reply: 'Hello, sorry for the slow reply.', defense: 'One moment, I’m catching up.' }],
  ['priyak', { post: 'Folks at the shop keep asking.', reply: 'Just served the last customer.', defense: 'People came in asking what to do.' }],
  ['coachdan', { post: 'Heads up, team!', reply: 'Good call checking in!', defense: 'Deep breath, everyone!' }],
  ['gretav', { post: 'A note for anyone catching up:', reply: 'I’m at the library desk.', defense: 'Look at the exact wording.' }],
  ['tomasfixes', { post: 'Quick update. On a job.', reply: 'hands full. voice text.', defense: 'Check the thread. Gotta get back to work.' }],
]);

export function withScriptedVoice(id: string, kind: LineKind, text: string): string {
  const lead = voices.get(id)?.[kind];
  return lead ? `${lead} ${text}` : text;
}
