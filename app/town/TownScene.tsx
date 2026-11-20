import { useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { moodOf } from './mood.ts';
import { Villager } from './Villager.tsx';
import { Walker } from './Walker.tsx';
import './town.css';
import './scene-labels.css';

export interface SceneVillager { id: string; handle: string; color: string; ejected?: boolean }

const BUBBLE_MAX = 60;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
// Two staggered rows, so a long handle never runs into its neighbour's name tag.
const spot = (i: number, n: number) => ({ x: n < 2 ? 50 : 11 + (i * 78) / (n - 1), y: i % 2 ? 3 : 15 });

function sceneEdge(x: number, inset: number) {
  if (x < inset) return 'left';
  if (x > 100 - inset) return 'right';
}

const tree = (x: number, y: number, s = 1) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="3" cy="1" rx="13" ry="3" fill="#1b1030" opacity=".16" />
    <rect x="-2.5" y="-16" width="5" height="17" rx="2.5" fill="#a8734f" />
    <circle cx="0" cy="-26" r="13" fill="#5fb878" /><circle cx="-8" cy="-19" r="9" fill="#5fb878" /><circle cx="8" cy="-19" r="9" fill="#5fb878" />
    <circle cx="-3" cy="-29" r="9" fill="#86d893" /><circle cx="-9" cy="-21" r="5" fill="#86d893" />
  </g>
);

const bench = (x: number, y: number) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx="13" cy="8" rx="15" ry="2.5" fill="#1b1030" opacity=".16" />
    <rect x="2" y="2" width="2.5" height="6" rx="1" fill="#8a5a44" /><rect x="19.5" y="2" width="2.5" height="6" rx="1" fill="#8a5a44" />
    <rect x="0" y="-5" width="24" height="3.5" rx="1.7" fill="#d9a06c" /><rect x="0" y="0" width="24" height="3.5" rx="1.7" fill="#c98a5a" />
  </g>
);

const lamp = (x: number, y: number) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="tw-glow"><circle className="tw-flicker" cy="-34" r="20" fill="url(#tw-glow)" /></g>
    <rect x="-1.2" y="-32" width="2.4" height="33" rx="1.2" fill="#5b6072" /><rect x="-3.5" y="-1" width="7" height="3" rx="1.5" fill="#5b6072" />
    <circle className="tw-bulb" cy="-34" r="4" /><path d="M-5-37.5q5-5 10 0z" fill="#5b6072" />
  </g>
);

const cloud = (x: number, y: number, s: number, extra = '') => (
  <g className={`tw-drift ${extra}`}>
    <g className="tw-cloud" transform={`translate(${x} ${y}) scale(${s})`}>
      <g><circle cx="0" cy="0" r="9" /><circle cx="11" cy="-5" r="11" /><circle cx="24" cy="0" r="9" /><rect x="-8" y="0" width="40" height="9" rx="4.5" /></g>
    </g>
  </g>
);

const art = (
  <svg className="tw-svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice">
    <defs>
      <linearGradient id="tw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc8ff" /><stop offset=".6" stopColor="#cfeeff" /><stop offset="1" stopColor="#fff1cf" /></linearGradient>
      <linearGradient id="tw-grey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d5262" /><stop offset="1" stopColor="#9a8f96" /></linearGradient>
      <linearGradient id="tw-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff5a2e" stopOpacity="0" /><stop offset=".55" stopColor="#ff6a3d" stopOpacity=".75" /><stop offset="1" stopColor="#ff8a4a" stopOpacity=".25" /></linearGradient>
      <linearGradient id="tw-pave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3dfc0" /><stop offset="1" stopColor="#fbeedb" /></linearGradient>
      <linearGradient id="tw-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff6d8" stopOpacity=".75" /><stop offset=".3" stopColor="#fff6d8" stopOpacity="0" /><stop offset="1" stopColor="#1b1030" stopOpacity=".16" /></linearGradient>
      <radialGradient id="tw-glow"><stop offset="0" stopColor="#ffd36b" stopOpacity=".95" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient>
      <radialGradient id="tw-sunglow"><stop offset="0" stopColor="#fff3b0" stopOpacity=".9" /><stop offset="1" stopColor="#fff3b0" stopOpacity="0" /></radialGradient>
    </defs>

    <rect width="320" height="130" fill="url(#tw-sky)" />
    <rect className="tw-overcast" width="320" height="130" fill="url(#tw-grey)" />
    <g className="tw-sun"><circle cx="262" cy="30" r="34" fill="url(#tw-sunglow)" /><circle cx="262" cy="30" r="15" fill="#ffd95a" /><circle cx="258" cy="26" r="9" fill="#ffe98f" /></g>
    <rect className="tw-haze" width="320" height="130" fill="url(#tw-haze)" />
    {cloud(28, 26, 1)}{cloud(150, 16, 0.75)}{cloud(96, 44, 0.9, 'tw-storm')}{cloud(214, 40, 1.1, 'tw-storm')}

    <path d="M0 96Q50 62 110 90T230 84T320 80V130H0Z" fill="#b5e3a6" />
    <g transform="translate(58 -6)">
      <ellipse cx="60" cy="88" rx="11" ry="2.5" fill="#1b1030" opacity=".14" />
      <path d="M53 88l3-26M67 88l-3-26M60 88V62" stroke="#8d93a8" strokeWidth="2" strokeLinecap="round" />
      <rect x="48" y="42" width="24" height="22" rx="7" fill="#ff9d94" /><rect x="48" y="50" width="24" height="5" fill="#fff4e6" />
      <path d="M47 44q13-14 26 0z" fill="#e8726b" /><rect x="48" y="42" width="24" height="22" rx="7" fill="url(#tw-rim)" />
    </g>
    <path d="M0 108Q70 84 150 100T320 92V185H0Z" fill="#93d489" />
    <path d="M0 122Q160 112 320 122V185H0Z" fill="#a9de96" />

    <path d="M264 98C256 112 270 124 320 142V112C296 108 280 104 274 98Z" fill="#7fd0f2" />
    <path d="M268 104q6 4 12 3M286 118q10 4 20 5" stroke="#d6f3ff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M250 120Q279 92 310 110" stroke="#1b1030" strokeOpacity=".16" strokeWidth="5" fill="none" strokeLinecap="round" transform="translate(2 4)" />
    <path d="M250 120Q279 92 310 110" stroke="#e7d3bb" strokeWidth="7" fill="none" strokeLinecap="round" />
    <path d="M250 115Q279 87 310 105" stroke="#c9a987" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M258 108v6M270 100v6M284 97v6M298 99v6" stroke="#c9a987" strokeWidth="2" strokeLinecap="round" />
    {tree(312, 106, 0.6)}{tree(10, 124, 1.05)}{tree(238, 118, 0.7)}

    <g>
      <path d="M22 124h92l16 7H40z" fill="#1b1030" opacity=".14" />
      <rect x="28" y="78" width="76" height="46" rx="5" fill="#ffd9b8" />
      <rect className="tw-window" x="35" y="100" width="36" height="17" rx="3" /><path d="M53 100v17M35 108.5h36" stroke="#fff" strokeWidth="1.5" />
      <rect x="79" y="99" width="16" height="25" rx="3" fill="#9a6247" /><circle cx="91" cy="112" r="1.2" fill="#ffd95a" />
      <path d="M30 90h72v5q-4.5 5-9 0q-4.5 5-9 0q-4.5 5-9 0q-4.5 5-9 0q-4.5 5-9 0q-4.5 5-9 0q-4.5 5-9 0q-4.5 5-9 0z" fill="#fff" />
      <path d="M30 90h9v5q-4.5 5-9 0zM48 90h9v5q-4.5 5-9 0zM66 90h9v5q-4.5 5-9 0zM84 90h9v5q-4.5 5-9 0z" fill="#ff8f8f" />
      <rect x="28" y="78" width="76" height="46" rx="5" fill="url(#tw-rim)" />
      <path d="M36 60h60q4 0 6 4l8 14q2 5-4 5H26q-6 0-4-5l8-14q2-4 6-4z" fill="#f08a72" />
      <circle cx="66" cy="62" r="11" fill="#fff8ec" stroke="#c0734f" strokeWidth="2" />
      <path d="M60 60h10v4q0 5-5 5t-5-5z" fill="#c0734f" /><path d="M70 61q4 0 4 2.5t-4 2.5" stroke="#c0734f" strokeWidth="1.5" fill="none" /><path d="M63 57q-2-2 0-4M67 57q-2-2 0-4" stroke="#c0734f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>

    <g>
      <path d="M126 124h94l16 7H140z" fill="#1b1030" opacity=".14" />
      <rect x="130" y="76" width="82" height="44" fill="#f3ead7" />
      <rect className="tw-window" x="163" y="96" width="16" height="24" rx="8" />
      <path d="M171 52q3 0 6 2l42 19q4 3-1 4h-94q-5-1-1-4l42-19q3-2 6-2z" fill="#b9a6e0" />
      <path d="M171 71q-5-4-11-3v-7q6-1 11 3q5-4 11-3v7q-6-1-11 3z" fill="#fff8ec" /><path d="M171 64v7" stroke="#b9a6e0" strokeWidth="1" />
      {[136, 152, 184, 200].map(x => <rect key={x} x={x} y="79" width="7" height="40" rx="3" fill="#fffaf0" stroke="#dccfb6" strokeWidth=".8" />)}
      <rect x="130" y="76" width="82" height="44" fill="url(#tw-rim)" />
      <rect x="126" y="118" width="90" height="4" rx="2" fill="#e4d6bd" /><rect x="122" y="121" width="98" height="4" rx="2" fill="#d6c6aa" />
    </g>

    <path d="M-5 128Q130 120 252 128Q290 134 325 160V185H-5Z" fill="url(#tw-pave)" />
    <ellipse cx="150" cy="158" rx="118" ry="20" fill="none" stroke="#e6cfa8" strokeWidth="2" /><ellipse cx="150" cy="158" rx="78" ry="12" fill="#fff6e6" opacity=".6" />
    {bench(104, 127)}{bench(206, 127)}{lamp(118, 126)}{lamp(222, 126)}
    <rect className="tw-dusk" width="320" height="180" fill="#231a3d" />
  </svg>
);

export function TownScene({ cast, infection, speaking, view = 'ground', sunny, walk, children }: {
  cast: SceneVillager[]; infection: number; speaking?: { id: string; text: string } | null;
  view?: 'ground' | 'aerial'; sunny?: boolean; walk?: boolean; children?: ReactNode;
}) {
  const level = sunny ? 0 : clamp(infection, 0, 100);
  const mood = moodOf(level);

  useEffect(() => {
    if (view !== 'ground') return;
    document.documentElement.dataset.mood = mood;
    return () => { delete document.documentElement.dataset.mood; };
  }, [view, mood]);

  const talker = speaking ? cast.findIndex(c => c.id === speaking.id && !c.ejected) : -1;
  const at = talker >= 0 ? spot(talker, cast.length) : null;

  return (
    <div className="tw-scene" data-mood={mood} data-view={view} style={{ '--tw-mood': level / 100 } as CSSProperties}>
      {/* role="img" sits here, not on the root: it would hide the overlay button from screen readers. */}
      <div className="tw-camera" role="img" aria-label={`The town square. Mood: ${mood}.`}>
        <div className="tw-art" aria-hidden="true">
          {art}
          {cast.map((c, i) => {
            const { x, y } = spot(i, cast.length);
            return c.ejected
              ? <span key={c.id} className="tw-spot tw-gone" style={{ left: `${x}%`, bottom: `${y}%` }} />
              : (
                <div key={c.id} className={`tw-spot${i === talker ? ' tw-talking' : ''}`} style={{ left: `${x}%`, bottom: `${y}%`, zIndex: y > 10 ? 1 : 2, animationDelay: `${i * -0.37}s` }}>
                  <span className="tw-fig"><Villager color={c.color} mood={mood} talking={i === talker} size={46} /></span>
                  <span className="tw-name" data-edge={sceneEdge(x, 15)}>{c.handle}</span>
                </div>
              );
          })}
        </div>
        {walk && <Walker />}
        {speaking && at && (
          <div
            key={speaking.id + speaking.text}
            className="tw-say"
            data-edge={sceneEdge(at.x, 30)}
            aria-hidden="true"
            style={{
              '--tw-speaker-x': `${at.x}%`,
              bottom: `calc(${at.y}% + 58px * var(--tw-vs))`,
              transformOrigin: `${at.x}% 100%`,
            } as CSSProperties}
          >
            <span className="tw-tail" />
            <p className="tw-bubble">
              {speaking.text.length > BUBBLE_MAX ? `${speaking.text.slice(0, BUBBLE_MAX).trimEnd()}…` : speaking.text}
            </p>
          </div>
        )}
      </div>
      {children && <div className="tw-overlay">{children}</div>}
    </div>
  );
}
