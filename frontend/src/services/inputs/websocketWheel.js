import { parseControlMessage } from '../../lib/driverInput';

// Transport for an external steering wheel (e.g. the CARLA team's rig).
// The rig (or a small bridge program next to it) runs a WebSocket server and
// sends JSON "controls" messages; see docs/INTEGRATION.md. To use a different
// transport later (serial, MQTT, WebHID...), write another module with the same
// connectWheel(...) signature and select it in integrations.json.
export function connectWheel({ url, reconnectSeconds, getMaxSteeringDeg, onControls, onStatus, WebSocketImpl }) {
  const Socket = WebSocketImpl ?? globalThis.WebSocket;
  let socket = null;
  let retryTimer = null;
  let closed = false;

  const scheduleRetry = () => {
    if (!closed) retryTimer = setTimeout(open, reconnectSeconds * 1000);
  };

  function open() {
    onStatus('connecting');
    try {
      socket = new Socket(url);
    } catch {
      onStatus('disconnected');
      scheduleRetry();
      return;
    }
    socket.onopen = () => onStatus('connected');
    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return; // ignore anything that is not JSON
      }
      const controls = parseControlMessage(message, getMaxSteeringDeg());
      if (controls) onControls(controls);
    };
    socket.onclose = () => {
      onStatus('disconnected');
      scheduleRetry();
    };
    socket.onerror = () => {}; // onclose follows and handles the retry
  }

  open();

  return {
    send(payload) {
      if (socket && socket.readyState === 1) socket.send(JSON.stringify(payload));
    },
    close() {
      closed = true;
      clearTimeout(retryTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    },
  };
}
