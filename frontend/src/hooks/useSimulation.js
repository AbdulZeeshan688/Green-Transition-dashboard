import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_SIM_STATE, stepSimulation } from '../lib/vehicleModel';
import { isExternalFresh, mergeInputs } from '../lib/driverInput';

// Runs the driving loop. Local inputs (keys / held pedals) live in a ref so
// that keyboard and pointer events don't cause extra renders. `externalRef`
// optionally holds the latest message from an external steering wheel; it is
// merged in each tick and ignored once it is older than `staleMs`.
export function useSimulation({ vehicle, mode, gear, ready, config, externalRef, staleMs }) {
  const [state, setState] = useState(INITIAL_SIM_STATE);
  const inputs = useRef({ accel: false, brake: false, left: false, right: false });
  const context = useRef(null);
  context.current = { vehicle, mode, gear, ready, sim: config };
  const external = useRef({ ref: externalRef, staleMs });
  external.current = { ref: externalRef, staleMs };

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      const ext = external.current.ref?.current;
      const merged = mergeInputs(inputs.current, isExternalFresh(ext, now, external.current.staleMs) ? ext : null);
      setState((prev) => stepSimulation(prev, merged, context.current, dt));
    }, config.tickMs);
    return () => clearInterval(id);
  }, [config.tickMs]);

  const setInput = useCallback((name, held) => {
    inputs.current[name] = held;
  }, []);

  const resetTrip = useCallback(() => setState((s) => ({ ...s, tripKm: 0 })), []);

  return { state, setInput, resetTrip };
}
