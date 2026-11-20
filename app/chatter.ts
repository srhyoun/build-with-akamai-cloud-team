// Give each living account a turn before anyone gets a second public post.
export function createChatterOrder(random = Math.random) {
  const spoken = new Set<string>();
  let last: string | undefined;

  return (living: string[]): string | undefined => {
    if (living.length === 0) return undefined;

    let candidates = living.filter(id => !spoken.has(id));
    if (candidates.length === 0) {
      spoken.clear();
      candidates = living.length > 1 ? living.filter(id => id !== last) : living;
    }
    const speaker = candidates[Math.floor(random() * candidates.length)];
    spoken.add(speaker);
    last = speaker;
    return speaker;
  };
}
