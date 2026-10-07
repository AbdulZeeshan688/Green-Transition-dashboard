import { CarSide } from './Graphics';
import { estimateRangeKm } from '../lib/energyModel';
import { fmt } from '../lib/format';

export default function VehicleStatus({ units, vehicles, vehicle, onVehicleChange, live, energyModel }) {
  const specs = [
    ['Registration', vehicle.registrationNumber],
    ['Battery capacity', `${fmt(vehicle.batteryCapacity, 1)} ${units.energy}`],
    ['Energy consumption', `${fmt(vehicle.energyConsumption, 1)} kWh/100 ${units.distance}`],
    ['Range at 100%', `${fmt(estimateRangeKm(100, vehicle))} ${units.distance}`],
    ['Top speed', `${fmt(vehicle.maxSpeedKmh)} ${units.speed}`],
  ];
  const telemetry = [
    ['State of charge', `${fmt(live.socPercent, 1)}%`],
    ['Estimated range', `${fmt(live.rangeKm)} ${units.distance}`],
    ['Speed', `${fmt(live.speedKmh)} ${units.speed}`],
    ['Gear', live.gear],
    ['Drive mode', live.modeLabel],
    ['Regenerative braking', live.regenOn ? 'On' : 'Off'],
    ['Trip distance', `${fmt(live.tripKm, 2)} ${units.distance}`],
    ['Trip energy', `${fmt(live.tripEnergyKWh, 3)} ${units.energy}`],
    ['Trip CO₂', `${fmt(live.tripCo2Kg * 1000, 1)} g`],
  ];

  return (
    <section className="card vehicle-panel">
      <h2 className="card-title">Vehicle Status</h2>
      <div className="vehicle-head">
        <div>
          <select
            value={vehicle.registrationNumber}
            onChange={(e) => onVehicleChange(e.target.value)}
            aria-label="Vehicle"
          >
            {vehicles.map((v) => (
              <option key={v.registrationNumber} value={v.registrationNumber}>
                {v.make} {v.model} ({v.registrationNumber})
              </option>
            ))}
          </select>
          <p className="muted">
            {vehicle.variant} · {vehicle.propulsion}
          </p>
        </div>
        <CarSide />
      </div>
      <div className="kv-columns">
        <div>
          <span className="section-label">Specifications</span>
          <dl className="kv">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <span className="section-label">Live telemetry</span>
          <dl className="kv">
            {telemetry.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="hint">
        Spec source: {vehicle.specSource}. Energy model: {energyModel.source}. Grid CO₂: {energyModel.gridCo2Source}
      </p>
    </section>
  );
}
