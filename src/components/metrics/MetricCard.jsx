import { memo } from 'react'
import './MetricCard.css'

// Trip telemetry: energyUsed (kWh), distanceDriven (km), duration (HH:MM),
// avgSpeed (km/h). Shows placeholders until the trip API is connected.
function MetricCard({ energyUsed, distanceDriven, duration, avgSpeed }) {
  const hasData = energyUsed !== undefined && energyUsed !== null

  return (
    <div className="trip-wrap">

      <div className="trip-header">
        <span className="trip-title">Trip Status</span>
        <span className="trip-time">
          {hasData ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      </div>

      <div className="trip-rows">
        <TripRow label="Energy Used"     value={hasData ? energyUsed     : '—'} unit="kWh"  />
        <TripRow label="Distance Driven" value={hasData ? distanceDriven : '—'} unit="km"   />
        <TripRow label="Duration"        value={hasData ? duration       : '—'} unit=""     />
        <TripRow label="Avg. Speed"      value={hasData ? avgSpeed       : '—'} unit="km/h" />
      </div>

    </div>
  )
}

export default memo(MetricCard)

function TripRow({ label, value, unit }) {
  return (
    <div className="trip-row">
      <span className="trip-row-label">{label}</span>
      <span className="trip-row-value">
        {value}
        {unit && <span className="trip-row-unit"> {unit}</span>}
      </span>
    </div>
  )
}