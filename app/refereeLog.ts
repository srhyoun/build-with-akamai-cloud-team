// The referee log for the current game: every line's check, kept next to GameState (decision 002).
// A tiny store so the director can write and any screen can read without threading props through App.tsx.
import { useSyncExternalStore } from 'react';
import type { RefereeCheck } from '../shared/types.ts';

let log: RefereeCheck[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(f => f());

export function logCheck(c: RefereeCheck) { log = [...log, c]; emit(); }
export function resetRefereeLog() { log = []; emit(); }
export const getRefereeLog = () => log; // for POST /api/replays at game over
export const useRefereeLog = () => useSyncExternalStore(f => (listeners.add(f), () => listeners.delete(f)), getRefereeLog);
