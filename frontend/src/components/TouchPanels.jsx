import Icon from './Icon';
import { energyToLimitKWh, formatDuration, hoursToLimit } from '../lib/charging';
import { estimateRangeKm } from '../lib/energyModel';
import { fmt } from '../lib/format';

function PanelHeader({ title, subtitle, onBack }) {
  return (
    <div className="panel-head">
      <button className="icon-btn" aria-label="Back to home" onClick={onBack}>
        <Icon name="chevronLeft" size={24} />
      </button>
      <div>
        <h3>{title}</h3>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="panel-row">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ChargingPanel({
  units,
  vehicle,
  config,
  socPercent,
  limit,
  onLimitChange,
  charging,
  onToggleCharging,
  onBack,
}) {
  const hours = hoursToLimit(socPercent, limit, config.chargerPowerKW, vehicle);
  const reached = socPercent >= limit;
  return (
    <div className="panel">
      <PanelHeader
        title="Charging"
        subtitle={`${config.chargerLabel} · ${fmt(config.chargerPowerKW)} kW`}
        onBack={onBack}
      />

      <div className="panel-card charge-card">
        <div className="charge-top">
          <span className={`charge-state ${charging ? 'on' : ''}`}>
            <Icon name="bolt" size={18} /> {charging ? 'Charging' : reached ? 'Limit reached' : 'Not charging'}
          </span>
          <span className="charge-soc">{fmt(socPercent)}%</span>
        </div>
        <div className="charge-bar">
          <span className={`charge-fill ${charging ? 'on' : ''}`} style={{ width: `${socPercent}%` }} />
          <span className="charge-limit-mark" style={{ left: `${limit}%` }} />
        </div>
        <label className="limit-label">
          Charge limit <strong>{limit}%</strong>
          <input
            type="range"
            min={config.limitMinPercent}
            max={config.limitMaxPercent}
            step={config.limitStepPercent}
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="panel-card">
        <Row
          label="Energy to limit"
          value={`${fmt(energyToLimitKWh(socPercent, limit, vehicle), 1)} ${units.energy}`}
        />
        <Row label="Time to limit (real)" value={reached ? '—' : formatDuration(hours)} />
        <Row label="Range at limit" value={`${fmt(estimateRangeKm(limit, vehicle))} ${units.distance}`} />
      </div>

      <button
        className={`btn ${charging ? 'secondary' : 'primary'}`}
        onClick={onToggleCharging}
        disabled={!charging && reached}
      >
        <Icon name="bolt" size={20} /> {charging ? 'Stop charging' : 'Start charging'}
      </button>
      <p className="hint">
        Demo runs {fmt(config.demoTimeScale)}× faster than real time. Vehicle must be switched off to charge.
      </p>
    </div>
  );
}

export function SafetyPanel({ systemsConfig, states, summary, scenarioId, onScenarioChange, onBack }) {
  const { systems, statusLabels, scenarios } = systemsConfig;
  const banner = {
    ok: 'All systems ready',
    warning: 'Check the systems marked Warning',
    error: summary.drivingBlocked ? `Fault in ${summary.blockedBy.join(', ')} — driving disabled` : 'Fault detected',
  }[summary.level];
  return (
    <div className="panel">
      <PanelHeader title="Safety" subtitle="Vehicle system status" onBack={onBack} />

      <div className={`status-banner ${summary.level}`}>
        <Icon name={summary.level === 'ok' ? 'shield' : 'bolt'} size={20} /> {banner}
      </div>

      <div className="panel-card">
        {systems.map((sys) => {
          const state = states[sys.id] ?? 'ok';
          return (
            <div key={sys.id} className="panel-row">
              <span className="muted">{sys.label}</span>
              <span className={`sys-state ${state}`}>
                <i /> {statusLabels[state]}
              </span>
            </div>
          );
        })}
      </div>

      <span className="section-label">Demo scenario</span>
      <div className="segmented">
        {scenarios.map((s) => (
          <button key={s.id} className={s.id === scenarioId ? 'active' : ''} onClick={() => onScenarioChange(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <p className="hint">{systemsConfig.source}</p>
    </div>
  );
}

export function ComfortPanel({ driveModes, modeId, onModeChange, regenEnabled, onRegenToggle, regenOn, onBack }) {
  const modeLabel = driveModes.find((m) => m.id === modeId)?.label;
  return (
    <div className="panel">
      <PanelHeader title="Comfort" subtitle="Drive mode and regenerative braking" onBack={onBack} />

      <span className="section-label">Drive mode</span>
      <div className="mode-cards">
        {driveModes.map((m) => (
          <button
            key={m.id}
            className={`mode-card ${m.id === modeId ? 'active' : ''}`}
            onClick={() => onModeChange(m.id)}
          >
            <Icon name={m.icon} size={24} />
            <strong>{m.label}</strong>
            <small>{fmt(m.maxAccelMs2, 1)} m/s² max</small>
            <small>Regen {m.regen ? 'available' : 'off'}</small>
          </button>
        ))}
      </div>

      <div className="panel-card">
        <div className="panel-row">
          <span>
            <strong>Regenerative braking</strong>
            <small className="muted block">Recovers energy on descents (counted in route energy)</small>
          </span>
          <button
            role="switch"
            aria-checked={regenEnabled}
            className={`switch ${regenEnabled ? 'on' : ''}`}
            onClick={onRegenToggle}
            aria-label="Regenerative braking"
          >
            <span />
          </button>
        </div>
        <Row
          label="Regen active now"
          value={regenOn ? 'Yes' : !regenEnabled ? 'No — switched off' : `No — ${modeLabel} mode has no regen`}
        />
      </div>
    </div>
  );
}

export function SettingsPanel({ vehicles, vehicle, onVehicleChange, onResetTrip, tripKm, units, onBack }) {
  return (
    <div className="panel">
      <PanelHeader title="Settings" onBack={onBack} />

      <span className="section-label">Vehicle</span>
      <div className="vehicle-list">
        {vehicles.map((v) => (
          <button
            key={v.registrationNumber}
            className={`vehicle-option ${v.registrationNumber === vehicle.registrationNumber ? 'active' : ''}`}
            onClick={() => onVehicleChange(v.registrationNumber)}
          >
            <span>
              <strong>
                {v.make} {v.model}
              </strong>
              <small className="muted block">
                {v.variant} · {fmt(v.batteryCapacity, 1)} {units.energy} · {fmt(v.energyConsumption, 1)} kWh/100{' '}
                {units.distance}
              </small>
            </span>
            {v.registrationNumber === vehicle.registrationNumber && (
              <span className="check">
                <Icon name="check" size={14} />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="panel-card">
        <div className="panel-row">
          <span>
            <strong>Trip</strong>
            <small className="muted block">
              {fmt(tripKm, 2)} {units.distance} driven
            </small>
          </span>
          <button className="btn secondary small" onClick={onResetTrip}>
            <Icon name="refresh" size={16} /> Reset trip
          </button>
        </div>
      </div>
    </div>
  );
}
