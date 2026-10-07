// Energy, battery and CO2 calculations from Sanjeev-Kumar Chaudhary's model
// (github.com/Sanjeev7071/Green-Transition-Dashboard-LAB-REDI-, frontend/src/pages/Dashboard.jsx).
// The formulas are unchanged; the constants moved to public/data/energy-model.json.

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// kWh/100 km -> kWh/km
export function baseEnergyRate(vehicle) {
  return vehicle.energyConsumption / 100;
}

// Sum of climbs and descents along a list of elevations (m).
export function elevationTotals(elevations) {
  let totalUphill = 0;
  let totalDownhill = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) totalUphill += diff;
    else totalDownhill += -diff;
  }
  return { totalUphill, totalDownhill };
}

// energyUsed = distance × baseRate + uphill × uphillFactor − downhill × regenFactor (never below 0)
export function routeEnergy({ distanceKm, totalUphill, totalDownhill }, vehicle, model) {
  const drivingKWh = distanceKm * baseEnergyRate(vehicle);
  const uphillKWh = totalUphill * model.uphillKWhPerM;
  const regeneratedKWh = totalDownhill * model.regenKWhPerM;
  const energyKWh = Math.max(drivingKWh + uphillKWh - regeneratedKWh, 0);
  return { drivingKWh, uphillKWh, regeneratedKWh, energyKWh };
}

export function batteryUsagePercent(energyKWh, vehicle) {
  return (energyKWh / vehicle.batteryCapacity) * 100;
}

// Grid intensity is in gCO2/kWh (Fingrid dataset 265); result in kg.
export function co2Kg(energyKWh, gridCo2GPerKWh) {
  return energyKWh * (gridCo2GPerKWh / 1000);
}

export function averageSpeedKmh(distanceKm, durationMin) {
  return durationMin > 0 ? distanceKm / (durationMin / 60) : 0;
}

export function remainingSocPercent(startSocPercent, consumedKWh, vehicle) {
  return Math.max(startSocPercent - batteryUsagePercent(consumedKWh, vehicle), 0);
}

export function estimateRangeKm(socPercent, vehicle) {
  return ((socPercent / 100) * vehicle.batteryCapacity) / baseEnergyRate(vehicle);
}

// Adds every computed metric to a route candidate for the given vehicle.
export function evaluateRoute(route, vehicle, model) {
  const energy = routeEnergy(route, vehicle, model);
  return {
    ...route,
    ...energy,
    batteryUsagePercent: batteryUsagePercent(energy.energyKWh, vehicle),
    co2Kg: co2Kg(energy.energyKWh, model.gridCo2GPerKWh),
    averageSpeedKmh: averageSpeedKmh(route.distanceKm, route.durationMin),
  };
}

// Sanjeev's rule: fastest = shortest duration; eco = lowest energy, but only if it
// actually uses less energy than the fastest route (otherwise fastest is also eco).
export function classifyRoutes(evaluated) {
  if (evaluated.length === 0) return { fastestId: null, ecoId: null };
  const fastest = evaluated.reduce((best, r) => (r.durationMin < best.durationMin ? r : best));
  const lowest = evaluated.reduce((best, r) => (r.energyKWh < best.energyKWh ? r : best));
  const eco = lowest.energyKWh < fastest.energyKWh ? lowest : fastest;
  return { fastestId: fastest.id, ecoId: eco.id };
}
