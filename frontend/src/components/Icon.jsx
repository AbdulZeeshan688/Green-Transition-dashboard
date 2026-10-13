const PATHS = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  car: (
    <>
      <path d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11" />
      <rect x="3" y="11" width="18" height="6" rx="2" />
      <circle cx="7.5" cy="14" r="1" />
      <circle cx="16.5" cy="14" r="1" />
      <path d="M5.5 17v2M18.5 17v2" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h13l-2.5 4.5L18 13H5" />
    </>
  ),
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  fan: (
    <>
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 10.5C12 6 9.5 3.5 7.5 5S8 10 12 10.5zM13.5 12c4.5 0 7-2.5 5.5-4.5S14 8 13.5 12zM12 13.5c0 4.5 2.5 7 4.5 5.5S16 14 12 13.5zM10.5 12c-4.5 0-7 2.5-5.5 4.5S10 16 10.5 12z" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.5 17.5a8.5 8.5 0 1 1 15 0" />
      <path d="M12 13.5l4-4" />
    </>
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M3.5 10.5h6M14.5 10.5h6M12 14.5V21" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 11 11 5 20 4c0 9-6 15-14 15" />
      <path d="M5 19l7-7" />
    </>
  ),
  seat: <path d="M8 3.5c1.5 0 2.2 1 2.3 2.2L11 13h5a2 2 0 0 1 2 2v3H9.3a2 2 0 0 1-2-1.6L6 6c-.1-1.3.6-2.5 2-2.5z" />,
  seatHeat: (
    <>
      <path d="M8 3.5c1.5 0 2.2 1 2.3 2.2L11 13h5a2 2 0 0 1 2 2v3H9.3a2 2 0 0 1-2-1.6L6 6c-.1-1.3.6-2.5 2-2.5z" />
      <path d="M14 4c-1 1 1 2 0 3M17 4c-1 1 1 2 0 3M20 4c-1 1 1 2 0 3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
    </>
  ),
  power: (
    <>
      <path d="M12 3v8" />
      <path d="M6.3 6.8a8 8 0 1 0 11.4 0" />
    </>
  ),
  swap: <path d="M4 8h15l-3.5-3.5M20 16H5l3.5 3.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M8 20h8M5 7h14" />
      <path d="M5 7l-2.5 6h5zM19 7l-2.5 6h5z" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v4h-4" />
    </>
  ),
  arrowRight: <path d="M4 12h16M14 6l6 6-6 6" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  bluetooth: <path d="M7 7l10 10-5 4V3l5 4L7 17" />,
  signal: <path d="M5 20v-3M10 20v-7M15 20V9M20 20V5" />,
  user: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 18.5a6.5 6.5 0 0 1 11 0" />
    </>
  ),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />,
  volume: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
};

export default function Icon({ name, size = 20, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.grid}
    </svg>
  );
}
