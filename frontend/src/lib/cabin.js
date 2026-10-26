// Cabin and body state (climate, lights, signals, doors, audio, phone) as a
// pure reducer: every touchscreen / bottom-bar button dispatches an action here.
// Limits and starting values come from cabin.json and simulation.json.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function initialCabin(cabinCfg, { driverTempC }) {
  const c = cabinCfg;
  return {
    climate: {
      driverTempC,
      ...c.climate.defaults,
      seatHeat: { ...c.climate.defaults.seatHeat },
    },
    lights: { ...c.lights.defaults },
    signals: { left: false, right: false, hazard: false },
    body: { ...c.body.defaults, open: { ...c.body.defaults.open } },
    audio: { ...c.audio.defaults },
    phone: { ...c.phone.defaults, call: null },
  };
}

const update = (state, group, patch) => ({ ...state, [group]: { ...state[group], ...patch } });

export function cabinReducer(state, action) {
  switch (action.type) {
    // Generic on/off and set, for simple switches (A/C, fog lights, child lock…)
    case 'toggle':
      return update(state, action.group, { [action.key]: !state[action.group][action.key] });
    case 'set':
      return update(state, action.group, { [action.key]: action.value });

    // Temperature: with sync on, both zones follow the changed one.
    case 'temp': {
      const key = action.zone === 'passenger' ? 'passengerTempC' : 'driverTempC';
      const value = clamp(state.climate[key] + action.delta, action.min, action.max);
      const patch = state.climate.syncTemps ? { driverTempC: value, passengerTempC: value } : { [key]: value };
      return update(state, 'climate', patch);
    }
    // Choosing a fan level switches automatic fan control off.
    case 'fan':
      return update(state, 'climate', { fanLevel: clamp(action.level, 0, action.max), fanAuto: false });
    // Seat heating cycles 0 → 1 → … → max → 0, like a car's seat-heat button.
    case 'seatHeat': {
      const level = (state.climate.seatHeat[action.seat] + 1) % (action.levels + 1);
      return update(state, 'climate', { seatHeat: { ...state.climate.seatHeat, [action.seat]: level } });
    }

    // Turn signals: left and right exclude each other; hazard is independent.
    case 'signal': {
      const s = state.signals;
      if (action.side === 'hazard') return update(state, 'signals', { hazard: !s.hazard });
      const other = action.side === 'left' ? 'right' : 'left';
      return update(state, 'signals', { [action.side]: !s[action.side], [other]: false });
    }

    case 'bodyPart':
      return update(state, 'body', { open: { ...state.body.open, [action.part]: action.open } });

    case 'volume':
      return update(state, 'audio', { volume: clamp(action.value, 0, action.max), muted: false });

    case 'call':
      return update(state, 'phone', { call: { number: action.number, startedAt: action.at } });
    case 'hangup':
      return update(state, 'phone', { call: null });

    default:
      return state;
  }
}

// Trunk, front trunk and charge port only open when the car is parked.
export function canOpenPart(part, { speedKmh, gear }, bodyCfg) {
  if (!bodyCfg.openOnlyWhenParked.includes(part)) return true;
  return gear === 'P' && speedKmh < 0.5;
}

// Doors lock automatically once the car drives faster than autoLockKmh.
export function shouldAutoLock(cabin, speedKmh, bodyCfg) {
  return !cabin.body.locked && speedKmh >= bodyCfg.autoLockKmh;
}

export function openParts(cabin, bodyCfg) {
  return bodyCfg.parts.filter((p) => cabin.body.open[p.id]).map((p) => p.label);
}
