// Mock steering wheel for testing the "External steering wheel" input.
//
// It plays the role of the CARLA team's real wheel: a WebSocket server that
// sends "controls" messages (see docs/INTEGRATION.md). The CARLA team can use
// this file as a reference for their own bridge.
//
//   npm run mock-wheel            # ws://localhost:8765
//   PORT=9000 npm run mock-wheel  # another port
//
// Then in the dashboard: Settings → Steering input → External steering wheel.

import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 8765);
const RATE_HZ = 30;
const server = new WebSocketServer({ port: PORT });

console.log(`Mock steering wheel on ws://localhost:${PORT} (sending ${RATE_HZ} messages/s)`);

server.on('connection', (socket) => {
  console.log('Dashboard connected');
  const start = Date.now();
  let lastState = 0;

  // Gentle slalom: wheel swings ±90°, light throttle, brief braking every 10 s.
  const timer = setInterval(() => {
    const t = (Date.now() - start) / 1000;
    const braking = t % 10 > 8;
    socket.send(
      JSON.stringify({
        type: 'controls',
        steeringDeg: +(90 * Math.sin(t * 0.8)).toFixed(1),
        throttle: braking ? 0 : 0.35,
        brake: braking ? 0.6 : 0,
        gear: 'D',
      }),
    );
  }, 1000 / RATE_HZ);

  // The dashboard sends its state back (speed, gear, power…) — e.g. for CARLA sync.
  socket.on('message', (data) => {
    const now = Date.now();
    if (now - lastState > 2000) {
      lastState = now;
      console.log('Dashboard state:', data.toString());
    }
  });

  socket.on('close', () => {
    clearInterval(timer);
    console.log('Dashboard disconnected');
  });
});
