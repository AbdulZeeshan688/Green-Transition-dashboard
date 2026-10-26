import { useEffect, useRef, useState } from 'react';
import { connectWheel } from '../services/inputs/websocketWheel';

// Connects to the external steering wheel while `enabled` is true.
// The latest controls live in a ref (read by the physics loop every tick) so
// that 30-60 messages per second don't re-render the whole dashboard.
export function useExternalWheel({ enabled, config, maxSteeringDeg, onGear }) {
  const [status, setStatus] = useState('off');
  const externalRef = useRef(null);
  const connection = useRef(null);
  const maxRef = useRef(maxSteeringDeg);
  const onGearRef = useRef(onGear);
  maxRef.current = maxSteeringDeg;
  onGearRef.current = onGear;

  useEffect(() => {
    if (!enabled) {
      externalRef.current = null;
      setStatus('off');
      return undefined;
    }
    let lastGear = null;
    connection.current = connectWheel({
      url: config.url,
      reconnectSeconds: config.reconnectSeconds,
      getMaxSteeringDeg: () => maxRef.current,
      onStatus: setStatus,
      onControls: (controls) => {
        externalRef.current = { controls, receivedAt: performance.now() };
        // Gear changes are edge-triggered: act only when the wheel's gear changes.
        if (controls.gear && controls.gear !== lastGear) {
          lastGear = controls.gear;
          onGearRef.current?.(controls.gear);
        }
      },
    });
    return () => {
      connection.current?.close();
      connection.current = null;
      externalRef.current = null;
    };
  }, [enabled, config.url, config.reconnectSeconds]);

  const send = (payload) => connection.current?.send(payload);
  return { status, externalRef, send };
}
