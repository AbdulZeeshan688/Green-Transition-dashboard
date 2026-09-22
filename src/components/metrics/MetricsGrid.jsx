import { memo, useEffect, useState } from 'react'
import './MetricsGrid.css'

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="metrics-clock-icon">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 4.5V8L10.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="metrics-bolt-icon">
      <path d="M6 1L3 9H7L6 15L13 6H9L10 1H6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}

// Props come from the route API: distanceKm (km), eta (duration text),
// avgEnergy (kWh/100km average consumption).
function MetricsGrid({ distanceKm, eta, avgEnergy }) {
  // `now` is kept in state and refreshed once per minute so the ETA stays
  // fresh while keeping the render pure (no Date.now() during render).
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Parse a Google Maps duration text like
  // "1 hour 23 mins", "45 mins", "2 hours", "1 day 3 hours" into minutes.
  function parseDuration(durationText) {
    if (!durationText) return null
    let minutes = 0

    const dayMatch   = durationText.match(/(\d+)\s*days?/)
    const hourMatch  = durationText.match(/(\d+)\s*(?:hours?|hrs?)/)
    const minMatch   = durationText.match(/(\d+)\s*(?:minutes?|mins?)/)

    if (dayMatch)  minutes += parseInt(dayMatch[1], 10) * 1440
    if (hourMatch) minutes += parseInt(hourMatch[1], 10) * 60
    if (minMatch)  minutes += parseInt(minMatch[1], 10)

    return minutes > 0 ? minutes : null
  }

  function getArrival(nowMs, durationText) {
    const minutes = parseDuration(durationText)
    if (minutes === null) return null
    return new Date(nowMs + minutes * 60000)
  }

  const arrival = getArrival(now, eta)
  const arrivalTime = arrival
    ? `${String(arrival.getHours()).padStart(2, '0')}:${String(arrival.getMinutes()).padStart(2, '0')}`
    : '--:--'
  const ampm = arrival
    ? (arrival.getHours() < 12 ? 'AM' : 'PM')
    : ''

  return (
    <div className="metrics-wrap">

      <div className="metrics-hero">
        <div className="metrics-hero-left">
          <div className="metrics-big-number">
            {distanceKm ?? '---'}
            <span className="metrics-big-unit">km</span>
          </div>
          <div className="metrics-big-label">Distance left</div>
        </div>

        <div className="metrics-arrival">
          <div className="metrics-arrival-top">
            <ClockIcon />
            <span className="metrics-arrival-time">
              {arrivalTime}
              {ampm && (
                <span className="metrics-arrival-ampm">{ampm}</span>
              )}
            </span>
          </div>
          <div className="metrics-arrival-label">
            {eta ? `Arrival · ${eta}` : 'No route'}
          </div>
        </div>
      </div>

      <div className="metrics-divider" />

      <div className="metrics-energy-row">
        <BoltIcon />
        <div>
          <div className="metrics-energy-value">
            {avgEnergy ?? '—'}
            <span className="metrics-energy-unit"> kWh/100km</span>
          </div>
          <div className="metrics-energy-label">Avg. energy to destination</div>
        </div>
      </div>

    </div>
  )
}

export default memo(MetricsGrid)