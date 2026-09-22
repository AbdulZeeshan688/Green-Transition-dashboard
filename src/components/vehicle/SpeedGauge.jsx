import { memo } from 'react'
import './SpeedGauge.css'

// Indicator lights per side of the speedo card. Turn signals sit on their own
// side (left turn = left, right turn = right); headlight centers on top.
// Turn signal state comes in from the caller (7/9 keys); headlight lights with
// the warning demo state. In the real car these flip from CAN signals.
function SpeedGauge({ speed = 0, gear = 'P', mode = 'IDLE', rpm = 0, odo = 0, alert = 'ok', turnSignal = null }) {
  const speedColor =
    speed < 60  ? '#22c55e' :
    speed < 120 ? '#f59e0b' :
                  '#ef4444'

  const displaySpeed = Math.round(speed)

  const modeLabel = mode === 'IDLE' ? 'IDLE' :
    mode === 'DRIVING' ? 'DRIVE' :
    mode === 'REGEN' ? 'REGEN' :
    mode === 'BRAKING' ? 'BRAKE' :
    mode === 'NEUTRAL' ? 'NEUTRAL' : '—'

  const modeColor = mode === 'REGEN' ? '#22c55e' :
    mode === 'BRAKING' ? '#ef4444' :
    mode === 'DRIVING' ? '#3b82f6' :
    '#4b5e7a'

  const odoKm = odo.toFixed(1)
  // Indicator state + colors. Turn signals are independent of the demo alert;
  // the headlight is tied to the warning demo state for now.
  const turnLeft  = { on: turnSignal === 'left',  color: '#22c55e' }
  const turnRight = { on: turnSignal === 'right', color: '#22c55e' }
  const headlight = { on: alert === 'warning',    color: '#e6eaf0' }

  return (
    <div className="speed-wrap">
      <div className={`speed-ind speed-ind-left${turnLeft.on ? ' blink' : ''}`} data-on={turnLeft.on ? '' : null} title="Left turn signal">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12H4" />
          <path d="M9 6l-5 6 5 6" />
        </svg>
      </div>

      <div className="speed-ind speed-ind-head" data-on={headlight.on ? '' : null} title="Headlight on">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14h2l6 6h-3a5 5 0 0 1-5-6Z" />
          <line x1="10" y1="13" x2="10" y2="6.5" />
          <line x1="14" y1="13" x2="14" y2="8" />
        </svg>
      </div>

      <div className={`speed-ind speed-ind-right${turnRight.on ? ' blink' : ''}`} data-on={turnRight.on ? '' : null} title="Right turn signal">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h17" />
          <path d="M15 6l5 6-5 6" />
        </svg>
      </div>
      <div className="speed-hud">
        <div className="speed-bar left" style={{ background: `linear-gradient(to top, ${speedColor}, transparent)` }} />
        <div className="speed-center">
          <div className="speed-number" style={{ color: speed > 0 ? speedColor : 'var(--text)' }}>
            {displaySpeed}
          </div>
          <div className="speed-unit">km/h</div>
          <div className="speed-odo">ODO {odoKm} km</div>
        </div>
        <div className="speed-bar right" style={{ background: `linear-gradient(to top, ${speedColor}, transparent)` }} />
      </div>
      <div className="speed-info">
        <div className="speed-info-item">
          <span className="speed-info-label">Gear</span>
          <span className="speed-info-value" style={{ color: '#22c55e' }}>{gear}</span>
        </div>
        <div className="speed-info-divider" />
        <div className="speed-info-item">
          <span className="speed-info-label">Mode</span>
          <span className="speed-info-value" style={{ color: modeColor }}>{modeLabel}</span>
        </div>
        <div className="speed-info-divider" />
        <div className="speed-info-item">
          <span className="speed-info-label">RPM</span>
          <span className="speed-info-value">{rpm}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(SpeedGauge)
