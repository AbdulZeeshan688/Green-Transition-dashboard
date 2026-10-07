// Validates the editable JSON files so a typo by anyone editing them is caught
// by `npm test` instead of breaking the dashboard at runtime.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const load = (name) => JSON.parse(readFileSync(new URL(`../public/data/${name}.json`, import.meta.url), 'utf8'));

const ui = load('ui');
const vehicles = load('vehicles');
const state = load('vehicle-state');
const modes = load('drive-modes');
const sim = load('simulation');
const { places, routes } = load('routes');
const scoring = load('scoring');
const energyModel = load('energy-model');

const unique = (list) => new Set(list).size === list.length;
const positive = (n) => typeof n === 'number' && n > 0;

describe('data files', () => {
  it('vehicles have unique registrations and positive specs', () => {
    expect(unique(vehicles.map((v) => v.registrationNumber))).toBe(true);
    for (const v of vehicles) {
      for (const key of ['batteryCapacity', 'energyConsumption', 'maxSpeedKmh']) {
        expect(positive(v[key]), `${v.registrationNumber}.${key}`).toBe(true);
      }
    }
    for (const key of ['maxReverseKmh', 'maxBrakeDecelMs2', 'maxSteeringDeg']) {
      expect(positive(sim.vehicleDefaults[key]), key).toBe(true);
    }
  });

  it('energy model constants are present and non-negative', () => {
    for (const key of ['uphillKWhPerM', 'regenKWhPerM', 'gridCo2GPerKWh']) {
      expect(typeof energyModel[key], key).toBe('number');
      expect(energyModel[key], key).toBeGreaterThanOrEqual(0);
    }
  });

  it('vehicle state references existing vehicle and drive mode', () => {
    expect(vehicles.some((v) => v.registrationNumber === state.registrationNumber)).toBe(true);
    expect(modes.some((m) => m.id === state.driveMode)).toBe(true);
    expect(['P', 'R', 'N', 'D']).toContain(state.gear);
    expect(state.socPercent).toBeGreaterThanOrEqual(0);
    expect(state.socPercent).toBeLessThanOrEqual(100);
    expect(state.cabinTempC).toBeGreaterThanOrEqual(sim.climateMinC);
    expect(state.cabinTempC).toBeLessThanOrEqual(sim.climateMaxC);
  });

  it('drive modes are unique and physically sensible', () => {
    expect(unique(modes.map((m) => m.id))).toBe(true);
    for (const m of modes) {
      expect(positive(m.maxAccelMs2), m.id).toBe(true);
      expect(m.coastDecelMs2, m.id).toBeGreaterThanOrEqual(0);
      expect(typeof m.regen).toBe('boolean');
    }
  });

  it('simulation timing values are positive', () => {
    for (const key of ['tickMs', 'pedalRampSeconds', 'steeringRateDegPerSec', 'steeringReturnDegPerSec', 'climateStepC']) {
      expect(positive(sim[key]), key).toBe(true);
    }
  });

  it('routes reference known places and have complete metrics', () => {
    const placeIds = new Set(places.map((p) => p.id));
    expect(unique(places.map((p) => p.id))).toBe(true);
    expect(unique(routes.map((r) => r.id))).toBe(true);
    for (const r of routes) {
      expect(placeIds.has(r.originId), r.id).toBe(true);
      expect(placeIds.has(r.destinationId), r.id).toBe(true);
      for (const key of ['distanceKm', 'durationMin', 'totalUphill', 'totalDownhill']) {
        expect(typeof r[key], `${r.id}.${key}`).toBe('number');
      }
      expect(r.path.length, r.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('scoring metrics are valid and exist on evaluated routes', () => {
    const computed = ['distanceKm', 'durationMin', 'totalUphill', 'totalDownhill', 'energyKWh', 'co2Kg', 'batteryUsagePercent', 'regeneratedKWh', 'averageSpeedKmh'];
    for (const m of scoring.metrics) {
      expect(computed, m.key).toContain(m.key);
      expect(['lower', 'higher']).toContain(m.better);
      expect(m.weight).toBeGreaterThanOrEqual(0);
    }
  });

  it('every tab/tile link points at an existing tab', () => {
    const tabIds = new Set(ui.tabs.map((t) => t.id));
    const links = [...ui.touchscreen.tiles, ...ui.touchscreen.sideNav].filter((x) => x.opensTab);
    for (const l of links) expect(tabIds.has(l.opensTab), l.id).toBe(true);
  });
});
