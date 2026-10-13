import { describe, expect, it } from 'vitest';
import { chargeStep, energyToLimitKWh, formatDuration, hoursToLimit } from './charging';
import { systemsSummary } from './vehicleSystems';

const vehicle = { batteryCapacity: 80 };

describe('charging', () => {
  it('energy and real time to reach the limit', () => {
    expect(energyToLimitKWh(50, 80, vehicle)).toBeCloseTo(24);
    expect(hoursToLimit(50, 80, 11, vehicle)).toBeCloseTo(24 / 11);
    expect(energyToLimitKWh(90, 80, vehicle)).toBe(0);
  });

  it('adds power × time as SoC and stops at the limit', () => {
    expect(chargeStep(50, 80, 8, vehicle, 1)).toBeCloseTo(60); // 8 kWh of 80 = 10 %
    expect(chargeStep(78, 80, 8, vehicle, 1)).toBe(80);
  });

  it('formats durations', () => {
    expect(formatDuration(2.25)).toBe('2 h 15 min');
    expect(formatDuration(0.5)).toBe('30 min');
  });
});

describe('systemsSummary', () => {
  const systems = [
    { id: 'motor', label: 'Motor', blocksDriving: true },
    { id: 'abs', label: 'ABS', blocksDriving: false },
  ];

  it('is ok when all systems are ok', () => {
    expect(systemsSummary(systems, { motor: 'ok', abs: 'ok' })).toEqual({ level: 'ok', drivingBlocked: false, blockedBy: [] });
  });

  it('reports the worst level; only blocking systems stop driving', () => {
    expect(systemsSummary(systems, { motor: 'ok', abs: 'error' })).toMatchObject({ level: 'error', drivingBlocked: false });
    expect(systemsSummary(systems, { motor: 'error', abs: 'warning' })).toMatchObject({
      level: 'error',
      drivingBlocked: true,
      blockedBy: ['Motor'],
    });
    expect(systemsSummary(systems, { motor: 'warning', abs: 'ok' })).toMatchObject({ level: 'warning', drivingBlocked: false });
  });
});
