import { describe, expect, it } from 'vitest';
import { chargeStep, chargingPower, energyToLimitKWh, formatDuration, hoursToLimit } from './charging';
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
    expect(systemsSummary(systems, { motor: 'ok', abs: 'ok' })).toEqual({
      level: 'ok',
      drivingBlocked: false,
      blockedBy: [],
    });
  });

  it('reports the worst level; only blocking systems stop driving', () => {
    expect(systemsSummary(systems, { motor: 'ok', abs: 'error' })).toMatchObject({
      level: 'error',
      drivingBlocked: false,
    });
    expect(systemsSummary(systems, { motor: 'error', abs: 'warning' })).toMatchObject({
      level: 'error',
      drivingBlocked: true,
      blockedBy: ['Motor'],
    });
    expect(systemsSummary(systems, { motor: 'warning', abs: 'ok' })).toMatchObject({
      level: 'warning',
      drivingBlocked: false,
    });
  });
});

describe('chargingPower (charger vs car limits)', () => {
  const ac = { type: 'AC', port: 'Type 2', powerKW: 11 };
  const dc = { type: 'DC', port: 'CCS2', powerKW: 150 };
  const polestar = {
    make: 'Polestar',
    model: '2',
    batteryCapacity: 78,
    charging: { ac: { port: 'Type 2', maxKW: 11 }, dc: { port: 'CCS2', maxKW: 149, minutes10to80: 34 } },
  };

  it('AC is limited by the lower of charger and car', () => {
    expect(chargingPower(ac, polestar)).toMatchObject({ compatible: true, kw: 11 });
    const small = { ...polestar, charging: { ac: { port: 'Type 2', maxKW: 7.4 } } };
    expect(chargingPower(ac, small)).toMatchObject({ kw: 7.4, note: 'limited by the car' });
  });

  it('DC uses the average power over 10–80 % when the time is known', () => {
    const p = chargingPower(dc, polestar);
    expect(p.kw).toBeCloseTo((0.7 * 78) / (34 / 60)); // ≈ 96 kW, below the 149 kW peak
  });

  it('a car with another plug cannot use the charger', () => {
    const leaf = {
      make: 'Nissan',
      model: 'Leaf',
      batteryCapacity: 40,
      charging: { dc: { port: 'CHAdeMO', maxKW: 50 } },
    };
    expect(chargingPower(dc, leaf)).toMatchObject({ compatible: false, kw: 0 });
  });

  it('without verified specs the charger power is used and flagged', () => {
    expect(chargingPower(dc, { make: 'X', model: 'Y', batteryCapacity: 60 })).toEqual({
      compatible: true,
      kw: 150,
      note: 'car limit not verified',
    });
  });
});
