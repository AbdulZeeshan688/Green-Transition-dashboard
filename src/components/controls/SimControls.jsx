import { memo } from 'react'
import './SimControls.css'

const GEARS = ['P', 'R', 'N', 'D']

// Drive modes — Eco (max range), Comfort (balanced), i-Pedal (one-pedal).
const DRIVE_MODES = [
  { key: 'ECO',       label: 'Eco' },
  { key: 'COMFORT',   label: 'Comfort' },
  { key: 'ONE_PEDAL', label: 'i-Pedal' },
]

function SimControls({ gear, setGear, driveMode, setDriveMode }) {
  return (
    <div className="simctrl-wrap">

      <div className="simctrl-section">
        <div className="simctrl-label">GEAR</div>
        <div className="simctrl-gears">
          {GEARS.map(g => (
            <button
              key={g}
              className={`simctrl-gear-btn ${gear === g ? 'active' : ''}`}
              onClick={() => setGear(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="simctrl-section">
        <div className="simctrl-label">DRIVE MODE</div>
        <div className="simctrl-modes">
          {DRIVE_MODES.map(m => (
            <button
              key={m.key}
              className={`simctrl-mode-btn ${driveMode === m.key ? 'active' : ''}`}
              onClick={() => setDriveMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

export default memo(SimControls)
