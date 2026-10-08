import { describe, expect, it } from 'vitest';
import { canPowerOff, canShift, kmhToMs, nextSpeed, nextSteering, rampPedal, stepSimulation } from './vehicleModel';

const vehicle = { maxSpeedKmh: 160, maxReverseKmh: 20, maxBrakeDecelMs2: 8, maxSteeringDeg: 540 };
const mode = { maxAccelMs2: 2, coastDecelMs2: 0.5 };
const sim = { pedalRampSeconds: 0.8, steeringRateDegPerSec: 360, steeringReturnDegPerSec: 540 };

describe('rampPedal', () => {
  it('reaches full press after the ramp time and releases back to 0', () => {
    expect(rampPedal(0, true, 0.4, 0.8)).toBeCloseTo(0.5);
    expect(rampPedal(0.9, true, 0.4, 0.8)).toBe(1);
    expect(rampPedal(0.2, false, 0.4, 0.8)).toBe(0);
  });
});

describe('nextSpeed', () => {
  it('accelerates in D using the drive-mode acceleration', () => {
    expect(nextSpeed(0, { accel: 1, brake: 0 }, 'D', mode, vehicle, 1)).toBeCloseTo(2);
  });
  it('does not move in P and does not drive in N', () => {
    expect(nextSpeed(10, { accel: 1, brake: 0 }, 'P', mode, vehicle, 1)).toBe(0);
    expect(nextSpeed(10, { accel: 1, brake: 0 }, 'N', mode, vehicle, 1)).toBeCloseTo(9.5);
  });
  it('caps at top speed and reverse top speed', () => {
    expect(nextSpeed(kmhToMs(160), { accel: 1, brake: 0 }, 'D', mode, vehicle, 1)).toBeCloseTo(kmhToMs(160));
    expect(nextSpeed(kmhToMs(20), { accel: 1, brake: 0 }, 'R', mode, vehicle, 1)).toBeCloseTo(kmhToMs(20));
  });
  it('never goes below zero when braking', () => {
    expect(nextSpeed(1, { accel: 0, brake: 1 }, 'D', mode, vehicle, 1)).toBe(0);
  });
});

describe('nextSteering', () => {
  it('turns while held, clamps at max lock and self-centres', () => {
    expect(nextSteering(0, { left: false, right: true }, 0.5, sim, 540)).toBe(180);
    expect(nextSteering(500, { left: false, right: true }, 0.5, sim, 540)).toBe(540);
    expect(nextSteering(100, { left: false, right: false }, 0.1, sim, 540)).toBeCloseTo(46);
    expect(nextSteering(20, { left: false, right: false }, 0.1, sim, 540)).toBe(0);
  });
});

describe('stepSimulation', () => {
  it('accumulates trip distance from speed', () => {
    const next = stepSimulation(
      { speedMs: 10, steeringDeg: 0, accel: 0, brake: 0, tripKm: 0 },
      { accel: false, brake: false, left: false, right: false },
      { vehicle, mode: { ...mode, coastDecelMs2: 0 }, gear: 'D', sim },
      1,
    );
    expect(next.tripKm).toBeCloseTo(0.01);
  });
});

describe('canShift', () => {
  it('only allows P/R/D below the shift speed, N anytime', () => {
    expect(canShift('P', 50, 3)).toBe(false);
    expect(canShift('N', 50, 3)).toBe(true);
    expect(canShift('R', 2, 3)).toBe(true);
  });
});

describe('power state', () => {
  const idle = { speedMs: 0, steeringDeg: 0, accel: 0, brake: 0, tripKm: 0, roadM: 0 };
  const pressAccel = { accel: true, brake: false, left: false, right: true };

  it('ignores the accelerator while the vehicle is off, but still steers', () => {
    const next = stepSimulation(idle, pressAccel, { vehicle, mode, gear: 'D', sim, ready: false }, 0.4);
    expect(next.accel).toBe(0);
    expect(next.speedMs).toBe(0);
    expect(next.steeringDeg).toBeGreaterThan(0);
  });

  it('accelerates once the vehicle is ready', () => {
    const next = stepSimulation(idle, pressAccel, { vehicle, mode, gear: 'D', sim, ready: true }, 0.4);
    expect(next.accel).toBeCloseTo(0.5);
    expect(next.speedMs).toBeGreaterThan(0);
  });

  it('road distance runs backwards in reverse', () => {
    const moving = { ...idle, speedMs: 2 };
    const ctx = { vehicle, mode: { ...mode, coastDecelMs2: 0 }, sim, ready: true };
    expect(stepSimulation(moving, {}, { ...ctx, gear: 'D' }, 1).roadM).toBeCloseTo(2);
    expect(stepSimulation(moving, {}, { ...ctx, gear: 'R' }, 1).roadM).toBeCloseTo(-2);
  });

  it('can only switch off in P', () => {
    expect(canPowerOff('P')).toBe(true);
    expect(canPowerOff('D')).toBe(false);
  });
});
