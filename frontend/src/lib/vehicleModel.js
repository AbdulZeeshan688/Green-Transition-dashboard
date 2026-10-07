// Pure driving-simulation functions. No React, no constants: every tuning value
// comes from vehicles.json, drive-modes.json or simulation.json.

export const msToKmh = (ms) => ms * 3.6;
export const kmhToMs = (kmh) => kmh / 3.6;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Pedals ramp from 0 to 1 over `rampSeconds` instead of jumping instantly.
export function rampPedal(current, held, dt, rampSeconds) {
  const delta = dt / rampSeconds;
  return held ? Math.min(1, current + delta) : Math.max(0, current - delta);
}

export function nextSteering(angleDeg, { left, right }, dt, sim, maxDeg) {
  const direction = (right ? 1 : 0) - (left ? 1 : 0);
  if (direction !== 0) {
    return clamp(angleDeg + direction * sim.steeringRateDegPerSec * dt, -maxDeg, maxDeg);
  }
  const returnStep = sim.steeringReturnDegPerSec * dt;
  if (Math.abs(angleDeg) <= returnStep) return 0;
  return angleDeg - Math.sign(angleDeg) * returnStep;
}

// Speed is a magnitude; gear R limits it to the vehicle's reverse top speed.
export function nextSpeed(speedMs, { accel, brake }, gear, mode, vehicle, dt) {
  if (gear === 'P') return 0;
  const driving = gear === 'D' || gear === 'R';
  let acceleration = driving ? accel * mode.maxAccelMs2 : 0;
  if (!driving || accel === 0) acceleration -= mode.coastDecelMs2;
  acceleration -= brake * vehicle.maxBrakeDecelMs2;
  const maxKmh = gear === 'R' ? vehicle.maxReverseKmh : vehicle.maxSpeedKmh;
  return clamp(speedMs + acceleration * dt, 0, kmhToMs(maxKmh));
}

export function canShift(targetGear, speedKmh, gearChangeMaxKmh) {
  return targetGear === 'N' || speedKmh <= gearChangeMaxKmh;
}

export const INITIAL_SIM_STATE = { speedMs: 0, steeringDeg: 0, accel: 0, brake: 0, tripKm: 0 };

export function stepSimulation(prev, inputs, { vehicle, mode, gear, sim }, dt) {
  const accel = rampPedal(prev.accel, inputs.accel, dt, sim.pedalRampSeconds);
  const brake = rampPedal(prev.brake, inputs.brake, dt, sim.pedalRampSeconds);
  const speedMs = nextSpeed(prev.speedMs, { accel, brake }, gear, mode, vehicle, dt);
  const steeringDeg = nextSteering(prev.steeringDeg, inputs, dt, sim, vehicle.maxSteeringDeg);
  const tripKm = prev.tripKm + ((prev.speedMs + speedMs) / 2) * dt / 1000;
  return { speedMs, steeringDeg, accel, brake, tripKm };
}
