import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DISTRICTS, districtFill, TownMap } from './TownMap.tsx';

describe('TownMap', () => {
  it('fills districts in order, one equal share each', () => {
    expect(DISTRICTS.map((_, i) => districtFill(0, i))).toEqual([0, 0, 0, 0, 0]);
    expect(DISTRICTS.map((_, i) => districtFill(30, i))).toEqual([1, 0.5, 0, 0, 0]);
    expect(DISTRICTS.map((_, i) => districtFill(100, i))).toEqual([1, 1, 1, 1, 1]);
  });

  it('is a meter that names the districts fully reached', () => {
    const html = renderToStaticMarkup(<TownMap infection={40} />);
    expect(html).toContain('role="meter"');
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain('aria-valuetext="40%: North, Riverside fully reached"');
    expect(html).toContain('Town infected 40%');
  });
});
