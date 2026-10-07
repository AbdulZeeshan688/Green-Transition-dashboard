import { describe, expect, it } from 'vitest';
import {
  averageSpeedKmh,
  baseEnergyRate,
  batteryUsagePercent,
  classifyRoutes,
  co2Kg,
  elevationTotals,
  estimateRangeKm,
  evaluateRoute,
  haversineKm,
  remainingSocPercent,
  routeEnergy,
} from './energyModel';

const model = { uphillKWhPerM: 0.001, regenKWhPerM: 0.0005, gridCo2GPerKWh: 32 };
const vehicle = { batteryCapacity: 75, energyConsumption: 16.0 }; // Sanjeev's EV-001

describe('Sanjeev energy model', () => {
  it('haversine: Lahti -> Helsinki is about 100 km', () => {
    expect(haversineKm(60.9827, 25.6615, 60.1699, 24.9384)).toBeCloseTo(100, -1);
  });

  it('base rate converts kWh/100 km to kWh/km', () => {
    expect(baseEnergyRate(vehicle)).toBe(0.16);
  });

  it('sums climbs and descents separately', () => {
    expect(elevationTotals([100, 110, 105, 120, 90])).toEqual({ totalUphill: 25, totalDownhill: 35 });
  });

  it('energy = distance × rate + uphill × 0.001 − downhill × 0.0005', () => {
    const e = routeEnergy({ distanceKm: 100, totalUphill: 200, totalDownhill: 400 }, vehicle, model);
    expect(e.drivingKWh).toBeCloseTo(16);
    expect(e.uphillKWh).toBeCloseTo(0.2);
    expect(e.regeneratedKWh).toBeCloseTo(0.2);
    expect(e.energyKWh).toBeCloseTo(16);
  });

  it('energy never goes negative', () => {
    const e = routeEnergy({ distanceKm: 0.1, totalUphill: 0, totalDownhill: 1000 }, vehicle, model);
    expect(e.energyKWh).toBe(0);
  });

  it('battery usage, CO2, average speed', () => {
    expect(batteryUsagePercent(15, vehicle)).toBe(20);
    expect(co2Kg(10, 32)).toBeCloseTo(0.32);
    expect(averageSpeedKmh(30, 20)).toBe(90);
    expect(averageSpeedKmh(30, 0)).toBe(0);
  });

  it('live battery and range', () => {
    expect(remainingSocPercent(80, 15, vehicle)).toBe(60);
    expect(remainingSocPercent(5, 15, vehicle)).toBe(0);
    expect(estimateRangeKm(80, vehicle)).toBeCloseTo(375);
  });

  it('evaluateRoute adds all metrics', () => {
    const r = evaluateRoute({ id: 'x', distanceKm: 50, durationMin: 30, totalUphill: 0, totalDownhill: 0 }, vehicle, model);
    expect(r.energyKWh).toBeCloseTo(8);
    expect(r.batteryUsagePercent).toBeCloseTo(10.667, 2);
    expect(r.co2Kg).toBeCloseTo(0.256);
    expect(r.averageSpeedKmh).toBe(100);
  });
});

describe('classifyRoutes (fastest = min time, eco = min energy)', () => {
  it('separates eco and fastest when they differ', () => {
    const routes = [
      { id: 'motorway', durationMin: 18, energyKWh: 3.4 },
      { id: 'direct', durationMin: 26, energyKWh: 2.6 },
    ];
    expect(classifyRoutes(routes)).toEqual({ fastestId: 'motorway', ecoId: 'direct' });
  });

  it('fastest is also eco when nothing uses less energy', () => {
    const routes = [
      { id: 'a', durationMin: 10, energyKWh: 2 },
      { id: 'b', durationMin: 15, energyKWh: 2 },
    ];
    expect(classifyRoutes(routes)).toEqual({ fastestId: 'a', ecoId: 'a' });
  });

  it('handles no routes', () => {
    expect(classifyRoutes([])).toEqual({ fastestId: null, ecoId: null });
  });
});
