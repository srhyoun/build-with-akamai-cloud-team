// Town map (F5): the false story spreads district by district, starting by the river. Replaces the plain spread bar.
import './town-map.css';

// Spread order. Each district is an equal share of `infection` (0..100).
export const DISTRICTS = [
  { name: 'North', x: 0, y: 0, w: 96, h: 26 },
  { name: 'Riverside', x: 100, y: 0, w: 100, h: 26 },
  { name: 'Main St', x: 204, y: 0, w: 96, h: 26 },
  { name: 'School', x: 0, y: 34, w: 146, h: 26 },
  { name: 'South Hills', x: 150, y: 34, w: 150, h: 26 },
];

// 0..1: how much of district i the story has reached.
export const districtFill = (infection: number, i: number) => {
  const share = 100 / DISTRICTS.length;
  return Math.min(1, Math.max(0, (infection - i * share) / share));
};

export function TownMap({ infection }: { infection: number }) {
  return (
    <div className="town-map" role="meter" aria-label="Town infected" aria-valuenow={infection} aria-valuemin={0} aria-valuemax={100}
      aria-valuetext={`${infection}%: ${DISTRICTS.filter((_, i) => districtFill(infection, i) === 1).map(d => d.name).join(', ') || 'no district'} fully reached`}>
      <svg viewBox="0 0 300 60" aria-hidden="true">
        <path className="river" d="M0 30 C 40 24, 70 36, 110 30 S 190 24, 230 30 S 280 36, 300 30" />
        {DISTRICTS.map((d, i) => (
          <g key={d.name}>
            <rect className="district" x={d.x} y={d.y} width={d.w} height={d.h} rx="6" />
            <rect className="reached" x={d.x} y={d.y} width={d.w} height={d.h} rx="6" style={{ opacity: districtFill(infection, i) }} />
            <text x={d.x + d.w / 2} y={d.y + d.h / 2} dominantBaseline="central" textAnchor="middle">{d.name}</text>
          </g>
        ))}
      </svg>
      <span>Town infected {infection}%</span>
    </div>
  );
}
