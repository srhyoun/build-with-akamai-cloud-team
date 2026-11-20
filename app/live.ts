// A room's shared live game: the server runs it, this hook polls it and sends the player's actions.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Command, GameState } from '../shared/types.ts';
import type { LiveView } from '../rooms/live.ts';
import type { RoomSession } from './room.ts';
import { fetchLive, sendLive, startLive } from './room.ts';

// The whole team shares the engine's one "you" seat: a teammate's post is shown under their name, this player's stays "you".
export function liveState(view: LiveView, me: string): GameState {
  return {
    ...view.state,
    feed: view.state.feed.map(p => {
      const by = p.author === 'you' ? view.posters[p.id] : undefined;
      return by && by !== me ? { ...p, author: by } : p;
    }),
  };
}

export function useLiveGame(session: RoomSession | null): { state: GameState; dispatch: (c: Command) => void; view: LiveView } | null {
  const on = session?.live === true, code = session?.code, name = session?.name;
  const [view, setView] = useState<LiveView | null>(null);
  // Never go backwards: a slow poll can land after the answer to a newer command. A finished game stays on screen
  // (the results) when a teammate starts the next one; a different seed is that next game.
  const apply = useCallback((v: LiveView | null) => {
    if (v) setView(prev => !prev ? v : prev.state.phase === 'over' ? prev : prev.state.seed !== v.state.seed || v.version > prev.version ? v : prev);
  }, []);

  useEffect(() => {
    if (!on || !code || !name) return;
    let mounted = true;
    const poll = () => { fetchLive({ code, name }).then(v => { if (mounted) apply(v); }); };
    startLive({ code, name }).then(v => { if (mounted) apply(v); }); // joins the running game; after a finished one ("Play again") it starts the next
    const t = setInterval(poll, 1000);
    return () => { mounted = false; clearInterval(t); };
  }, [on, code, name, apply]);

  const state = useMemo(() => view && name ? liveState(view, name) : null, [view, name]);
  const dispatch = useCallback((c: Command) => {
    if (!code || !name || c.type === 'tick' || c.type === 'say') return; // the server runs the clock and the villagers
    sendLive({ code, name }, c).then(apply);
  }, [code, name, apply]);

  return on && view && state ? { state, dispatch, view } : null;
}
