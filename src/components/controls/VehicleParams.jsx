import { memo, useState, useEffect, useRef } from 'react'
import './VehicleParams.css'

// CO2 saved per km vs. a comparable ICE vehicle. A real figure can be
// pulled from the vehicle's environmental data endpoint.
const CO2_PER_KM = 120

// speed (km/h) and mode come from telemetry. The trip totals below are
// stubbed locally until the backend provides them.
function VehicleParams({ speed = 0, mode = 'IDLE' }) {
  const [running, setRunning]   = useState(false)
  const [elapsed, setElapsed]   = useState(0)
  const [distance, setDistance] = useState(0)
  const [co2Saved, setCo2Saved] = useState(0)

  // Keep the latest speed in a ref so the trip timer interval only
  // depends on `running` — no teardown/recreate on every speed change.
  const speedRef = useRef(speed)
  useEffect(() => {
    speedRef.current = speed
  })

  // Local trip accumulator. Backend will supply totalDistance, totalTime,
  // and co2Saved once telemetry is connected.
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setElapsed(e => e + 1)
      setDistance(d => {
        const newD = parseFloat((d + speedRef.current / 3600).toFixed(2))
        setCo2Saved(Math.round(newD * CO2_PER_KM))
        return newD
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  function handleStart()  { setRunning(true) }
  function handleStop()   { setRunning(false) }
  function handleReset()  { setRunning(false); setElapsed(0); setDistance(0); setCo2Saved(0) }

  const modeLabel =
    mode === 'DRIVING' ? 'Drive' :
    mode === 'REGEN' ? 'Regen' :
    mode === 'BRAKING' ? 'Brake' :
    mode === 'NEUTRAL' ? 'Neutral' :
    'Idle'

  return (
    <div className="sim-wrap">

      <div className="sim-header">
        <span className="sim-title">Simulation</span>
        <div className={`sim-status-pill ${running ? 'running' : 'stopped'}`}>
          <div className="sim-status-dot" />
          {running ? 'Running' : 'Stopped'}
        </div>
      </div>

      {/* Row 1: Speed · Time · Distance */}
      <div className="sim-row">
        <SimItem label="Speed" value={`${Math.round(speed)} km/h`} />
        <SimItem label="Time"  value={formatTime(elapsed)} />
        <SimItem label="Dist"  value={`${distance.toFixed(1)} km`} />
      </div>

      <div className="sim-divider" />

      {/* Row 2: Mode · Energy · Regen */}
      <div className="sim-row">
        <SimItem label="Mode"   value={modeLabel} />
        {/* Wire up to live avg consumption (kWh/100km) when available */}
        <SimItem label="Energy" value="—" />
        {/* Wire up to live regen recovery (kWh/100km) when available */}
        <SimItem label="Regen"  value="—" />
      </div>

      <div className="sim-divider" />

      {/* Row 3: CO₂ Saved — highlighted impact badge */}
      <div className="sim-co2-row">
        <div className="sim-co2-badge">
          <svg className="sim-co2-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 14C5 11.2 2.8 8.4 2.8 6A3.4 3.4 0 0 1 8 3.2A3.4 3.4 0 0 1 13.2 6c0 2.4-2.2 5.2-5.2 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M8 7v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <div className="sim-co2-text">
            <span className="sim-co2-value">{co2Saved.toLocaleString()}</span>
            <span className="sim-co2-unit">g</span>
            <span className="sim-co2-label">CO₂ saved</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="sim-btn-row">
        {running ? (
          <button className="sim-btn sim-btn-stop" onClick={handleStop}>■ Stop</button>
        ) : (
          <button className="sim-btn sim-btn-start" onClick={handleStart}>▶ Start</button>
        )}
        <button className="sim-btn sim-btn-reset" onClick={handleReset}>↺ Reset</button>
      </div>

    </div>
  )
}

export default memo(VehicleParams)

function SimItem({ label, value }) {
  return (
    <div className="sim-item">
      <span className="sim-item-label">{label}</span>
      <span className="sim-item-value">{value}</span>
    </div>
  )
}