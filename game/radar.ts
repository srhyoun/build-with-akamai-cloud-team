// Score + Bot Radar for the reveal screen and the saved replay (SPEC §11). Pure; templates, no model call.
import type { BotRadar, GameState, TacticId } from '../shared/types.ts';
import { TACTICS } from './content.ts';

export function radar(s: GameState): BotRadar {
  const bots = s.characters.filter(c => c.role === 'bot');
  const botsCaught = s.ejections.filter(e => e.id && e.wasBot).length;
  const humansEjected = s.ejections.filter(e => e.id && !e.wasBot).length;
  const finalSpread = s.infection;
  const score = 100 * botsCaught - 75 * humansEjected + (100 - finalSpread);

  const botPosts = s.feed.filter(p => p.tactic && bots.some(b => b.id === p.author));
  const tacticsSeen = [...new Set(botPosts.map(p => p.tactic!))];
  const roundsToFirstCatch = s.ejections.find(e => e.id && e.wasBot)?.round ?? null;

  // Rounds each bot stayed in: ejected in round r → survived r - 1; never ejected → every round played.
  const survived = (id: string) => { const e = s.ejections.find(x => x.id === id); return e ? e.round - 1 : s.round; };
  const longest = [...bots].sort((a, b) => survived(b.id) - survived(a.id))[0];
  let blindSpot: TacticId | null = null;
  if (longest && survived(longest.id) > 0) {
    // Its most-used tactic (tie → used last). Model lines may carry no tag: fall back to the bot's assigned tactics.
    const count = new Map<TacticId, number>();
    for (const p of botPosts) if (p.author === longest.id) count.set(p.tactic!, (count.get(p.tactic!) ?? 0) + 1);
    blindSpot = [...count].reduce<[TacticId, number] | null>((best, cur) => !best || cur[1] >= best[1] ? cur : best, null)?.[0] ?? longest.tactics[0] ?? null;
  }

  const n = longest ? survived(longest.id) : 0;
  const caughtAll = bots.length > 0 && botsCaught === bots.length;
  const headline = !blindSpot
    ? caughtAll ? `Clean sweep: every bot caught in round ${roundsToFirstCatch}.` : 'No bot tactics spotted.'
    : `Blind spot: ${TACTICS[blindSpot].name}. The bot pushing it ${s.ejections.some(e => e.id === longest.id) ? `survived ${n} round${n === 1 ? '' : 's'}` : 'was never caught'}.`;

  return { botsCaught, humansEjected, finalSpread, score, tacticsSeen, blindSpot, roundsToFirstCatch, headline };
}
