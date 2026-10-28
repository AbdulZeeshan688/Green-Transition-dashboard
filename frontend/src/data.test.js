// Validates the editable JSON files so a typo by anyone editing them is caught
// by `npm test` instead of breaking the dashboard at runtime.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TOUCHSCREEN_PANELS } from './lib/panels';
import { STATUS_LEVELS } from './lib/vehicleSystems';

const load = (name) => JSON.parse(readFileSync(new URL(`../public/data/${name}.json`, import.meta.url), 'utf8'));

const ui = load('ui');
const vehicles = load('vehicles');
const state = load('vehicle-state');
const modes = load('drive-modes');
const sim = load('simulation');
const { places, routes } = load('routes');
const scoring = load('scoring');
const energyModel = load('energy-model');
const charging = load('charging');
const systemsCfg = load('vehicle-systems');
const integrations = load('integrations');
const cabinCfg = load('cabin');

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
    for (const v of vehicles.filter((x) => x.image)) {
      expect(existsSync(new URL(`../public/${v.image}`, import.meta.url)), `${v.registrationNumber}.image`).toBe(true);
    }
    const wheels = [sim.vehicleDefaults.steeringWheelImage, ...vehicles.map((v) => v.steeringWheelImage)].filter(
      Boolean,
    );
    for (const img of wheels) expect(existsSync(new URL(`../public/${img}`, import.meta.url)), img).toBe(true);
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

  it('power-on state is consistent', () => {
    expect(typeof state.powerOn).toBe('boolean');
    if (!state.powerOn) expect(state.gear).toBe('P');
  });

  it('simulation timing values are positive', () => {
    expect(sim.roadDashPx.length).toBe(2);
    sim.roadDashPx.forEach((n) => expect(positive(n)).toBe(true));
    for (const key of [
      'tickMs',
      'pedalRampSeconds',
      'steeringRateDegPerSec',
      'steeringReturnDegPerSec',
      'climateStepC',
      'startupSeconds',
      'roadScrollPxPerM',
    ]) {
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
    const computed = [
      'distanceKm',
      'durationMin',
      'totalUphill',
      'totalDownhill',
      'energyKWh',
      'co2Kg',
      'batteryUsagePercent',
      'regeneratedKWh',
      'averageSpeedKmh',
    ];
    for (const m of scoring.metrics) {
      expect(computed, m.key).toContain(m.key);
      expect(['lower', 'higher']).toContain(m.better);
      expect(m.weight).toBeGreaterThanOrEqual(0);
    }
  });

  it('every tab/tile link points at an existing tab or touchscreen panel', () => {
    const tabIds = new Set(ui.tabs.map((t) => t.id));
    const items = [...ui.touchscreen.tiles, ...ui.touchscreen.sideNav];
    for (const l of items.filter((x) => x.opensTab)) expect(tabIds.has(l.opensTab), l.id).toBe(true);
    for (const l of items.filter((x) => x.opensPanel)) expect(TOUCHSCREEN_PANELS, l.id).toContain(l.opensPanel);
  });

  it('charging settings are consistent', () => {
    for (const key of ['chargerPowerKW', 'limitStepPercent', 'demoTimeScale']) {
      expect(positive(charging[key]), key).toBe(true);
    }
    expect(charging.limitMinPercent).toBeLessThan(charging.limitMaxPercent);
    expect(charging.limitMaxPercent).toBeLessThanOrEqual(100);
    expect(charging.defaultLimitPercent).toBeGreaterThanOrEqual(charging.limitMinPercent);
    expect(charging.defaultLimitPercent).toBeLessThanOrEqual(charging.limitMaxPercent);
  });

  it('integrations: default sources exist and backend places have coordinates', () => {
    for (const group of [integrations.driverInput, integrations.routes]) {
      expect(unique(group.sources.map((x) => x.id))).toBe(true);
      expect(
        group.sources.some((x) => x.id === group.defaultSource),
        group.defaultSource,
      ).toBe(true);
    }
    const wheel = integrations.driverInput.wheel;
    expect(wheel.url).toMatch(/^wss?:\/\//);
    for (const key of ['reconnectSeconds', 'staleMs', 'stateIntervalMs']) expect(positive(wheel[key]), key).toBe(true);
    const backend = integrations.routes.backend;
    expect(backend.path.startsWith('/')).toBe(true);
    expect(backend.places.length).toBeGreaterThanOrEqual(2);
    for (const p of backend.places) {
      expect(p.coords, p.id).toHaveLength(2);
      const [lon, lat] = p.coords;
      expect(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90, p.id).toBe(true);
    }
  });

  it('cabin settings are consistent', () => {
    const { climate, lights, body, audio, phone } = cabinCfg;
    expect(positive(climate.fanLevels) && positive(climate.seatHeatLevels)).toBe(true);
    expect(climate.defaults.fanLevel).toBeLessThanOrEqual(climate.fanLevels);
    expect(climate.defaults.passengerTempC).toBeGreaterThanOrEqual(sim.climateMinC);
    expect(climate.defaults.passengerTempC).toBeLessThanOrEqual(sim.climateMaxC);
    expect(lights.headlightModes.map((m) => m.id)).toContain(lights.defaults.headlights);
    expect(lights.ambientColors.map((c) => c.id)).toContain(lights.defaults.ambientColor);
    lights.ambientColors.forEach((c) => expect(c.hex, c.id).toMatch(/^#[0-9a-f]{6}$/i));
    const partIds = body.parts.map((p) => p.id);
    body.openOnlyWhenParked.forEach((id) => expect(partIds).toContain(id));
    expect(Object.keys(body.defaults.open).sort()).toEqual([...partIds].sort());
    expect(audio.defaults.volume).toBeLessThanOrEqual(audio.volumeMax);
    expect(positive(phone.pairingSeconds)).toBe(true);
  });

  it('vehicle-system scenarios use known systems and valid states', () => {
    const ids = new Set(systemsCfg.systems.map((x) => x.id));
    expect(unique(systemsCfg.systems.map((x) => x.id))).toBe(true);
    expect(systemsCfg.scenarios.some((x) => x.id === systemsCfg.defaultScenario)).toBe(true);
    for (const level of STATUS_LEVELS) {
      expect(typeof systemsCfg.statusLabels[level], level).toBe('string');
      expect(typeof systemsCfg.headerLabels[level], level).toBe('string');
    }
    for (const sc of systemsCfg.scenarios) {
      for (const [sys, st] of Object.entries(sc.states)) {
        expect(ids.has(sys), `${sc.id}.${sys}`).toBe(true);
        expect(STATUS_LEVELS, `${sc.id}.${sys}`).toContain(st);
      }
    }
  });
});
