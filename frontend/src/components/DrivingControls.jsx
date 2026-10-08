import Icon from './Icon';
import { SteeringWheel } from './Graphics';
import { fmt } from '../lib/format';

// Press-and-hold handlers so mouse and touch work like holding a key.
function hold(setInput, name) {
  const release = () => setInput(name, false);
  return {
    onPointerDown: (e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setInput(name, true);
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
  };
}

function Pedal({ label, value, kind, handlers }) {
  return (
    <div className="pedal-box">
      <span className="pedal-label">{label}</span>
      <button
        className={`pedal ${kind} ${value > 0 ? 'pressed' : ''}`}
        style={{ '--press': value }}
        aria-label={`${label} pedal`}
        {...handlers}
      >
        <span className="pedal-fill" style={{ height: `${value * 100}%` }} />
      </button>
      <span className="pedal-value">{fmt(value * 100)}%</span>
    </div>
  );
}

export default function DrivingControls({ units, sim, speedKmh, gear, driveModes, modeId, onModeChange }) {
  const { state, setInput } = sim;

  const steerHandlers = {
    onPointerDown: (e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      setInput(e.clientX < rect.left + rect.width / 2 ? 'left' : 'right', true);
    },
    onPointerUp: () => {
      setInput('left', false);
      setInput('right', false);
    },
    onLostPointerCapture: () => {
      setInput('left', false);
      setInput('right', false);
    },
  };

  return (
    <section className="card">
      <h2 className="card-title">Driving Controls</h2>
      <div className="controls">
        <div className="wheel-box" {...steerHandlers} title="Hold left/right half to steer (or ← →)">
          <SteeringWheel angleDeg={state.steeringDeg} />
        </div>

        <div className="readouts">
          <div className="readout">
            <Icon name="gauge" size={22} />
            <span>Speed</span>
            <strong>
              {fmt(speedKmh)} <small>{units.speed}</small>
            </strong>
          </div>
          <div className="readout">
            <Icon name="gear" size={22} />
            <span>Gear</span>
            <strong>{gear}</strong>
          </div>
          <div className="readout">
            <Icon name="wheel" size={22} />
            <span>Steering angle</span>
            <strong>{fmt(state.steeringDeg)}°</strong>
          </div>
          <span className="section-label">Drive mode</span>
          <div className="mode-row">
            {driveModes.map((m) => (
              <button
                key={m.id}
                className={`mode-btn ${m.id === modeId ? 'active' : ''}`}
                onClick={() => onModeChange(m.id)}
              >
                <Icon name={m.icon} size={16} />
                {m.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <Pedal label="Brake" kind="brake" value={state.brake} handlers={hold(setInput, 'brake')} />
        <Pedal label="Accelerator" kind="accel" value={state.accel} handlers={hold(setInput, 'accel')} />
      </div>
      <p className="hint">
        Press START (or S) first. Keyboard: ↑ accelerate · ↓ brake · ← → steer · P R N D gears. Mouse/touch: hold the pedals or a side of the wheel.
      </p>
    </section>
  );
}
