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
  cabin,
  ambient,
  blinkMs,
  openPartLabels,
}) {
  const status = fault ? 'FAULT' : { off: 'OFF', starting: 'STARTING…', ready: 'READY' }[power];
  const { signals, lights } = cabin;
  const leftOn = signals.left || signals.hazard;
  const rightOn = signals.right || signals.hazard;
  const beam = lights.headlights === 'high' ? 'high' : lights.headlights === 'off' ? 'off' : 'low';
  const clusterStyle = {
    '--blink-ms': `${blinkMs}ms`,
    ...(ambient && { '--ambient': ambient.hex, '--ambient-alpha': ambient.brightness / 100 }),
  };
  return (
    <section className="card">
      <h2 className="card-title">Driver Display</h2>
      <div className={`cluster power-${power} ${ambient ? 'ambient-on' : ''}`} style={clusterStyle}>
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
          <div className="telltales" aria-label="Indicator lights">
            <span className={`telltale signal ${leftOn ? 'blink' : ''}`} title="Left turn signal">
              <Icon name="arrowLeftFill" size={22} />
            </span>
            <span className={`telltale beam-${lights.headlights}`} title={`Headlights: ${lights.headlights}`}>
              <Icon name="headlight" size={20} />
              {lights.headlights === 'auto' && <small>A</small>}
            </span>
            <span className={`telltale fog ${lights.fogLights ? 'on' : ''}`} title="Fog lights">
              <Icon name="fog" size={20} />
            </span>
            <span
              className={`telltale warn ${openPartLabels.length ? 'on' : ''}`}
              title={openPartLabels.length ? `Open: ${openPartLabels.join(', ')}` : 'All closed'}
            >
              <Icon name="doorOpen" size={20} />
            </span>
            <span className={`telltale hazard ${signals.hazard ? 'blink' : ''}`} title="Hazard lights">
              <Icon name="hazard" size={20} />
            </span>
            <span className={`telltale signal ${rightOn ? 'blink' : ''}`} title="Right turn signal">
              <Icon name="arrowRightFill" size={22} />
            </span>
          </div>
          <span className={`power-status ${fault ? 'fault' : power}`}>{status}</span>
          <div className="speed">{fmt(speedKmh)}</div>
          <div className="speed-unit">{units.speed}</div>
          <div className={`road beam-${beam}`}>
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
