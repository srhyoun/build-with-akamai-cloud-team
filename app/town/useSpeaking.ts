import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../../shared/types.ts';

const SHOW_MS = 3500;

export function useSpeaking(s: GameState): { id: string; text: string } | null {
  const [speaking, setSpeaking] = useState<{ id: string; text: string } | null>(null);
  const seen = useRef(s.feed.length);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const fresh = s.feed.slice(seen.current);
    seen.current = s.feed.length;
    const post = fresh.findLast(p => !p.to && s.characters.some(c => c.id === p.author));
    if (!post) return;
    setSpeaking({ id: post.author, text: post.text });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSpeaking(null), SHOW_MS);
  }, [s.feed.length]);

  useEffect(() => () => clearTimeout(timer.current), []);
  return speaking;
}
