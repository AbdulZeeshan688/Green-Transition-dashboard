import { describe, expect, it, vi } from 'vitest';
import { isExternalFresh, mergeInputs, parseControlMessage } from './driverInput';
import { stepSimulation } from './vehicleModel';
import { connectWheel } from '../services/inputs/websocketWheel';

describe('parseControlMessage (external steering wheel)', () => {
  it('accepts absolute degrees and clamps to the steering lock', () => {
    expect(parseControlMessage({ type: 'controls', steeringDeg: -90 }, 540)).toEqual({ steeringDeg: -90 });
    expect(parseControlMessage({ type: 'controls', steeringDeg: 900 }, 540)).toEqual({ steeringDeg: 540 });
  });

  it('scales normalised steering (-1..1) to the steering lock', () => {
    expect(parseControlMessage({ type: 'controls', steering: 0.5 }, 540)).toEqual({ steeringDeg: 270 });
  });

  it('clamps pedals to 0..1 and accepts valid gears only', () => {
    expect(parseControlMessage({ type: 'controls', throttle: 1.4, brake: -1, gear: 'd' }, 540)).toEqual({
      throttle: 1,
      brake: 0,
      gear: 'D',
    });
    expect(parseControlMessage({ type: 'controls', gear: 'X' }, 540)).toEqual({});
  });

  it('ignores messages that are not controls', () => {
    expect(parseControlMessage({ type: 'hello' }, 540)).toBeNull();
    expect(parseControlMessage(null, 540)).toBeNull();
  });
});

describe('isExternalFresh (safety timeout)', () => {
  it('drops input that is older than staleMs', () => {
    expect(isExternalFresh({ controls: {}, receivedAt: 1000 }, 1400, 500)).toBe(true);
    expect(isExternalFresh({ controls: {}, receivedAt: 1000 }, 1600, 500)).toBe(false);
    expect(isExternalFresh(null, 1000, 500)).toBe(false);
  });
});

describe('mergeInputs', () => {
  const noKeys = { accel: false, brake: false, left: false, right: false };

  it('uses local keys only when there is no external input', () => {
    expect(mergeInputs({ ...noKeys, accel: true, left: true }, null)).toEqual({
      accel: 1,
      brake: 0,
      left: true,
      right: false,
      analogPedals: false,
    });
  });

  it('takes the wheel angle and the stronger pedal value', () => {
    const merged = mergeInputs({ ...noKeys, brake: true }, { controls: { steeringDeg: 45, throttle: 0.3 } });
    expect(merged).toMatchObject({ steeringDeg: 45, accel: 0.3, brake: 1, analogPedals: true });
  });

  it('a wheel angle drives the simulation directly', () => {
    const sim = { pedalRampSeconds: 0.8, steeringRateDegPerSec: 360, steeringReturnDegPerSec: 540 };
    const vehicle = { maxSpeedKmh: 160, maxReverseKmh: 20, maxBrakeDecelMs2: 8, maxSteeringDeg: 540 };
    const mode = { maxAccelMs2: 2, coastDecelMs2: 0.5 };
    const prev = { speedMs: 0, steeringDeg: 0, accel: 0, brake: 0, tripKm: 0, roadM: 0 };
    const inputs = mergeInputs(noKeys, { controls: { steeringDeg: -120, throttle: 0.6 } });
    const next = stepSimulation(prev, inputs, { vehicle, mode, gear: 'D', sim, ready: true }, 0.05);
    expect(next.steeringDeg).toBe(-120);
    expect(next.accel).toBeCloseTo(0.6); // analog pedal followed directly, no ramp
  });
});

describe('connectWheel (WebSocket transport)', () => {
  class FakeSocket {
    static last = null;
    constructor(url) {
      this.url = url;
      this.readyState = 0;
      this.sent = [];
      FakeSocket.last = this;
    }
    send(data) {
      this.sent.push(data);
    }
    close() {}
  }

  it('reports status, parses messages and reconnects after a drop', () => {
    vi.useFakeTimers();
    const statuses = [];
    const controls = [];
    const conn = connectWheel({
      url: 'ws://wheel',
      reconnectSeconds: 2,
      getMaxSteeringDeg: () => 540,
      onStatus: (s) => statuses.push(s),
      onControls: (c) => controls.push(c),
      WebSocketImpl: FakeSocket,
    });
    const first = FakeSocket.last;
    expect(first.url).toBe('ws://wheel');
    first.readyState = 1;
    first.onopen();
    first.onmessage({ data: JSON.stringify({ type: 'controls', steering: -1, throttle: 0.2 }) });
    first.onmessage({ data: 'not json' });
    conn.send({ type: 'state', speedKmh: 10 });
    expect(controls).toEqual([{ steeringDeg: -540, throttle: 0.2 }]);
    expect(JSON.parse(first.sent[0])).toEqual({ type: 'state', speedKmh: 10 });

    first.onclose();
    vi.advanceTimersByTime(2000);
    expect(FakeSocket.last).not.toBe(first); // a new connection attempt
    expect(statuses).toEqual(['connecting', 'connected', 'disconnected', 'connecting']);
    conn.close();
    vi.useRealTimers();
  });
});
