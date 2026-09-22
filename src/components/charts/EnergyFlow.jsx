import { memo } from 'react'
import './EnergyFlow.css'

function BatteryIcon({ color }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="2" y="8" width="24" height="16" rx="3" stroke={color} strokeWidth="2"/>
      <rect x="26" y="12" width="4" height="8" rx="1.5" fill={color}/>
      <rect x="5" y="11" width="5" height="10" rx="1.5" fill={color} opacity="0.9"/>
      <rect x="12" y="11" width="5" height="10" rx="1.5" fill={color} opacity="0.6"/>
      <rect x="19" y="11" width="2" height="10" rx="1" fill={color} opacity="0.3"/>
    </svg>
  )
}

function MotorIcon({ color }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2"/>
      <circle cx="16" cy="16" r="5" stroke={color} strokeWidth="2"/>
      <line x1="16" y1="4"  x2="16" y2="8"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="24" x2="16" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="4"  y1="16" x2="8"  y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="16" x2="28" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="2" fill={color}/>
    </svg>
  )
}

function WheelIcon({ color }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" stroke={color} strokeWidth="2"/>
      <circle cx="16" cy="16" r="4"  stroke={color} strokeWidth="2"/>
      <line x1="16" y1="12" x2="16" y2="3"  stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="20" x2="16" y2="29" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="16" x2="3"  y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="16" x2="29" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="13" x2="7"  y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <line x1="19" y1="13" x2="25" y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <line x1="13" y1="19" x2="7"  y2="25" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <line x1="19" y1="19" x2="25" y2="25" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  )
}

// Motor data from the vehicle: motorPower (kW), motorTorque (Nm),
// mode ('IDLE' | 'DRIVING' | 'REGEN' | 'BRAKING' | 'NEUTRAL').
// Positive power = driving, negative = regen/braking.
function EnergyFlow({ motorPower = 0, motorTorque = 0, mode = 'IDLE' }) {
  const isRegen   = mode === 'REGEN'
  const isBraking = mode === 'BRAKING'
  const flowColor = isRegen ? '#22c55e' : isBraking ? '#ef4444' : '#3b82f6'

  const displayMode =
    mode === 'IDLE' ? 'IDLE' :
    mode === 'DRIVING' ? 'DRIVE' :
    mode === 'REGEN' ? 'REGEN' :
    mode === 'BRAKING' ? 'BRAKE' :
    mode === 'NEUTRAL' ? 'NEUTRAL' : '—'

  const absPower = Math.abs(motorPower)
  const absTorque = Math.abs(motorTorque)

  return (
    <div className="eflow-wrap">

      <div className="eflow-header">
        <span className="eflow-title">Power</span>
        <span className="eflow-mode" style={{ color: flowColor }}>
          {displayMode}
        </span>
      </div>

      {/* Flow diagram */}
      <div className="eflow-diagram">

        <div className="eflow-block">
          <BatteryIcon color={flowColor} />
          <div className="eflow-block-label">Battery</div>
        </div>

        <div className="eflow-arrow-wrap">
          <div className="eflow-arrow-track">
            <div className="eflow-arrow-fill" style={{ background: flowColor }} />
          </div>
          <span className="eflow-arrow-val" style={{ color: flowColor }}>
            {absPower} kW
          </span>
        </div>

        <div className="eflow-block">
          <MotorIcon color={flowColor} />
          <div className="eflow-block-label">Motor</div>
        </div>

        <div className="eflow-arrow-wrap">
          <div className="eflow-arrow-track">
            <div className="eflow-arrow-fill" style={{ background: flowColor }} />
          </div>
          <span className="eflow-arrow-val" style={{ color: flowColor }}>
            {absTorque} Nm
          </span>
        </div>

        <div className="eflow-block">
          <WheelIcon color={flowColor} />
          <div className="eflow-block-label">Wheel</div>
        </div>

      </div>

      {/* Stats */}
      <div className="eflow-stats">
        <EflowStat
          label="Motor Power"
          value={absPower}
          unit="kW"
          max={150}
          color={flowColor}
        />
        <EflowStat
          label="Motor Torque"
          value={absTorque}
          unit="Nm"
          max={400}
          color={flowColor}
        />
        {/* Efficiency usually comes from the motor controller */}
        <EflowStat
          label="Efficiency"
          value={mode === 'REGEN' ? 85 : mode === 'DRIVING' ? 94 : 0}
          unit="%"
          max={100}
          color="#22c55e"
        />
      </div>

    </div>
  )
}

export default memo(EnergyFlow)

function EflowStat({ label, value, unit, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="eflow-stat">
      <div className="eflow-stat-top">
        <span className="eflow-stat-label">{label}</span>
        <span className="eflow-stat-value" style={{ color }}>
          {value}
          <span className="eflow-stat-unit"> {unit}</span>
        </span>
      </div>
      <div className="eflow-stat-track">
        <div
          className="eflow-stat-fill"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 6px ${color}66`
          }}
        />
      </div>
    </div>
  )
}