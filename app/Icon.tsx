// Small line icons in place of emoji: they inherit the text colour and render the same on every device.
const PATHS = {
  search: 'M11 4a7 7 0 1 0 4.4 12.4l4.3 4.3 1.4-1.4-4.3-4.3A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z',
  eye: 'M12 5C6.5 5 2.7 9.4 1.5 12c1.2 2.6 5 7 10.5 7s9.3-4.4 10.5-7C21.3 9.4 17.5 5 12 5zm0 2c3.8 0 6.8 2.8 8.2 5-1.4 2.2-4.4 5-8.2 5s-6.8-2.8-8.2-5C5.2 9.8 8.2 7 12 7zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  vote: 'M4 13h16v7H4v-7zm2 2v3h12v-3H6zM9.3 4.3l1.4-1.4 5.7 5.7-4.3 4.3H8.9l-2.2-2.2 2.6-2.6L7.9 6.7l1.4-2.4z',
  book: 'M5 4h6a3 3 0 0 1 1 .2A3 3 0 0 1 13 4h6v15h-6a2 2 0 0 0-1 .3 2 2 0 0 0-1-.3H5V4zm2 2v11h4l.1.1V7a1 1 0 0 0-1-1H7zm10 0h-3a1 1 0 0 0-1 1v10.1l.1-.1H17V6z',
  question: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2.5a3.5 3.5 0 0 0-3.5 3.5h2a1.5 1.5 0 1 1 2.2 1.3c-1 .6-1.7 1.3-1.7 2.7v.5h2v-.4c0-.6.2-.8.8-1.2A3.5 3.5 0 0 0 12 6.5zM11 16h2v2h-2v-2z',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm4.2 3.8-2.6 5.8-5.8 2.6 2.6-5.8 5.8-2.6zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  sound: 'M4 9h4l5-4v14l-5-4H4V9zm12.5-1.5 1.4-1.4a8 8 0 0 1 0 11.8l-1.4-1.4a6 6 0 0 0 0-9z',
  mute: 'M4 9h4l5-4v14l-5-4H4V9zm11.3.7 1.4-1.4L19 10.6l2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3-2.3-2.3z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ verticalAlign: '-0.15em', flex: 'none' }}>
      <path d={PATHS[name]} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
