import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cabinReducer, canOpenPart, initialCabin, openParts, shouldAutoLock } from './cabin';

const cfg = JSON.parse(readFileSync(new URL('../../public/data/cabin.json', import.meta.url), 'utf8'));
const start = () => initialCabin(cfg, { driverTempC: 22 });

describe('cabin reducer', () => {
  it('starts from cabin.json defaults', () => {
    const c = start();
    expect(c.climate.driverTempC).toBe(22);
    expect(c.lights.headlights).toBe(cfg.lights.defaults.headlights);
    expect(c.body.locked).toBe(cfg.body.defaults.locked);
  });

  it('changes temperature within limits, and both zones when synced', () => {
    let c = cabinReducer(start(), { type: 'temp', zone: 'driver', delta: 1, min: 16, max: 28 });
    expect(c.climate.driverTempC).toBe(23);
    expect(c.climate.passengerTempC).toBe(23); // sync on by default
    c = cabinReducer(c, { type: 'toggle', group: 'climate', key: 'syncTemps' });
    c = cabinReducer(c, { type: 'temp', zone: 'passenger', delta: 10, min: 16, max: 28 });
    expect(c.climate.passengerTempC).toBe(28);
    expect(c.climate.driverTempC).toBe(23);
  });

  it('manual fan level switches auto off; seat heat cycles back to 0', () => {
    let c = cabinReducer(start(), { type: 'fan', level: 9, max: 7 });
    expect(c.climate).toMatchObject({ fanLevel: 7, fanAuto: false });
    for (let i = 0; i < 4; i++) c = cabinReducer(c, { type: 'seatHeat', seat: 'driver', levels: 3 });
    expect(c.climate.seatHeat.driver).toBe(0);
    c = cabinReducer(c, { type: 'seatHeat', seat: 'driver', levels: 3 });
    expect(c.climate.seatHeat.driver).toBe(1);
  });

  it('left and right signals exclude each other; hazard is separate', () => {
    let c = cabinReducer(start(), { type: 'signal', side: 'left' });
    c = cabinReducer(c, { type: 'signal', side: 'right' });
    expect(c.signals).toEqual({ left: false, right: true, hazard: false });
    c = cabinReducer(c, { type: 'signal', side: 'hazard' });
    expect(c.signals.hazard).toBe(true);
  });

  it('volume is clamped and unmutes', () => {
    let c = cabinReducer(start(), { type: 'toggle', group: 'audio', key: 'muted' });
    c = cabinReducer(c, { type: 'volume', value: 99, max: 30 });
    expect(c.audio).toEqual({ volume: 30, muted: false });
  });

  it('calls start and end', () => {
    let c = cabinReducer(start(), { type: 'call', number: '112', at: 5 });
    expect(c.phone.call).toEqual({ number: '112', startedAt: 5 });
    c = cabinReducer(c, { type: 'hangup' });
    expect(c.phone.call).toBeNull();
  });
});

describe('cabin rules', () => {
  it('trunk / charge port only open when parked', () => {
    expect(canOpenPart('trunk', { speedKmh: 0, gear: 'P' }, cfg.body)).toBe(true);
    expect(canOpenPart('trunk', { speedKmh: 20, gear: 'D' }, cfg.body)).toBe(false);
    expect(canOpenPart('chargePort', { speedKmh: 0, gear: 'D' }, cfg.body)).toBe(false);
  });

  it('doors auto-lock above autoLockKmh and open parts are listed', () => {
    let c = cabinReducer(start(), { type: 'set', group: 'body', key: 'locked', value: false });
    expect(shouldAutoLock(c, cfg.body.autoLockKmh - 1, cfg.body)).toBe(false);
    expect(shouldAutoLock(c, cfg.body.autoLockKmh, cfg.body)).toBe(true);
    c = cabinReducer(c, { type: 'bodyPart', part: 'trunk', open: true });
    expect(openParts(c, cfg.body)).toEqual(['Trunk']);
  });
});
