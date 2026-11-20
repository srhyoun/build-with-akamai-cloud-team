import type { CSSProperties, ReactNode } from 'react';
import type { Mood } from './mood.ts';

const INK = '#2a2233';
const BEAK = '#ffab3d';

type Ears = 'cat' | 'round' | 'big' | 'long' | 'flop' | 'none';
type FacePiece = 'snout' | 'bignose' | 'pig' | 'bill' | 'beak' | 'frog';
type Mark = 'stripes' | 'patch' | 'patches' | 'muzzle' | 'discs';
type Outfit = 'shirt' | 'sweater' | 'overalls' | 'scarf';
type Kit = { ears: Ears; face: FacePiece; mark?: Mark; outfit: Outfit; cloth: string };

const KITS = {
  cat: { ears: 'cat', face: 'snout', mark: 'stripes', outfit: 'sweater', cloth: '#ffe9a8' },
  bear: { ears: 'round', face: 'snout', outfit: 'overalls', cloth: '#ffd9a0' },
  rabbit: { ears: 'long', face: 'snout', outfit: 'shirt', cloth: '#d9f7c8' },
  dog: { ears: 'flop', face: 'snout', mark: 'patch', outfit: 'scarf', cloth: '#ffd6e0' },
  duck: { ears: 'none', face: 'bill', outfit: 'scarf', cloth: '#bfe3ff' },
  frog: { ears: 'none', face: 'frog', outfit: 'overalls', cloth: '#ffe08a' },
  fox: { ears: 'cat', face: 'snout', mark: 'muzzle', outfit: 'scarf', cloth: '#c9f0e0' },
  mouse: { ears: 'big', face: 'snout', outfit: 'sweater', cloth: '#ffd6e0' },
  panda: { ears: 'round', face: 'snout', mark: 'patches', outfit: 'shirt', cloth: '#ffe9a8' },
  owl: { ears: 'none', face: 'beak', mark: 'discs', outfit: 'sweater', cloth: '#fff0b8' },
  pig: { ears: 'flop', face: 'pig', outfit: 'shirt', cloth: '#cfe8ff' },
  koala: { ears: 'big', face: 'bignose', outfit: 'shirt', cloth: '#fff0b8' },
} satisfies Record<string, Kit>;

export type Species = keyof typeof KITS;
const ALL = Object.keys(KITS) as Species[];

// One animal per game color (game/content.ts). The boss-level impostor copies the reporter's color, so it is the same animal on purpose.
const BY_COLOR: Record<string, Species> = {
  '#e5484d': 'pig', '#3e63dd': 'cat', '#8e4ec6': 'owl', '#f76b15': 'fox', '#ffc53d': 'duck', '#30a46c': 'frog',
  '#d6409f': 'rabbit', '#12a594': 'dog', '#978365': 'mouse', '#0090ff': 'bear', '#0d74ce': 'koala',
};

const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

export function speciesOf(color: string): Species {
  return BY_COLOR[color.toLowerCase()] ?? ALL[hash(color) % ALL.length]!;
}

const both = (el: ReactNode) => <>{el}<g transform="matrix(-1 0 0 1 64 0)">{el}</g></>;

export function Villager({ color, mood = 'sunny', talking, size = 56, ejected }: { color: string; mood?: Mood; talking?: boolean; size?: number; ejected?: boolean }) {
  const kit: Kit = KITS[speciesOf(color)];
  const light = `color-mix(in srgb, ${color} 35%, #fff)`;
  const dark = `color-mix(in srgb, ${color} 62%, #1b1030)`;
  const line = { fill: 'none', stroke: INK, strokeWidth: 2.4, strokeLinecap: 'round' as const };
  const frog = kit.face === 'frog';
  const ey = frog ? 19 : 35;                      // eye height
  const ex = frog ? 20 : 23;                      // left eye x (the right one is mirrored)
  const my = { snout: 46, bignose: 50, pig: 50, bill: 45, beak: 49, frog: 43 }[kit.face]; // mouth height
  const w = frog ? 10 : 5;
  const arm = ejected ? 6 : talking ? 118 : 22;   // 118: raised arms stick out past the head instead of hiding behind it
  const tense = mood === 'tense' && !ejected;

  const ears = {
    cat: both(<><path d="M9 30L12 5l18 12z" fill={color} /><path d="M14 22l1-10 8 6z" fill={light} /></>),
    round: both(<><circle cx="13" cy="19" r="8.5" fill={color} /><circle cx="13" cy="19" r="4.2" fill={light} /></>),
    big: both(<><circle cx="10" cy="21" r="12" fill={color} /><circle cx="10" cy="21" r="7" fill={light} /></>),
    long: both(<g transform="rotate(-8 21 24)"><ellipse cx="21" cy="14" rx="6.5" ry="13" fill={color} /><ellipse cx="21" cy="14" rx="3" ry="9" fill={light} /></g>),
    flop: null, // drawn over the head, below
    none: null,
  }[kit.ears];

  const cloth = {
    shirt: <rect x="21" y="55" width="22" height="16" rx="6" fill={kit.cloth} />,
    sweater: <><rect x="21" y="55" width="22" height="17" rx="6" fill={kit.cloth} /><rect x="21" y="62" width="22" height="4" fill="#fff" /></>,
    overalls: <><path d="M24.5 54v10M39.5 54v10" stroke={kit.cloth} strokeWidth="4" /><rect x="21" y="62" width="22" height="16" rx="7" fill={kit.cloth} /></>,
    scarf: <><rect x="35" y="58" width="7" height="12" rx="2.5" fill={kit.cloth} /><rect x="20" y="55" width="24" height="6.5" rx="3.2" fill={kit.cloth} /></>,
  }[kit.outfit];

  const mark = kit.mark && {
    stripes: <path d="M32 16v7M25 17.5v5M39 17.5v5" stroke={dark} strokeWidth="3" strokeLinecap="round" />,
    patch: <ellipse cx="41" cy="35" rx="7.5" ry="8.5" fill={dark} />,
    patches: both(<ellipse cx="23" cy="35" rx="7" ry="8" fill={dark} transform="rotate(12 23 35)" />),
    muzzle: <ellipse cx="32" cy="46.5" rx="14" ry="8.5" fill={light} />,
    discs: both(<circle cx="22.5" cy="35" r="8.5" fill={light} />),
  }[kit.mark];

  const piece = {
    snout: <><ellipse cx="32" cy="43.5" rx="8" ry="6" fill={light} /><ellipse cx="32" cy="40.5" rx="3" ry="2.2" fill={INK} /></>,
    bignose: <ellipse cx="32" cy="41" rx="4.6" ry="6" fill={INK} />,
    pig: <><ellipse cx="32" cy="42" rx="8" ry="5.5" fill={light} /><circle cx="29" cy="42" r="1.5" fill={INK} /><circle cx="35" cy="42" r="1.5" fill={INK} /></>,
    bill: <ellipse cx="32" cy="45" rx="11" ry="5.5" fill={BEAK} />,
    beak: <path d="M27.5 39h9l-4.5 7z" fill={BEAK} stroke={BEAK} strokeWidth="1.5" strokeLinejoin="round" />,
    frog: both(<><circle cx="20" cy="19" r="8.5" fill={color} /><circle cx="20" cy="19" r="5.8" fill="#fff" /></>),
  }[kit.face];

  const eyes = ejected
    ? <path {...line} d={`M${ex - 3} ${ey}q3 3 6 0M${61 - ex} ${ey}q3 3 6 0`} />
    : <g className="tw-v-eyes">{both(<>
        {tense && !frog && <circle cx={ex} cy={ey} r="5.2" fill="#fff" />}
        <circle cx={ex} cy={ey} r={tense ? 2.2 : 2.9} fill={INK} stroke={kit.mark?.startsWith('patch') ? '#fff' : undefined} strokeWidth="1.2" />
      </>)}</g>;

  const mouth = ejected ? <path {...line} d={`M27 ${my + 2}q5-4 10 0`} />
    : tense ? <ellipse cx="32" cy={my + 1} rx="2.3" ry="2.9" fill={INK} />
    : mood === 'uneasy' ? <path {...line} d={`M27 ${my}q2.5-2.5 5 0t5 0`} />
    : <path {...line} d={`M${32 - w} ${my}q${w} ${w * 0.9} ${w * 2} 0`} />;

  const style = { '--tw-blink': `${-(hash(color) % 37) / 10}s`, ...(ejected && { filter: 'grayscale(.7)', opacity: 0.65 }) } as CSSProperties;

  return (
    <svg className={`tw-villager${talking ? ' tw-v-talk' : ''}${ejected ? ' tw-v-out' : ''}`} viewBox="0 0 64 96" width={(size * 2) / 3} height={size} aria-hidden="true" overflow="visible" style={style}>
      <ellipse cx="32" cy="88.5" rx="18" ry="4" fill="#1b1030" opacity=".2" />
      <g className="tw-v-fig">
        <g fill={color}>
          <rect x="23" y="72" width="8" height="16" rx="4" /><rect x="33" y="72" width="8" height="16" rx="4" />
          <rect className="tw-v-arm" x="14" y="55" width="8" height="16" rx="4" transform={`rotate(${arm} 18 58)`} />
          <rect className="tw-v-arm" x="42" y="55" width="8" height="16" rx="4" transform={`rotate(${-arm} 46 58)`} />
          <rect x="21" y="52" width="22" height="26" rx="10" />
        </g>
        {cloth}
        <g className="tw-v-head" transform={ejected ? 'rotate(8 32 56) translate(0 3)' : undefined}>
          <g transform={ejected ? 'translate(0 6)' : undefined}>{ears}</g>
          <ellipse cx="32" cy="36" rx="24" ry="21" fill={color} />
          {kit.ears === 'flop' && both(<ellipse cx="9" cy="33" rx="6.5" ry="13" fill={dark} transform={`rotate(${ejected ? 4 : 14} 12 22)`} />)}
          {mark}
          {piece}
          {both(<circle cx="14.5" cy="43.5" r="4" fill="#ff8fa3" opacity=".7" />)}
          {mood === 'uneasy' && !ejected && <path {...line} d={`M${ex - 4} ${ey - 6}l6-2.5M${68 - ex} ${ey - 6}l-6-2.5`} />}
          {eyes}
          {mouth}
          {tense && <path d="M54 9q5 7 0 9q-5-2 0-9z" fill="#8fd3ff" stroke="#fff" strokeWidth=".8" />}
          {ejected && <path className="tw-v-tear" d={`M${ex} ${ey + 4}q3.5 5 0 6.5q-3.5-1.5 0-6.5z`} fill="#8fd3ff" stroke="#fff" strokeWidth=".8" />}
        </g>
      </g>
    </svg>
  );
}
