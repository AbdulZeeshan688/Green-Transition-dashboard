import { memo } from 'react'
import './BatteryStats.css'
import carGreen from '../../assets/car-green.png'
import carYellow from '../../assets/car-yellow.png'
import carRed from '../../assets/car-red.png'

const STATUS_MAP = {
  normal:  { img: carGreen,  color: '#22c55e', label: 'Normal' },
  warning: { img: carYellow, color: '#f59e0b', label: 'Warning' },
  error:   { img: carRed,    color: '#ef4444', label: 'Error' }
}

const STATUS_COLORS = {
  normal:  { color: '#22c55e', label: 'Ready' },
  warning: { color: '#f59e0b', label: 'Warning' },
  error:   { color: '#ef4444', label: 'Fault' },
  off:     { color: '#4b5e7a', label: 'Off' },
}

// Overall vehicle health comes from the CAN bus: vehicleStatus
// ('normal' | 'warning' | 'error') plus a systems array of
// { label, status: 'normal' | 'warning' | 'error' | 'off' }.
function BatteryStats({ vehicleStatus, systems }) {
  const hasData = vehicleStatus !== undefined && vehicleStatus !== null
  const status = hasData ? vehicleStatus : 'normal'
  const vehicle = STATUS_MAP[status] || STATUS_MAP.normal
  const sysList = systems || [
    { label: 'Motor',       status: 'normal' },
    { label: 'Controller',  status: 'normal' },
    { label: 'CAN Bus',     status: 'normal' },
    { label: 'ABS',         status: 'normal' },
    { label: 'ESC',         status: 'normal' },
  ]

  return (
    <div className="vstatus-wrap">

      <div className="vstatus-top">
        <span className="vstatus-title">Vehicle status</span>
        <span
          className="vstatus-overall"
          style={{ color: hasData ? vehicle.color : 'var(--muted)' }}
        >
          {hasData ? vehicle.label : '—'}
        </span>
      </div>

      <div className="vstatus-body">

        {/* System status list */}
        <div className="vstatus-list">
          {sysList.map(sys => {
            const s = STATUS_COLORS[sys.status] || STATUS_COLORS.normal
            return (
              <div key={sys.label} className="vstatus-row">
                <span className="vstatus-row-label">{sys.label}</span>
                <div className="vstatus-row-right">
                  {hasData ? (
                    <>
                      <div
                        className="vstatus-dot"
                        style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                      />
                      <span
                        className="vstatus-row-value"
                        style={{ color: s.color }}
                      >
                        {s.label}
                      </span>
                    </>
                  ) : (
                    <span className="vstatus-row-value" style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Car image */}
        <div className="vstatus-car">
          <img
            src={vehicle.img}
            alt="vehicle"
            className="vstatus-car-img"
          />
        </div>

      </div>

    </div>
  )
}

export default memo(BatteryStats)
