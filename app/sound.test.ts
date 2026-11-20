import { describe, expect, it } from 'vitest';
import { init } from '../game/engine.ts';
import type { GameState } from '../shared/types.ts';
import { beatMs, canPlay, pitchFor, play, setMuted, soundEvents, unlock } from './sound.ts';

const g = () => init(42, 1);
const clone = (s: GameState): GameState => structuredClone(s);

describe('sound', () => {
  it('gives each character a stable pitch, and the cast different ones', () => {
    const ids = g().characters.map(c => c.id);
    expect(ids.map(pitchFor)).toEqual(ids.map(pitchFor));
    expect(new Set(ids.map(pitchFor)).size).toBeGreaterThan(1);
    for (const id of ids) expect(pitchFor(id)).toBeGreaterThanOrEqual(220);
  });

  it('slows the ambience as infection rises, clamped', () => {
    expect(beatMs(0)).toBeLessThan(beatMs(50));
    expect(beatMs(50)).toBeLessThan(beatMs(100));
    expect(beatMs(150)).toBe(beatMs(100));
  });

  it('maps state changes to sounds', () => {
    const a = g(), b = clone(a), who = a.characters[0].id;
    b.feed.push({ id: 'x', author: who, text: 'did anyone else see this??', at: 1, round: 1 });
    b.feed.push({ id: 'y', author: 'news', text: 'BREAKING', at: 1, round: 1 });
    b.tokens--;
    b.phase = 'meeting';
    expect(soundEvents(a, b)).toEqual([{ kind: 'babble', who, syllables: 2 }, { kind: 'token' }, { kind: 'alarm' }]);
    const c = clone(b); c.phase = 'ejection';
    expect(soundEvents(b, c)).toEqual([{ kind: 'eject' }]);
    expect(soundEvents(c, c)).toEqual([]);
  });

  it('stays silent and never throws without AudioContext or before the first tap', () => {
    setMuted(false);
    expect(canPlay()).toBe(false);
    unlock(); // no AudioContext in the test env
    expect(canPlay()).toBe(false);
    expect(() => play({ kind: 'alarm' })).not.toThrow();
  });
});
