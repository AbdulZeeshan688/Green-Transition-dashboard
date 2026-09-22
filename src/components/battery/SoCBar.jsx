import { memo } from 'react'
import './SoCBar.css'

// BMS data — batteryPct (0-100), batteryTemp (°C), estimatedRange (km).
// These are optional for now; the UI shows placeholders until wired to the BMS.
function SoCBar({ batteryPct, batteryTemp, estimatedRange, charging = false, timeToFull }) {
  // All three BMS fields must be present before we render live values —
  // otherwise a missing temp/range would show "undefined°C" / "undefined km".
  const hasData =
    batteryPct       !== undefined && batteryPct       !== null &&
    batteryTemp      !== undefined && batteryTemp      !== null &&
    estimatedRange   !== undefined && estimatedRange   !== null
  const pct = hasData ? Math.max(0, Math.min(100, batteryPct)) : 0
  const isCharging = charging === true
  const color =
    isCharging ? '#38bdf8' :
    hasData && pct > 50 ? '#22c55e' :
    hasData && pct > 20 ? '#f59e0b' :
               '#ef4444'
  const segments = 5
  const filledSegments = hasData ? Math.round((pct / 100) * segments) : 0

  const statusText = isCharging
    ? `Charging${timeToFull ? ` · ${timeToFull} to full` : ''}`
    : hasData ? (pct > 50 ? 'Normal' : pct > 20 ? 'Low' : 'Critical') : '—'

  return (
    <div className="soc-wrap">
      <div className="soc-top">
        <span className="soc-title">Battery</span>
        <span className="soc-pct" style={{ color: hasData ? color : 'var(--muted)' }}>
          {hasData ? `${pct}%` : '—'}
        </span>
      </div>
      {/* Battery icon */}
      <div className="soc-icon-wrap">
        <div className={`soc-icon-body ${isCharging ? 'soc-charging' : ''}`}>
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className="soc-segment"
              style={{
                background: i < filledSegments ? color : 'var(--surface)',
                borderRight: i < segments - 1 ? '2px solid var(--bg)' : 'none',
                transition: 'background 0.4s ease'
              }}
            />
          ))}
        </div>
        <div className="soc-icon-tip" style={{ background: hasData ? color : 'var(--border)', transition: 'background 0.4s ease' }} />
      </div>

      {/* Stats row */}
      <div className="soc-stats">
        <div className="soc-stat">
          <span className="soc-stat-label">Temperature</span>
          <span className="soc-stat-value">{hasData ? `${batteryTemp}°C` : '—'}</span>
        </div>
        <div className="soc-stat">
          <span className="soc-stat-label">Range</span>
          <span className="soc-stat-value">{hasData ? `${estimatedRange} km` : '—'}</span>
        </div>
        <div className="soc-stat">
          <span className="soc-stat-label">Status</span>
          <span className="soc-stat-value" style={{ color: hasData ? color : 'var(--muted)' }}>
            {statusText}
          </span>
        </div>
      </div>

    </div>
  )
}

export default memo(SoCBar)
