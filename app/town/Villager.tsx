import { useId } from 'react';
import type { Mood } from './mood.ts';

const INK = '#2a2233';

function Face({ mood, ejected }: { mood: Mood; ejected?: boolean }) {
  const line = { fill: 'none', stroke: INK, strokeWidth: 2, strokeLinecap: 'round' as const };
  if (ejected) return <g {...line}><path d="M22 22h6M36 22h6M27 31q5-3 10 0" /></g>;
  if (mood === 'tense') return (
    <g>
      <circle cx="24.5" cy="21" r="4.6" fill="#fff" /><circle cx="39.5" cy="21" r="4.6" fill="#fff" />
      <circle cx="24.5" cy="21.5" r="1.9" fill={INK} /><circle cx="39.5" cy="21.5" r="1.9" fill={INK} />
      <ellipse cx="32" cy="31.5" rx="2.6" ry="3.2" fill={INK} />
      <path d="M51 6q5 7 0 9q-5-2 0-9z" fill="#9ad8ff" stroke="#fff" strokeWidth=".8" />
    </g>
  );
  return (
    <g>
      <circle cx="25" cy="21" r="2.4" fill={INK} /><circle cx="39" cy="21" r="2.4" fill={INK} />
      {mood === 'uneasy'
        ? <path {...line} d="M20 15l7-3M44 15l-7-3M26 30q3-3 6 0t6 0" />
        : <><path {...line} d="M25 27q7 7 14 0" /><circle cx="19.5" cy="27" r="3" fill="#ff8fa3" opacity=".55" /><circle cx="44.5" cy="27" r="3" fill="#ff8fa3" opacity=".55" /></>}
    </g>
  );
}

export function Villager({ color, mood = 'sunny', talking, size = 56, ejected }: { color: string; mood?: Mood; talking?: boolean; size?: number; ejected?: boolean }) {
  const shade = `tw${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const arm = ejected ? 4 : talking ? 150 : 22;
  const head = ejected ? 'rotate(10 32 40) translate(0 5)' : undefined;
  // Drawn twice: once in the character color, once with the highlight-to-shade gradient on top.
  const clay = (
    <>
      <rect x="21" y="68" width="9" height="21" rx="4.5" /><rect x="34" y="68" width="9" height="21" rx="4.5" />
      <rect x="11" y="43" width="9" height="23" rx="4.5" transform={`rotate(${arm} 15.5 47)`} />
      <rect x="44" y="43" width="9" height="23" rx="4.5" transform={`rotate(${-arm} 48.5 47)`} />
      <rect x="16" y="37" width="32" height="42" rx="16" />
      <circle cx="32" cy="22" r="18" transform={head} />
    </>
  );
  return (
    <svg className="tw-villager" viewBox="0 0 64 96" width={(size * 2) / 3} height={size} aria-hidden="true" style={ejected ? { filter: 'grayscale(1)', opacity: 0.7 } : undefined}>
      <defs>
        <radialGradient id={shade} cx=".3" cy=".22" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".5" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#1b1030" stopOpacity=".38" />
        </radialGradient>
      </defs>
      <ellipse cx="34" cy="90" rx="20" ry="4.5" fill="#1b1030" opacity=".22" />
      <g fill={color}>{clay}</g>
      <g fill={`url(#${shade})`}>{clay}</g>
      <g transform={head}><Face mood={mood} ejected={ejected} /></g>
    </svg>
  );
}
