// One short line under the round info that says what to do right now, with a link to the full how-to page.
import type { GameState } from '../../shared/types.ts';

const HINT: Partial<Record<GameState['phase'], (s: GameState) => string>> = {
  event: () => 'News just broke. Read what the town says.',
  discussion: s => s.tokens > 0
    ? `Tap a villager to ask them. ${s.tokens} check${s.tokens === 1 ? '' : 's'} left. Call a meeting to vote.`
    : 'Tap a villager to ask them. Call a meeting to vote.',
};

export function PhaseHint({ s }: { s: GameState }) {
  const hint = HINT[s.phase]?.(s);
  if (!hint) return null;
  return (
    <p className="tw-hint">
      <span aria-live="polite">{hint}</span>
      <a href="/howto.html" target="_blank" rel="noopener" aria-label="How to play (opens in a new tab)">?</a>
    </p>
  );
}
