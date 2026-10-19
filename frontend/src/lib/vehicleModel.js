// Pure driving-simulation functions. No React, no constants: every tuning value
// comes from vehicles.json, drive-modes.json or simulation.json.

export const msToKmh = (ms) => ms * 3.6;
export const kmhToMs = (kmh) => kmh / 3.6;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Keyboard pedals ramp towards their target over `rampSeconds` instead of
// jumping. `target` is true/false (key held) or a pedal position 0..1.
export function rampPedal(current, target, dt, rampSeconds) {
  const goal = typeof target === 'number' ? clamp(target, 0, 1) : target ? 1 : 0;
  const delta = dt / rampSeconds;
  return goal > current ? Math.min(goal, current + delta) : Math.max(goal, current - delta);
}

// An external wheel sends an absolute angle (`steeringDeg`), which is used as-is.
// Keyboard/touch steering turns at a fixed rate while held and self-centres.
export function nextSteering(angleDeg, { left, right, steeringDeg }, dt, sim, maxDeg) {
  if (typeof steeringDeg === 'number') return clamp(steeringDeg, -maxDeg, maxDeg);
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
// brake and steering still respond, as in a real car. Real (analog) pedals
// from an external device are followed directly instead of ramped.
export function stepSimulation(prev, inputs, { vehicle, mode, gear, sim, ready }, dt) {
  const accelTarget = ready ? inputs.accel : 0;
  const accel = inputs.analogPedals
    ? clamp(Number(accelTarget) || 0, 0, 1)
    : rampPedal(prev.accel, accelTarget, dt, sim.pedalRampSeconds);
  const brake = inputs.analogPedals
    ? clamp(Number(inputs.brake) || 0, 0, 1)
    : rampPedal(prev.brake, inputs.brake, dt, sim.pedalRampSeconds);
  const speedMs = nextSpeed(prev.speedMs, { accel, brake }, gear, mode, vehicle, dt);
  const steeringDeg = nextSteering(prev.steeringDeg, inputs, dt, sim, vehicle.maxSteeringDeg);
  const travelledM = ((prev.speedMs + speedMs) / 2) * dt;
  const tripKm = prev.tripKm + travelledM / 1000;
  // Signed distance for the road animation: negative while reversing.
  const roadM = prev.roadM + (gear === 'R' ? -travelledM : travelledM);
  return { speedMs, steeringDeg, accel, brake, tripKm, roadM };
}
