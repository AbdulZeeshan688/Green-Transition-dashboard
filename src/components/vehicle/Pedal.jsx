import './Pedal.css'

// Pedal position (0-100) from the CAN bus / telemetry.
export function BrakePedal({ value = 0 }) {
  return <Pedal label="BRAKE" value={value} color="#ef4444" />
}

export function AccelPedal({ value = 0 }) {
  return <Pedal label="ACCEL" value={value} color="#22c55e" />
}

function Pedal({ label, value, color }) {
  const pct = Math.max(0, Math.min(100, value))

  return (
    <div className="pedal-wrap">
      <span className="pedal-label">{label}</span>
      <div className="pedal-body">
        <div className="pedal-ticks">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="pedal-tick" />
          ))}
        </div>
        <div
          className="pedal-fill"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(to top, ${color}, ${color}88)`,
            boxShadow: pct > 0 ? `0 0 16px ${color}55, inset 0 0 8px ${color}22` : 'none'
          }}
        />
        {pct > 0 && (
          <div
            className="pedal-glow-edge"
            style={{
              bottom: `${pct}%`,
              background: color,
              boxShadow: `0 0 8px ${color}`
            }}
          />
        )}
      </div>
      <span
        className="pedal-pct"
        style={{ color: pct > 0 ? color : 'var(--muted)' }}
      >
        {pct}%
      </span>
    </div>
  )
}