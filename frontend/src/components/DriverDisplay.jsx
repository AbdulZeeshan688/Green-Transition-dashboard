import Icon from './Icon';
import { CarRear, RoadView } from './Graphics';
import { fmt } from '../lib/format';

const GEARS = ['P', 'R', 'N', 'D'];

export default function DriverDisplay({
  units,
  speedKmh,
  gear,
  onGearChange,
  mode,
  regenOn,
  socPercent,
  rangeKm,
  remainingKm,
  destinationName,
  energyRate,
  power,
  onPowerToggle,
  roadOffsetPx,
  roadDashPx,
  fault,
  charging,
}) {
  const status = fault ? 'FAULT' : { off: 'OFF', starting: 'STARTING…', ready: 'READY' }[power];
  return (
    <section className="card">
      <h2 className="card-title">Driver Display</h2>
      <div className={`cluster power-${power}`}>
        <div className="cluster-side">
          <div className="stat">
            <span className="stat-label">Route distance</span>
            <span className="stat-value">
              {fmt(remainingKm, 1)} <small>{units.distance}</small>
            </span>
            <span className="stat-sub">
              <Icon name="flag" size={16} />
              {destinationName ?? 'No route applied'}
            </span>
          </div>
          <hr />
          <div className="stat">
            <span className="stat-label">
              Battery
              {charging && (
                <span className="charging-tag">
                  <Icon name="bolt" size={13} /> Charging
                </span>
              )}
            </span>
            <span className="stat-value battery-row">
              {fmt(socPercent)}%
              <span className="battery-icon">
                <span className="battery-fill" style={{ width: `${socPercent}%` }} />
              </span>
            </span>
            <span className="stat-value small">
              {fmt(rangeKm)} <small>{units.distance}</small>
            </span>
            <span className="stat-label">Range</span>
          </div>
          <button
            className={`power-btn ${power}`}
            onClick={onPowerToggle}
            disabled={power === 'starting'}
            aria-label={power === 'ready' ? 'Switch vehicle off' : 'Start vehicle'}
          >
            <Icon name="power" size={26} />
            <span>{power === 'ready' ? 'STOP' : 'START'}</span>
          </button>
        </div>

        <div className="cluster-center">
          <span className={`power-status ${fault ? 'fault' : power}`}>{status}</span>
          <div className="speed">{fmt(speedKmh)}</div>
          <div className="speed-unit">{units.speed}</div>
          <div className="road">
            <RoadView offsetPx={roadOffsetPx} dashPx={roadDashPx} />
            <CarRear moving={speedKmh > 0.5} />
          </div>
          <div className="gear-row" role="group" aria-label="Gear selector">
            {GEARS.map((g) => (
              <button key={g} className={`gear-btn ${gear === g ? 'active' : ''}`} onClick={() => onGearChange(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="cluster-side right">
          <div className="stat">
            <span className="stat-label">Drive mode</span>
            <span className="stat-value accent">{mode.label.toUpperCase()}</span>
          </div>
          <hr />
          <div className="stat">
            <span className="stat-label">Regenerative</span>
            <span className={`stat-value ${regenOn ? 'accent' : 'muted'}`}>{regenOn ? 'ON' : 'OFF'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Energy use</span>
            <span className="stat-value small">
              {fmt(energyRate, 2)} <small>{units.energyRate}</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
