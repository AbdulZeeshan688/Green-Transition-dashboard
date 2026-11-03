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

// Power the car actually charges with on a given charger. Uses the vehicle's
// verified charging specs (vehicles.json "charging") when available:
// - wrong plug (e.g. CHAdeMO car on a CCS2 charger) → not compatible
// - DC with a known 10–80 % time → average power over that window (real cars
//   only reach their peak briefly, so this is more realistic than the peak)
// - otherwise the lower of charger power and the car's max power
// Without verified specs the charger's power is used and flagged.
export function chargingPower(charger, vehicle) {
  const spec = vehicle.charging?.[charger.type.toLowerCase()];
  if (spec && spec.port !== charger.port) {
    return {
      compatible: false,
      kw: 0,
      note: `${vehicle.make} ${vehicle.model} uses ${spec.port}, not ${charger.port}`,
    };
  }
  if (!spec) {
    return { compatible: true, kw: charger.powerKW, note: 'car limit not verified' };
  }
  if (charger.type === 'DC' && spec.minutes10to80) {
    const avgKW = (0.7 * vehicle.batteryCapacity) / (spec.minutes10to80 / 60);
    const kw = Math.min(charger.powerKW, avgKW);
    return { compatible: true, kw, note: `average 10–80 % (peak ${spec.maxKW} kW)` };
  }
  const kw = Math.min(charger.powerKW, spec.maxKW);
  return { compatible: true, kw, note: spec.maxKW < charger.powerKW ? 'limited by the car' : 'limited by the charger' };
}

export function formatDuration(hours) {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
