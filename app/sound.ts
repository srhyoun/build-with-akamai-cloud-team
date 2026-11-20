// [V4] Original sounds, all synthesized with the Web Audio API (no audio files).
// Silent until the player's first tap or key (browser autoplay rules), and safe when AudioContext is missing (tests, old browsers).
import { createElement, useEffect, useRef, useState } from 'react';
import type { GameState } from '../shared/types.ts';

export type SoundEvent = { kind: 'babble'; who: string; syllables: number } | { kind: 'token' | 'alarm' | 'eject' };

/** Base pitch (Hz) per character, stable for an id: 220–520 Hz. */
export function pitchFor(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 220 + (h % 13) * 25;
}

/** Ambience beat length (ms): 500 at a healthy town, 1100 when fully infected — slower, tenser. */
export const beatMs = (infection: number) => 500 + Math.min(100, Math.max(0, infection)) * 6;

/** What to play when the game goes from `prev` to `next`. */
export function soundEvents(prev: GameState, next: GameState): SoundEvent[] {
  const out: SoundEvent[] = [];
  const ids = new Set(next.characters.map(c => c.id));
  for (const p of next.feed.slice(prev.feed.length)) {
    if (ids.has(p.author)) out.push({ kind: 'babble', who: p.author, syllables: Math.min(6, Math.max(2, Math.ceil(p.text.length / 20))) });
  }
  if (next.tokens < prev.tokens) out.push({ kind: 'token' });
  if (next.phase !== prev.phase && next.phase === 'meeting') out.push({ kind: 'alarm' });
  if (next.phase !== prev.phase && next.phase === 'ejection') out.push({ kind: 'eject' });
  return out;
}

// --- audio output ---

const MUTE_KEY = 'wtb-muted';
let ctx: AudioContext | null = null;
let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } })();

/** Sound plays only after unlock() (first tap) and while not muted. */
export const canPlay = () => ctx !== null && ctx.state === 'running' && !muted;
export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* private mode */ }
}

/** Create/resume the AudioContext; call from a user gesture. */
export function unlock() {
  try {
    const AC = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch { ctx = null; }
}

// Listen from module load so the Start-screen tap (before the game mounts) already unlocks audio.
if (typeof addEventListener === 'function') for (const t of ['pointerdown', 'keydown']) addEventListener(t, unlock);

/** One enveloped oscillator note. */
function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, endFreq = freq) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  o.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(start); o.stop(start + dur + 0.02);
}

export function play(e: SoundEvent) {
  if (!canPlay()) return;
  try {
    const t = ctx!.currentTime;
    if (e.kind === 'babble') {
      // made-up syllables: short blips wobbling around the character's pitch
      const base = pitchFor(e.who);
      for (let i = 0; i < e.syllables; i++) {
        const f = base * (0.85 + Math.random() * 0.4);
        tone(f, t + i * 0.085, 0.07, 'triangle', 0.08, f * (0.9 + Math.random() * 0.25));
      }
    } else if (e.kind === 'token') {
      tone(880, t, 0.08, 'sine', 0.12); tone(1320, t + 0.07, 0.12, 'sine', 0.1);
    } else if (e.kind === 'alarm') {
      for (let i = 0; i < 3; i++) tone(660, t + i * 0.3, 0.22, 'square', 0.05, 440);
    } else {
      tone(392, t, 0.9, 'sawtooth', 0.06, 98); // falling whoosh-down
    }
  } catch { /* never break the game over a sound */ }
}

const CALM = [262, 294, 330, 392, 440];  // C major pentatonic
const TENSE = [262, 277, 311, 370, 415]; // darker, semitone-heavy set

function ambienceNote(beat: number, infection: number) {
  if (!canPlay()) return;
  try {
    const scale = infection > 50 ? TENSE : CALM;
    const f = scale[beat % 5 === 0 ? 0 : Math.floor(Math.random() * 5)] / (beat % 4 === 0 ? 2 : 1);
    tone(f, ctx!.currentTime, beatMs(infection) / 1000 * 0.9, 'sine', 0.025);
  } catch { /* ignore */ }
}

/** Plays babble/UI sounds on state changes and a soft ambience loop whose tempo follows infection. */
export function useGameSounds(s: GameState) {
  const prev = useRef(s);
  const live = useRef(s); live.current = s;
  useEffect(() => {
    for (const e of soundEvents(prev.current, s)) play(e);
    prev.current = s;
  }, [s]);
  useEffect(() => {
    let beat = 0, timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const st = live.current;
      if (st.phase !== 'over') ambienceNote(beat++, st.infection);
      timer = setTimeout(tick, beatMs(st.infection));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
}

/** Small mute toggle button. */
export function SoundToggle() {
  const [m, setM] = useState(isMuted);
  return createElement('button', {
    className: 'sound-toggle', 'aria-pressed': m, 'aria-label': m ? 'Unmute sound' : 'Mute sound', title: m ? 'Unmute sound' : 'Mute sound',
    onClick: () => { setMuted(!m); setM(!m); unlock(); },
  }, m ? '🔇' : '🔊');
}
