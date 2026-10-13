// Charging maths: energy = power × time, SoC % = energy / battery capacity.
// All charger values come from charging.json.

export function energyToLimitKWh(socPercent, limitPercent, vehicle) {
  return Math.max(0, ((limitPercent - socPercent) / 100) * vehicle.batteryCapacity);
}

// Real-world charging time (hours) at the given charger power.
export function hoursToLimit(socPercent, limitPercent, powerKW, vehicle) {
  return energyToLimitKWh(socPercent, limitPercent, vehicle) / powerKW;
}

// New SoC after charging for `hours`, never above the limit.
export function chargeStep(socPercent, limitPercent, powerKW, vehicle, hours) {
  const added = ((powerKW * hours) / vehicle.batteryCapacity) * 100;
  return Math.min(limitPercent, socPercent + added);
}

export function formatDuration(hours) {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
