// Class code (SPEC §16): typed on the start screen or taken from a teacher's `/?class=7B` link, kept on this device,
// sent with every saved game (app/share.ts) so the teacher sees the class at /stats.html?class=7B.
const KEY = 'wtb-class';

// Same rule as store/: trimmed, at most 24 characters. Upper case so "7b" and "7B" are one class.
export const normalizeClassCode = (code: string) => code.trim().toUpperCase().slice(0, 24);

export function getClassCode(): string | null {
  try { return localStorage.getItem(KEY) || null; } catch { return null; }
}

export function setClassCode(code: string): string {
  const c = normalizeClassCode(code);
  try { if (c) localStorage.setItem(KEY, c); else localStorage.removeItem(KEY); } catch { /* private mode: not remembered */ }
  return c;
}

// A `?class=` link wins over what was stored, so a student who scans the teacher's QR joins that class.
export function initialClassCode(search: string = location.search): string {
  const fromUrl = new URLSearchParams(search).get('class');
  return fromUrl !== null ? setClassCode(fromUrl) : getClassCode() ?? '';
}
