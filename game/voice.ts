// What a character says. buildPrompt() feeds the model (server/); scriptedLine() is the offline fallback.
import type { Character, Command, GameState } from '../shared/types.ts';
import { TACTICS } from './content.ts';
import { alive, rng } from './engine.ts';

export type LineKind = 'post' | 'reply' | 'defense';
export type Say = Extract<Command, { type: 'say' }>;

export function verdict(c: Character, s: GameState) {
  const truth = s.scenario.rounds[s.round - 1].truth;
  return c.role === 'bot' ? `no such source found. The official county page says: ${truth}` : `real source. It says: ${truth}`;
}

const name = (s: GameState, id: string) => id === 'you' ? 'the player' : id === 'news' ? 'NEWS ALERT' : s.characters.find(c => c.id === id)?.handle ?? id;

export function buildPrompt(s: GameState, c: Character, kind: LineKind) {
  const r = s.scenario.rounds[s.round - 1];
  const others = alive(s).filter(o => o.id !== c.id).map(o => o.handle).join(', ');
  const role = c.role === 'bot'
    ? `You are secretly a BOT account. You know the truth (${r.truth}) but you push this false story: "${r.falseStory}"
Your tactics: ${c.tactics.map(t => `${TACTICS[t].name}: ${TACTICS[t].prompt}`).join(' ')}
Your frame target is ${name(s, c.frameTarget ?? '')}. If someone accuses you, deny it calmly and turn suspicion on them.
Camouflage: make the odd typo and talk about your own life, because people wrongly think that proves you're human.
What the player has done so far: checked ${s.clues.map(k => name(s, k.target)).join(', ') || 'nobody'}; ejected ${s.ejections.map(e => name(s, e.id ?? 'nobody')).join(', ') || 'nobody'}. Adapt: if a tactic got caught, use a different one.`
    : `You are an ordinary person. What you heard: ${r.truth} You may misread or mix up details, make typos, or share something half true in good faith. Try to work out what's true; you may suspect people.`;
  const recent = s.feed.filter(p => !p.to || p.to === c.id).slice(-15).map(p => `${name(s, p.author)}${p.to ? ' (DM)' : ''}: ${p.text}`).join('\n');
  const ask = kind === 'defense' ? 'An emergency meeting was called. Give a one-line defense of yourself (bots: also cast doubt on your frame target).'
    : kind === 'reply' ? 'The player just DMed you. Reply to them directly.'
    : 'Write your next post in the group chat. React to what others said.';
  return [
    { role: 'system' as const, content: `You are ${c.handle} in a small-town group chat. ${c.bio}. Style: ${c.quirks}. Others here: ${others}.
${role}
Never say you are an AI or a bot. Keep it to 1–2 short sentences, like a real chat message.
Answer with JSON only: {"text": "...", "cited": "a source you cite, or null"}` },
    { role: 'user' as const, content: `Chat so far:\n${recent}\n\n${ask}` },
  ];
}

// Turns the model's raw answer into a say command. Falls back to the raw text if it isn't JSON.
export function parseLine(s: GameState, c: Character, raw: string, to?: string): Say {
  let text = raw.trim(), cited: string | null = null;
  try { const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)); text = String(j.text ?? text); cited = j.cited ? String(j.cited) : null; } catch { /* plain text answer */ }
  return { type: 'say', author: c.id, text, to, source: cited ? { cited, verdict: verdict(c, s) } : undefined };
}

// shortcut: canned lines so the game runs with no model; replace with model output once server/ has a key.
export function scriptedLine(s: GameState, c: Character, kind: LineKind, to?: string): Say {
  const r = rng(s.seed + s.feed.length * 31 + c.id.length);
  const round = s.scenario.rounds[s.round - 1];
  const target = s.characters.find(o => o.id === c.frameTarget);
  const typo = (t: string) => r() < 0.3 ? t.replace(/the /, 'teh ') : t;
  if (c.role === 'bot') {
    const tactic = c.tactics[Math.floor(r() * c.tactics.length)];
    if (kind === 'reply') return say(c, typo(`lol no. I just don't want anyone getting hurt. ${target ? `why aren't you asking ${target.handle}?` : ''}`), to);
    if (kind === 'defense') return say(c, typo(`I've lived here 20 years, I'm just trying to keep people safe. ${target ? `Ask ${target.handle} why they're so calm.` : ''}`), to, tactic);
    const lines: Record<string, string> = {
      fake_urgency: `${round.falseStory} SHARE NOW before it gets taken down`,
      invented_insider: `My cousin at the county office says: ${round.falseStory}`,
      emotional_outrage: `They KNEW and told no one!! ${round.falseStory}`,
      coordinated_amplification: `^ this. same thing here. ${round.falseStory}`,
      accusing_others: target ? `${target.handle} keeps saying it's fine... kind of suspicious? ${round.falseStory}` : round.falseStory,
      fake_consensus: `Everyone I know already left. ${round.falseStory}`,
    };
    const cites = tactic === 'fake_urgency' || tactic === 'fake_consensus';
    return { ...say(c, typo(lines[tactic]), to, tactic), source: cites ? { cited: 'a "County Alerts" screenshot', verdict: verdict(c, s) } : undefined };
  }
  if (kind === 'reply') return say(c, typo(oneOf(r, [`no?? I'm just trying to figure out what's real`, `huh? I only know what the county posted`, `not a bot lol. are YOU?`])), to);
  if (kind === 'defense') return say(c, typo(`I've been sharing what the county actually said! Check my posts.`), to);
  const lines = [
    `County page says ${round.truth.toLowerCase()}`,
    `wait is this real? anyone have a link?`,
    `${round.truth} at least that's what my neighbor said`,
    `ok I'm confused. who is saying the whole town has to leave??`,
  ];
  const line = lines[Math.floor(r() * lines.length)];
  return { ...say(c, typo(line), to), source: line.startsWith('County') ? { cited: 'the county website', verdict: verdict(c, s) } : undefined };
}

const oneOf = (r: () => number, xs: string[]) => xs[Math.floor(r() * xs.length)];
const say = (c: Character, text: string, to?: string, tactic?: Say['tactic']): Say => ({ type: 'say', author: c.id, text, to, tactic: c.role === 'bot' ? tactic : undefined });
