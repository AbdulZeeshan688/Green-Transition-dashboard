import { useCallback, useEffect, useState } from 'react';
import Header from './Header';
import DriverDisplay from './DriverDisplay';
import DrivingControls from './DrivingControls';
import TouchScreen from './TouchScreen';
import RouteEvaluation from './RouteEvaluation';
import VehicleStatus from './VehicleStatus';
import { useSimulation } from '../hooks/useSimulation';
import { canShift, msToKmh } from '../lib/vehicleModel';
import {
  baseEnergyRate,
  co2Kg,
  estimateRangeKm,
  evaluateRoute,
  remainingSocPercent,
} from '../lib/energyModel';

const KEY_INPUTS = { ArrowUp: 'accel', ArrowDown: 'brake', ArrowLeft: 'left', ArrowRight: 'right' };
const KEY_GEARS = { p: 'P', r: 'R', n: 'N', d: 'D' };

function tabFromHash(tabs) {
  const id = window.location.hash.slice(1);
  return tabs.some((t) => t.id === id) ? id : tabs[0].id;
}

export default function Dashboard({ data }) {
  const { ui, vehicles, vehicleState, driveModes, simulation, routes, scoring, energyModel } = data;

  // The active tab is mirrored in the URL hash (#route, #vehicle) so views can be linked directly.
  const [tab, setTabState] = useState(() => tabFromHash(ui.tabs));
  const setTab = useCallback((id) => {
    window.location.hash = id;
    setTabState(id);
  }, []);

  useEffect(() => {
    const onHash = () => setTabState(tabFromHash(ui.tabs));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [ui.tabs]);
  const [registration, setRegistration] = useState(vehicleState.registrationNumber);
  const [gear, setGear] = useState(vehicleState.gear);
  const [modeId, setModeId] = useState(vehicleState.driveMode);
  const [cabinTempC, setCabinTempC] = useState(vehicleState.cabinTempC);
  const [appliedRoute, setAppliedRoute] = useState(null);
  const [notice, setNotice] = useState(null);

  const vehicleSpec = vehicles.find((v) => v.registrationNumber === registration) ?? vehicles[0];
  const vehicle = { ...simulation.vehicleDefaults, ...vehicleSpec };
  const mode = driveModes.find((m) => m.id === modeId) ?? driveModes[0];
  const sim = useSimulation({ vehicle, mode, gear, config: simulation });
  const { setInput, resetTrip } = sim;

  const speedKmh = msToKmh(sim.state.speedMs);
  const regenOn = vehicleState.regenEnabled && mode.regen;

  // Live energy (Sanjeev's model): while a route is applied, energy accrues at that
  // route's average rate (incl. climbs/regen); otherwise at the vehicle's base rate.
  const route = appliedRoute ? evaluateRoute(appliedRoute, vehicle, energyModel) : null;
  const energyRate = route ? route.energyKWh / route.distanceKm : baseEnergyRate(vehicle);
  const tripEnergyKWh = sim.state.tripKm * energyRate;
  const socPercent = remainingSocPercent(vehicleState.socPercent, tripEnergyKWh, vehicle);
  const rangeKm = estimateRangeKm(socPercent, vehicle);
  const tripCo2Kg = co2Kg(tripEnergyKWh, energyModel.gridCo2GPerKWh);
  const remainingKm = route ? Math.max(0, route.distanceKm - sim.state.tripKm) : null;

  const requestGear = useCallback(
    (target) => {
      if (canShift(target, speedKmh, simulation.gearChangeMaxKmh)) {
        setGear(target);
      } else {
        setNotice(`Slow down below ${simulation.gearChangeMaxKmh} ${ui.units.speed} to shift to ${target}`);
      }
    },
    [speedKmh, simulation.gearChangeMaxKmh, ui.units.speed],
  );

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    const isFormField = (el) => ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    const down = (e) => {
      if (isFormField(e.target)) return;
      if (KEY_INPUTS[e.key]) {
        e.preventDefault();
        setInput(KEY_INPUTS[e.key], true);
      } else if (KEY_GEARS[e.key.toLowerCase()] && !e.repeat) {
        requestGear(KEY_GEARS[e.key.toLowerCase()]);
      }
    };
    const up = (e) => {
      if (KEY_INPUTS[e.key]) setInput(KEY_INPUTS[e.key], false);
    };
    const releaseAll = () => Object.values(KEY_INPUTS).forEach((name) => setInput(name, false));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', releaseAll);
    };
  }, [setInput, requestGear]);

  const applyRoute = (route) => {
    setAppliedRoute(route);
    resetTrip();
  };

  // A different vehicle starts a fresh trip from the snapshot's state of charge.
  const changeVehicle = (reg) => {
    setRegistration(reg);
    resetTrip();
  };

  const changeTemp = (delta) =>
    setCabinTempC((t) => Math.min(simulation.climateMaxC, Math.max(simulation.climateMinC, t + delta)));

  return (
    <div className="app">
      <Header ui={ui} activeTab={tab} onTabChange={setTab} systemOnline={vehicleState.systemOnline} />
      <main className="layout">
        <div className="left-col">
          <DriverDisplay
            units={ui.units}
            speedKmh={speedKmh}
            gear={gear}
            onGearChange={requestGear}
            mode={mode}
            regenOn={regenOn}
            socPercent={socPercent}
            rangeKm={rangeKm}
            remainingKm={remainingKm}
            destinationName={appliedRoute?.destinationName}
            energyRate={energyRate}
          />
          <DrivingControls
            units={ui.units}
            sim={sim}
            speedKmh={speedKmh}
            gear={gear}
            driveModes={driveModes}
            modeId={modeId}
            onModeChange={setModeId}
          />
        </div>
        <div className="right-col">
          {tab === 'dashboard' && (
            <TouchScreen
              ui={ui}
              vehicle={vehicle}
              rangeKm={rangeKm}
              cabinTempC={cabinTempC}
              onTempChange={changeTemp}
              climate={simulation}
              onOpenTab={setTab}
            />
          )}
          {tab === 'route' && (
            <RouteEvaluation
              routesData={routes}
              scoring={scoring}
              vehicle={vehicle}
              energyModel={energyModel}
              units={ui.units}
              appliedRouteId={appliedRoute?.id}
              onApply={applyRoute}
              onClose={() => setTab('dashboard')}
            />
          )}
          {tab === 'vehicle' && (
            <VehicleStatus
              units={ui.units}
              vehicles={vehicles}
              vehicle={vehicle}
              onVehicleChange={changeVehicle}
              live={{
                socPercent,
                rangeKm,
                speedKmh,
                gear,
                modeLabel: mode.label,
                regenOn,
                tripKm: sim.state.tripKm,
                tripEnergyKWh,
                tripCo2Kg,
              }}
              energyModel={energyModel}
            />
          )}
        </div>
      </main>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
