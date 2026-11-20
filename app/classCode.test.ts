import { beforeEach, describe, expect, it } from 'vitest';
import { getClassCode, initialClassCode, setClassCode } from './classCode.ts';

describe('classCode', () => {
  beforeEach(() => {
    const m = new Map<string, string>();
    globalThis.localStorage = { getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k) } as Storage;
  });

  it('stores trimmed, upper case, ≤ 24 chars; empty clears it', () => {
    expect(setClassCode('  mrs lee 7b ')).toBe('MRS LEE 7B');
    expect(getClassCode()).toBe('MRS LEE 7B');
    expect(setClassCode('x'.repeat(30))).toHaveLength(24);
    setClassCode('  ');
    expect(getClassCode()).toBeNull();
  });

  it('a ?class= link wins over the stored code', () => {
    setClassCode('old');
    expect(initialClassCode('?class=7b')).toBe('7B');
    expect(initialClassCode('')).toBe('7B');
  });

  it('works without storage (private mode)', () => {
    globalThis.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } } as unknown as Storage;
    expect(getClassCode()).toBeNull();
    expect(setClassCode('7b')).toBe('7B');
  });
});
