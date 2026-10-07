import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { bestRouteId, findRoutes, scoreRoutes } from '../lib/routeScoring';
import { classifyRoutes, evaluateRoute } from '../lib/energyModel';
import { fmt } from '../lib/format';

// Labels follow Sanjeev's rule (see classifyRoutes); they are derived, not stored.
function routeLabel(id, ecoId, fastestId) {
  if (id === ecoId && id === fastestId) return { label: 'Eco & Fastest', icon: 'leaf' };
  if (id === ecoId) return { label: 'Eco Route', icon: 'leaf' };
  if (id === fastestId) return { label: 'Fastest Route', icon: 'clock' };
  return { label: 'Alternative', icon: 'route' };
}

function toPoints(path) {
  return path.map(([x, y]) => `${x},${y}`).join(' ');
}

function RouteMap({ candidates, selectedId }) {
  const selected = candidates.find((r) => r.id === selectedId);
  const labelOf = (id) => routeLabel(id, ecoId, fastestId);
  const others = candidates.filter((r) => r.id !== selectedId);
  const start = selected?.path[0];
  const end = selected?.path[selected.path.length - 1];

  return (
    <div className="route-map">
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <rect width="100" height="60" fill="var(--map-bg)" />
        <path d="M0 40 Q20 30 30 42 T60 30 T100 20" stroke="var(--map-water)" strokeWidth="3" fill="none" />
        <rect x="58" y="40" width="14" height="9" rx="2" fill="var(--map-park)" />
        <rect x="12" y="8" width="12" height="8" rx="2" fill="var(--map-park)" />
        {[10, 25, 40, 55, 70, 85].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x + 6} y2="60" stroke="var(--map-road)" strokeWidth="0.6" />
        ))}
        {[12, 27, 45].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y + 4} stroke="var(--map-road)" strokeWidth="0.6" />
        ))}
        {others.map((r) => (
          <polyline key={r.id} points={toPoints(r.path)} className="route-line alt" />
        ))}
        {selected && <polyline points={toPoints(selected.path)} className="route-line main" />}
      </svg>
      {start && (
        <span className="map-marker start" style={{ left: `${start[0]}%`, top: `${(start[1] / 60) * 100}%` }} />
      )}
      {end && (
        <span className="map-marker end" style={{ left: `${end[0]}%`, top: `${(end[1] / 60) * 100}%` }}>
          <Icon name="flag" size={22} />
        </span>
      )}
      {candidates.length > 0 && (
        <div className="map-legend">
          <span>
            <i className="legend-line main" /> Selected route
          </span>
          {others.length > 0 && (
            <span>
              <i className="legend-line alt" /> Alternative route
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function RouteEvaluation({ routesData, scoring, vehicle, energyModel, units, appliedRouteId, onApply, onClose }) {
  const { places, routes } = routesData;
  const [originId, setOriginId] = useState(places[0]?.id);
  const [destinationId, setDestinationId] = useState(places[1]?.id);
  const [selectedId, setSelectedId] = useState(null);
  const [scores, setScores] = useState(null);

  const candidates = useMemo(() => findRoutes(routes, originId, destinationId), [routes, originId, destinationId]);
  const evaluated = useMemo(
    () => candidates.map((r) => evaluateRoute(r, vehicle, energyModel)),
    [candidates, vehicle, energyModel],
  );
  const { fastestId, ecoId } = classifyRoutes(evaluated);

  useEffect(() => {
    setScores(null);
    setSelectedId(candidates[0]?.id ?? null);
  }, [candidates, vehicle.registrationNumber]);

  const evaluate = () => {
    const result = scoreRoutes(evaluated, scoring.metrics);
    setScores(result);
    setSelectedId(bestRouteId(result));
  };

  const selected = candidates.find((r) => r.id === selectedId);
  const labelOf = (id) => routeLabel(id, ecoId, fastestId);
  const placeName = (id) => places.find((p) => p.id === id)?.name;

  return (
    <section className="route-panel">
      <div className="route-head">
        <h2 className="card-title">Route Evaluation</h2>
        <span className="eco-badge">
          <Icon name="leaf" size={16} /> ECO ANALYSIS
        </span>
        <button className="icon-btn" aria-label="Close route evaluation" onClick={onClose}>
          <Icon name="close" size={24} />
        </button>
      </div>

      <div className="route-inputs">
        <label>
          Start
          <span className="select-wrap">
            <Icon name="pin" size={18} className="accent" />
            <select value={originId} onChange={(e) => setOriginId(e.target.value)}>
              {places.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === destinationId}>
                  {p.name}
                </option>
              ))}
            </select>
          </span>
        </label>
        <button
          className="icon-btn swap"
          aria-label="Swap start and destination"
          onClick={() => {
            setOriginId(destinationId);
            setDestinationId(originId);
          }}
        >
          <Icon name="swap" size={22} />
        </button>
        <label>
          Destination
          <span className="select-wrap">
            <Icon name="flag" size={18} />
            <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
              {places.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === originId}>
                  {p.name}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>

      <RouteMap candidates={candidates} selectedId={selectedId} />

      <p className="route-context">
        Calculated for <strong>{vehicle.make} {vehicle.model}</strong> ({fmt(vehicle.energyConsumption, 1)} kWh/100 km)
        · grid {fmt(energyModel.gridCo2GPerKWh)} gCO<sub>2</sub>/kWh
      </p>

      {candidates.length === 0 ? (
        <p className="empty">No route data for this start/destination pair yet.</p>
      ) : (
        <div className="route-cards">
          {evaluated.map((r) => {
            const { label, icon } = labelOf(r.id);
            const score = scores?.[r.id];
            const good = score !== undefined && score >= scoring.goodScoreMin;
            const tone = score === undefined ? '' : good ? 'good' : 'warn';
            return (
              <button
                key={r.id}
                className={`route-card ${r.id === selectedId ? 'selected' : ''}`}
                onClick={() => setSelectedId(r.id)}
              >
                <span className="route-card-head">
                  <Icon name={icon} size={22} />
                  {label}
                  {r.id === selectedId && (
                    <span className="check">
                      <Icon name="check" size={14} />
                    </span>
                  )}
                </span>
                <dl>
                  <dt>Distance</dt>
                  <dd>
                    {fmt(r.distanceKm, 1)} {units.distance}
                  </dd>
                  <dt>Time</dt>
                  <dd>
                    {fmt(r.durationMin)} {units.duration}
                  </dd>
                  <dt>Energy Use</dt>
                  <dd className={r.id === ecoId ? 'good' : ''}>
                    {fmt(r.energyKWh, 2)} {units.energy}
                  </dd>
                  <dt>Battery Use</dt>
                  <dd>{fmt(r.batteryUsagePercent, 1)}%</dd>
                  <dt>
                    CO<sub>2</sub> Emitted
                  </dt>
                  <dd>
                    {fmt(r.co2Kg, 3)} {units.mass}
                  </dd>
                  <dt>Elevation</dt>
                  <dd>
                    +{fmt(r.totalUphill)} / −{fmt(r.totalDownhill)} {units.elevation}
                  </dd>
                  <dt>Regenerated</dt>
                  <dd>
                    {fmt(r.regeneratedKWh, 3)} {units.energy}
                  </dd>
                </dl>
                <span className="score-row">
                  Score
                  <span className={`score ${tone}`}>
                    {fmt(score)} <small>/ 100</small>
                  </span>
                </span>
                <span className="score-bar">
                  <span className={tone} style={{ width: `${score ?? 0}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="route-actions">
        <button className="btn secondary" onClick={evaluate} disabled={candidates.length === 0}>
          <Icon name="refresh" size={20} /> Evaluate Route
        </button>
        <button
          className="btn primary"
          disabled={!selected}
          onClick={() => onApply({ ...selected, destinationName: placeName(destinationId) })}
        >
          <Icon name={appliedRouteId === selectedId ? 'check' : 'arrowRight'} size={20} />
          {appliedRouteId === selectedId ? 'Route Applied' : 'Apply Route'}
        </button>
      </div>
    </section>
  );
}
