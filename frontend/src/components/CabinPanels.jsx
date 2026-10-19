import { useEffect, useState } from 'react';
import Icon from './Icon';
import { PanelHeader } from './TouchPanels';
import { fmt } from '../lib/format';

export function Switch({ on, onToggle, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch ${on ? 'on' : ''}`}
      onClick={onToggle}
    >
      <span />
    </button>
  );
}

function SwitchRow({ label, sub, on, onToggle }) {
  return (
    <div className="panel-row">
      <span>
        <strong>{label}</strong>
        {sub && <small className="muted block">{sub}</small>}
      </span>
      <Switch on={on} onToggle={onToggle} label={label} />
    </div>
  );
}

export function LevelDots({ level, max }) {
  return (
    <span className="level-dots" aria-label={`Level ${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < level ? 'on' : ''} />
      ))}
    </span>
  );
}

function ChipToggle({ icon, label, on, onToggle }) {
  return (
    <button className={`chip-toggle ${on ? 'on' : ''}`} aria-pressed={on} onClick={onToggle}>
      <Icon name={icon} size={22} />
      {label}
    </button>
  );
}

const formatTemp = (t) => fmt(t, Number.isInteger(t) ? 0 : 1);

// ---------- Climate ----------
export function ClimatePanel({ cabin, dispatch, cfg, limits, units, onBack }) {
  const c = cabin.climate;
  const toggle = (key) => dispatch({ type: 'toggle', group: 'climate', key });
  const temp = (zone, sign) =>
    dispatch({
      type: 'temp',
      zone,
      delta: sign * limits.climateStepC,
      min: limits.climateMinC,
      max: limits.climateMaxC,
    });

  const zone = (id, label, value) => (
    <div className="temp-card">
      <span className="muted">{label}</span>
      <div className="temp-stepper">
        <button
          aria-label={`Lower ${label} temperature`}
          onClick={() => temp(id, -1)}
          disabled={value <= limits.climateMinC}
        >
          −
        </button>
        <strong>
          {formatTemp(value)}
          {units.temperature}
        </strong>
        <button
          aria-label={`Raise ${label} temperature`}
          onClick={() => temp(id, 1)}
          disabled={value >= limits.climateMaxC}
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="panel">
      <PanelHeader title="Climate" subtitle="Temperature, fan and heating" onBack={onBack} />
      <div className="temp-grid">
        {zone('driver', 'Driver', c.driverTempC)}
        {zone('passenger', 'Passenger', c.passengerTempC)}
      </div>
      <div className="panel-card">
        <SwitchRow
          label="Sync temperatures"
          sub="Passenger follows the driver"
          on={c.syncTemps}
          onToggle={() => toggle('syncTemps')}
        />
        <div className="panel-row fan-row">
          <span>
            <strong>Fan</strong>
            <small className="muted block">{c.fanAuto ? 'Automatic' : `Level ${c.fanLevel} of ${cfg.fanLevels}`}</small>
          </span>
          <input
            type="range"
            min="0"
            max={cfg.fanLevels}
            value={c.fanLevel}
            aria-label="Fan level"
            onChange={(e) => dispatch({ type: 'fan', level: Number(e.target.value), max: cfg.fanLevels })}
          />
          <button
            className={`chip-small ${c.fanAuto ? 'on' : ''}`}
            onClick={() => toggle('fanAuto')}
            aria-pressed={c.fanAuto}
          >
            AUTO
          </button>
        </div>
      </div>
      <div className="chip-grid">
        <ChipToggle icon="snow" label="A/C" on={c.ac} onToggle={() => toggle('ac')} />
        <ChipToggle icon="recirc" label="Recirculate" on={c.recirculation} onToggle={() => toggle('recirculation')} />
        <ChipToggle
          icon="defrostFront"
          label="Front defrost"
          on={c.frontDefrost}
          onToggle={() => toggle('frontDefrost')}
        />
        <ChipToggle icon="defrostRear" label="Rear defrost" on={c.rearDefrost} onToggle={() => toggle('rearDefrost')} />
        <ChipToggle icon="wheel" label="Wheel heat" on={c.steeringHeat} onToggle={() => toggle('steeringHeat')} />
      </div>
      <span className="section-label">Seat heating</span>
      <div className="seat-grid">
        {['driver', 'passenger'].map((seat) => (
          <button
            key={seat}
            className={`seat-btn ${c.seatHeat[seat] > 0 ? 'on' : ''}`}
            onClick={() => dispatch({ type: 'seatHeat', seat, levels: cfg.seatHeatLevels })}
          >
            <Icon name="seatHeat" size={26} />
            <span>{seat === 'driver' ? 'Driver' : 'Passenger'}</span>
            <LevelDots level={c.seatHeat[seat]} max={cfg.seatHeatLevels} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Interior ----------
export function InteriorPanel({ cabin, dispatch, cfg, onToggleLock, onBack }) {
  const l = cabin.lights;
  const set = (key, value) => dispatch({ type: 'set', group: 'lights', key, value });
  return (
    <div className="panel">
      <PanelHeader title="Interior" subtitle="Cabin lighting and doors" onBack={onBack} />
      <div className="panel-card">
        <SwitchRow
          label="Ambient lighting"
          sub="Glows along the driver display"
          on={l.ambientOn}
          onToggle={() => dispatch({ type: 'toggle', group: 'lights', key: 'ambientOn' })}
        />
        <div className={`panel-row ${l.ambientOn ? '' : 'dimmed'}`}>
          <span className="muted">Colour</span>
          <span className="swatches">
            {cfg.lights.ambientColors.map((col) => (
              <button
                key={col.id}
                className={`swatch ${l.ambientColor === col.id ? 'active' : ''}`}
                style={{ '--swatch': col.hex }}
                aria-label={col.label}
                title={col.label}
                onClick={() => set('ambientColor', col.id)}
                disabled={!l.ambientOn}
              />
            ))}
          </span>
        </div>
        <div className={`panel-row ${l.ambientOn ? '' : 'dimmed'}`}>
          <span className="muted">Brightness</span>
          <input
            type="range"
            min="10"
            max="100"
            step="10"
            value={l.ambientBrightness}
            aria-label="Ambient brightness"
            disabled={!l.ambientOn}
            onChange={(e) => set('ambientBrightness', Number(e.target.value))}
          />
          <strong>{l.ambientBrightness}%</strong>
        </div>
        <SwitchRow
          label="Reading lights"
          on={l.readingLights}
          onToggle={() => dispatch({ type: 'toggle', group: 'lights', key: 'readingLights' })}
        />
      </div>
      <div className="panel-card">
        <div className="panel-row">
          <span>
            <strong>Doors</strong>
            <small className="muted block">
              {cabin.body.locked ? 'Locked' : 'Unlocked'} · lock automatically above {cfg.body.autoLockKmh} km/h
            </small>
          </span>
          <button className="btn secondary small" onClick={onToggleLock}>
            <Icon name={cabin.body.locked ? 'unlock' : 'lock'} size={16} /> {cabin.body.locked ? 'Unlock' : 'Lock'}
          </button>
        </div>
        <SwitchRow
          label="Child lock"
          sub="Rear doors can't be opened from inside"
          on={cabin.body.childLock}
          onToggle={() => dispatch({ type: 'toggle', group: 'body', key: 'childLock' })}
        />
      </div>
    </div>
  );
}

// ---------- Exterior ----------
export function ExteriorPanel({ cabin, dispatch, cfg, onTogglePart, onBack }) {
  const l = cabin.lights;
  return (
    <div className="panel">
      <PanelHeader title="Exterior" subtitle="Lights, mirrors and openings" onBack={onBack} />
      <span className="section-label">Headlights</span>
      <div className="segmented">
        {cfg.lights.headlightModes.map((m) => (
          <button
            key={m.id}
            className={l.headlights === m.id ? 'active' : ''}
            onClick={() => dispatch({ type: 'set', group: 'lights', key: 'headlights', value: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="panel-card">
        <SwitchRow
          label="Fog lights"
          on={l.fogLights}
          onToggle={() => dispatch({ type: 'toggle', group: 'lights', key: 'fogLights' })}
        />
        <SwitchRow
          label="Hazard lights"
          on={cabin.signals.hazard}
          onToggle={() => dispatch({ type: 'signal', side: 'hazard' })}
        />
        <SwitchRow
          label="Fold mirrors"
          on={cabin.body.mirrorsFolded}
          onToggle={() => dispatch({ type: 'toggle', group: 'body', key: 'mirrorsFolded' })}
        />
      </div>
      <span className="section-label">Openings · only when parked</span>
      <div className="panel-card">
        {cfg.body.parts.map((part) => {
          const open = cabin.body.open[part.id];
          return (
            <div key={part.id} className="panel-row">
              <span>
                <strong>{part.label}</strong>
                <small className={`block ${open ? 'warn' : 'muted'}`}>{open ? 'Open' : 'Closed'}</small>
              </span>
              <button className="btn secondary small" onClick={() => onTogglePart(part.id, !open)}>
                {open ? 'Close' : 'Open'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Phone (demo: no real phone is connected) ----------
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

function useCallTimer(call) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!call) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [call]);
  if (!call) return null;
  const s = Math.floor((Date.now() - call.startedAt) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function PhonePanel({ cabin, dispatch, cfg, onBack }) {
  const p = cabin.phone;
  const [number, setNumber] = useState('');
  const [pairing, setPairing] = useState('idle'); // idle | searching | found
  const elapsed = useCallTimer(p.call);
  const device = cfg.demoDevices.find((d) => d.id === p.pairedDeviceId);

  useEffect(() => {
    if (pairing !== 'searching') return undefined;
    const id = setTimeout(() => setPairing('found'), cfg.pairingSeconds * 1000);
    return () => clearTimeout(id);
  }, [pairing, cfg.pairingSeconds]);

  const setPhone = (key, value) => dispatch({ type: 'set', group: 'phone', key, value });

  return (
    <div className="panel">
      <PanelHeader title="Phone" subtitle={cfg.note} onBack={onBack} />
      <div className="panel-card">
        <SwitchRow
          label="Bluetooth"
          on={p.bluetooth}
          onToggle={() => {
            if (p.bluetooth) dispatch({ type: 'hangup' });
            dispatch({ type: 'toggle', group: 'phone', key: 'bluetooth' });
          }}
        />
        {p.bluetooth && (
          <div className="panel-row">
            <span>
              <strong>{device ? device.name : 'No phone paired'}</strong>
              <small className="muted block">
                {device ? 'Connected' : pairing === 'searching' ? 'Searching…' : 'Pair a phone to make calls'}
              </small>
            </span>
            {device ? (
              <button className="btn secondary small" onClick={() => setPhone('pairedDeviceId', null)}>
                Forget
              </button>
            ) : (
              <button
                className="btn secondary small"
                onClick={() => setPairing('searching')}
                disabled={pairing === 'searching'}
              >
                Pair phone
              </button>
            )}
          </div>
        )}
        {p.bluetooth &&
          !device &&
          pairing === 'found' &&
          cfg.demoDevices.map((d) => (
            <div key={d.id} className="panel-row">
              <span className="muted">{d.name}</span>
              <button
                className="btn primary small"
                onClick={() => {
                  setPhone('pairedDeviceId', d.id);
                  setPairing('idle');
                }}
              >
                Connect
              </button>
            </div>
          ))}
      </div>

      {p.call ? (
        <div className="panel-card call-card">
          <span className="muted">Calling</span>
          <strong className="call-number">{p.call.number}</strong>
          <span className="call-time">{elapsed}</span>
          <button className="btn danger" onClick={() => dispatch({ type: 'hangup' })}>
            <Icon name="phone" size={20} /> Hang up
          </button>
        </div>
      ) : (
        <div className={`panel-card dialer ${device && p.bluetooth ? '' : 'dimmed'}`}>
          <div className="dial-display">
            <span>{number || 'Enter number'}</span>
            <button
              className="icon-btn"
              aria-label="Delete digit"
              onClick={() => setNumber((n) => n.slice(0, -1))}
              disabled={!number}
            >
              <Icon name="backspace" size={20} />
            </button>
          </div>
          <div className="dial-keys">
            {KEYS.map((k) => (
              <button key={k} onClick={() => setNumber((n) => (n + k).slice(0, 15))} disabled={!device || !p.bluetooth}>
                {k}
              </button>
            ))}
          </div>
          <button
            className="btn primary"
            disabled={!device || !p.bluetooth || !number}
            onClick={() => dispatch({ type: 'call', number, at: Date.now() })}
          >
            <Icon name="phone" size={20} /> Call
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Audio ----------
export function AudioPanel({ cabin, dispatch, cfg, onBack }) {
  const a = cabin.audio;
  const level = a.muted ? 0 : a.volume;
  return (
    <div className="panel">
      <PanelHeader title="Audio" subtitle="Volume" onBack={onBack} />
      <div className="panel-card volume-card">
        <Icon name={level === 0 ? 'volumeOff' : 'volume'} size={40} />
        <strong className="volume-value">{level}</strong>
        <input
          type="range"
          min="0"
          max={cfg.volumeMax}
          value={a.volume}
          aria-label="Volume"
          onChange={(e) => dispatch({ type: 'volume', value: Number(e.target.value), max: cfg.volumeMax })}
        />
        <div className="volume-buttons">
          <button
            className="btn secondary small"
            onClick={() => dispatch({ type: 'volume', value: a.volume - 1, max: cfg.volumeMax })}
          >
            −
          </button>
          <button
            className={`btn small ${a.muted ? 'primary' : 'secondary'}`}
            onClick={() => dispatch({ type: 'toggle', group: 'audio', key: 'muted' })}
          >
            {a.muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            className="btn secondary small"
            onClick={() => dispatch({ type: 'volume', value: a.volume + 1, max: cfg.volumeMax })}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
