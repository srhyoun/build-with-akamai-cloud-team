// [C4] The player's own villager, walkable during the news intermission: arrows / WASD, or tap the square. Visual only.
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Villager } from './Villager.tsx';
import './walker.css';

export interface Pos { x: number; y: number } // % of the scene: x from the left, y up from the bottom
const STEP = 4;
const KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, 1], w: [0, 1], ArrowDown: [0, -1], s: [0, -1],
};
// The walkable ground: the plaza, not the sky or the buildings.
export const clampPos = (p: Pos): Pos => ({ x: Math.min(95, Math.max(5, p.x)), y: Math.min(30, Math.max(0, p.y)) });

export function stepPos(p: Pos, key: string): Pos | null {
  const d = KEYS[key.length === 1 ? key.toLowerCase() : key];
  return d ? clampPos({ x: p.x + d[0] * STEP, y: p.y + d[1] * STEP }) : null;
}

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function Walker() {
  const [pos, setPos] = useState<Pos>({ x: 50, y: 6 });
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      setPos(p => {
        const next = stepPos(p, e.key);
        if (next) e.preventDefault(); // arrow keys would scroll the page
        return next ?? p;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tap = (e: PointerEvent<HTMLDivElement>) => {
    const r = layer.current!.getBoundingClientRect();
    setPos(clampPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((r.bottom - e.clientY) / r.height) * 100 }));
  };

  return (
    <div ref={layer} className="tw-walk" onPointerDown={tap} aria-hidden="true">
      <div className="tw-me" style={{ left: `${pos.x}%`, bottom: `${pos.y}%` }}>
        <Villager color="#f5b942" size={46} />
        <span className="tw-me-tag">You</span>
      </div>
    </div>
  );
}
