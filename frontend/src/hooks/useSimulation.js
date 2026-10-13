import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_SIM_STATE, stepSimulation } from '../lib/vehicleModel';

// Runs the driving loop. Inputs (pedals/steering held) live in a ref so that
// keyboard and pointer events don't cause extra renders.
export function useSimulation({ vehicle, mode, gear, ready, config }) {
  const [state, setState] = useState(INITIAL_SIM_STATE);
  const inputs = useRef({ accel: false, brake: false, left: false, right: false });
  const context = useRef(null);
  context.current = { vehicle, mode, gear, ready, sim: config };

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      setState((prev) => stepSimulation(prev, inputs.current, context.current, dt));
    }, config.tickMs);
    return () => clearInterval(id);
  }, [config.tickMs]);

  const setInput = useCallback((name, held) => {
    inputs.current[name] = held;
  }, []);

  const resetTrip = useCallback(() => setState((s) => ({ ...s, tripKm: 0 })), []);

  return { state, setInput, resetTrip };
}
