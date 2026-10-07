// Decorative SVG artwork (logo, steering wheel, road view, car silhouettes).

export function StarLogo({ size = 40 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <path d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z" fill="var(--green)" />
      <path d="M20 8 L22 18 L32 20 L22 22 L20 32 L18 22 L8 20 L18 18 Z" fill="var(--green-light)" opacity="0.7" />
    </svg>
  );
}

export function SteeringWheel({ angleDeg }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="steering-svg"
      style={{ transform: `rotate(${angleDeg}deg)` }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="rimGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#3a3f44" />
          <stop offset="100%" stopColor="#111416" />
        </radialGradient>
        <linearGradient id="spokeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9dde0" />
          <stop offset="100%" stopColor="#8b9298" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="86" fill="none" stroke="url(#rimGrad)" strokeWidth="20" />
      <path d="M22 104 Q60 92 74 110 L86 150 Q100 158 114 150 L126 110 Q140 92 178 104" fill="none" stroke="url(#spokeGrad)" strokeWidth="9" strokeLinecap="round" />
      <path d="M30 100 Q62 88 76 104 L88 146 Q100 152 112 146 L124 104 Q138 88 170 100 L168 116 Q140 106 130 122 L118 160 Q100 172 82 160 L70 122 Q60 106 32 116 Z" fill="#1d2124" />
      <circle cx="100" cy="104" r="30" fill="#24292d" stroke="#3a4045" strokeWidth="2" />
      <rect x="44" y="102" width="18" height="12" rx="4" fill="#2f3539" />
      <rect x="138" y="102" width="18" height="12" rx="4" fill="#2f3539" />
      <path d="M100 86 L103.5 100.5 L118 104 L103.5 107.5 L100 122 L96.5 107.5 L82 104 L96.5 100.5 Z" fill="var(--green-light)" />
    </svg>
  );
}

export function RoadView() {
  return (
    <svg viewBox="0 0 400 260" className="road-svg" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green-light)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path d="M200 0 L20 260 M200 0 L380 260" stroke="url(#fade)" strokeWidth="2" fill="none" />
      <path d="M200 0 L120 260 M200 0 L280 260" stroke="url(#fade)" strokeWidth="5" strokeDasharray="22 18" fill="none" />
      <path d="M194 6 L206 6 L232 200 L168 200 Z" fill="url(#beam)" />
    </svg>
  );
}

export function CarRear() {
  return (
    <svg viewBox="0 0 120 90" className="car-rear-svg" aria-hidden="true">
      <ellipse cx="60" cy="84" rx="54" ry="5" fill="#000" opacity="0.5" />
      <rect x="10" y="62" width="16" height="20" rx="4" fill="#15181a" />
      <rect x="94" y="62" width="16" height="20" rx="4" fill="#15181a" />
      <path d="M22 30 Q28 8 60 6 Q92 8 98 30 Z" fill="#7d858b" />
      <path d="M28 28 Q34 12 60 11 Q86 12 92 28 Z" fill="#1f2a30" />
      <rect x="8" y="28" width="104" height="46" rx="12" fill="#b9c0c5" />
      <rect x="8" y="40" width="104" height="8" fill="#2a1416" />
      <rect x="10" y="41" width="30" height="6" rx="2" fill="#e3342f" />
      <rect x="80" y="41" width="30" height="6" rx="2" fill="#e3342f" />
      <rect x="44" y="54" width="32" height="10" rx="2" fill="#e9ecee" />
    </svg>
  );
}

// Uses the vehicle's photo from vehicles.json ("image", relative to public/),
// falling back to the drawn silhouette for vehicles without one.
export function CarImage({ vehicle }) {
  if (!vehicle.image) return <CarSide />;
  return (
    <img
      className="car-photo"
      src={`${import.meta.env.BASE_URL}${vehicle.image}`}
      alt={`${vehicle.make} ${vehicle.model}`}
    />
  );
}

export function CarSide() {
  return (
    <svg viewBox="0 0 400 150" className="car-side-svg" aria-hidden="true">
      <ellipse cx="205" cy="140" rx="185" ry="7" fill="#000" opacity="0.12" />
      <path
        d="M18 108 Q20 84 58 77 L118 70 Q150 40 200 34 L272 34 Q312 39 346 66 L376 74 Q392 79 390 98 L388 112 Q386 120 374 120 L30 120 Q18 118 18 108 Z"
        fill="#f6f7f8"
        stroke="#c9ced2"
        strokeWidth="2"
      />
      <path d="M134 68 Q160 46 202 41 L266 41 Q296 46 322 68 Z" fill="#23292e" />
      <path d="M228 41 L232 68" stroke="#f6f7f8" strokeWidth="5" />
      <path d="M40 92 L380 92" stroke="#dfe3e6" strokeWidth="2" />
      <rect x="364" y="80" width="18" height="7" rx="2" fill="#d23c3c" />
      <rect x="20" y="88" width="16" height="6" rx="2" fill="#e8ecef" />
      {[95, 318].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="116" r="27" fill="#1b1f22" />
          <circle cx={cx} cy="116" r="17" fill="#c5cbcf" />
          <circle cx={cx} cy="116" r="5" fill="#4a5056" />
          {[0, 72, 144, 216, 288].map((a) => (
            <line
              key={a}
              x1={cx}
              y1="116"
              x2={cx + 15 * Math.cos((a * Math.PI) / 180)}
              y2={116 + 15 * Math.sin((a * Math.PI) / 180)}
              stroke="#5a6066"
              strokeWidth="3"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
