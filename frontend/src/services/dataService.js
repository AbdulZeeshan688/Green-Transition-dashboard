// Single entry point for all dashboard data. Today it reads the JSON files in
// public/data; set VITE_DATA_BASE_URL to point the same calls at a backend API.
const BASE_URL = import.meta.env.VITE_DATA_BASE_URL ?? `${import.meta.env.BASE_URL}data`;

async function getJson(name) {
  const res = await fetch(`${BASE_URL}/${name}.json`);
  if (!res.ok) throw new Error(`Failed to load ${name}.json (HTTP ${res.status})`);
  return res.json();
}

export async function loadAppData() {
  const [
    ui,
    vehicles,
    vehicleState,
    driveModes,
    simulation,
    routes,
    scoring,
    energyModel,
    charging,
    vehicleSystems,
    integrations,
    cabin,
  ] = await Promise.all([
    getJson('ui'),
    getJson('vehicles'),
    getJson('vehicle-state'),
    getJson('drive-modes'),
    getJson('simulation'),
    getJson('routes'),
    getJson('scoring'),
    getJson('energy-model'),
    getJson('charging'),
    getJson('vehicle-systems'),
    getJson('integrations'),
    getJson('cabin'),
  ]);
  return {
    ui,
    vehicles,
    vehicleState,
    driveModes,
    simulation,
    routes,
    scoring,
    energyModel,
    charging,
    vehicleSystems,
    integrations,
    cabin,
  };
}
