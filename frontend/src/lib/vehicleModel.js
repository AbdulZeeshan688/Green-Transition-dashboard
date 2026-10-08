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

// Only P allows switching the vehicle off (P already holds the car at standstill).
export function canPowerOff(gear) {
  return gear === 'P';
}

export const INITIAL_SIM_STATE = { speedMs: 0, steeringDeg: 0, accel: 0, brake: 0, tripKm: 0, roadM: 0 };

// `ready` = vehicle switched on. When off, the accelerator does nothing;
// brake and steering still respond, as in a real car.
export function stepSimulation(prev, inputs, { vehicle, mode, gear, sim, ready }, dt) {
  const accel = rampPedal(prev.accel, ready && inputs.accel, dt, sim.pedalRampSeconds);
  const brake = rampPedal(prev.brake, inputs.brake, dt, sim.pedalRampSeconds);
  const speedMs = nextSpeed(prev.speedMs, { accel, brake }, gear, mode, vehicle, dt);
  const steeringDeg = nextSteering(prev.steeringDeg, inputs, dt, sim, vehicle.maxSteeringDeg);
  const travelledM = ((prev.speedMs + speedMs) / 2) * dt;
  const tripKm = prev.tripKm + travelledM / 1000;
  // Signed distance for the road animation: negative while reversing.
  const roadM = prev.roadM + (gear === 'R' ? -travelledM : travelledM);
  return { speedMs, steeringDeg, accel, brake, tripKm, roadM };
}
