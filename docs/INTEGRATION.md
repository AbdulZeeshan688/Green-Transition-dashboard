# Integration guide

How other parts of the project connect to the Green Transition Dashboard.

Every connection follows the same rule: **the dashboard always works on its own** (local default), and each external source can be switched on in **Settings → Connections**, without changing any code. Addresses and options are in [`frontend/public/data/integrations.json`](../frontend/public/data/integrations.json).

| Connection | Who | Default | External source | Code |
|---|---|---|---|---|
| Steering wheel, pedals and gear | CARLA team | Keyboard & touch | WebSocket, `ws://localhost:8765` | `src/services/inputs/websocketWheel.js`, `src/lib/driverInput.js` |
| Routes (distance, time, climb) | Tao (backend) | `routes.json` sample data | `POST /api/routes` | `src/services/routeService.js`, `src/lib/backendRoutes.js` |

---

## 1. Steering wheel (CARLA team)

The dashboard connects as a **WebSocket client** to the wheel rig, or to a small bridge program running next to it, and reads controls from it.

### Try it without hardware
```bash
cd frontend
npm run mock-wheel      # fake wheel on ws://localhost:8765
npm run dev             # in a second terminal
```
In the dashboard, open **Settings → Steering input → External steering wheel (CARLA team)**. The pill in *Driving Controls* shows **connected**, and the wheel, pedals and speed follow the mock.

[`frontend/tools/mock-wheel.mjs`](../frontend/tools/mock-wheel.mjs) is a complete, small example of a wheel server.

### Messages from the wheel → dashboard

Send JSON text messages, **20–60 per second**:

```json
{ "type": "controls", "steeringDeg": -90.0, "throttle": 0.4, "brake": 0.0, "gear": "D" }
```

| Field | Type | Meaning |
|---|---|---|
| `type` | `"controls"` | Required. Other message types are ignored. |
| `steeringDeg` | number | Absolute wheel angle in degrees. Negative = left. Clamped to the vehicle's lock (±540°). |
| `steering` | number −1…1 | Alternative to `steeringDeg`: normalised angle, scaled to the vehicle's lock. |
| `throttle` | number 0…1 | Accelerator pedal position. |
| `brake` | number 0…1 | Brake pedal position. |
| `gear` | `"P"`, `"R"`, `"N"` or `"D"` | Optional. It acts only when the value **changes**, and the normal rules apply (car must be on, slow enough to shift). |

All fields except `type` are optional. Send only what your rig has. Invalid values are clamped or ignored.

**Safety:** if no message arrives for **500 ms** (`staleMs`), the dashboard ignores the wheel and the throttle drops to 0. If the connection drops, it reconnects every 3 s (`reconnectSeconds`).

### Messages from the dashboard → wheel

Every 100 ms (`stateIntervalMs`), the dashboard sends its state back. You can use it for force feedback, or to keep CARLA in sync:

```json
{ "type": "state", "speedKmh": 42.5, "steeringDeg": -12.0, "gear": "D", "power": "ready", "socPercent": 79.4 }
```

### Using a different connection later
If the rig uses something other than WebSocket (serial, MQTT, WebHID…), write a new module with the same `connectWheel({ url, onControls, onStatus, … })` function as `websocketWheel.js`, and select it. The rest of the dashboard doesn't change. `parseControlMessage()` in `driverInput.js` stays the single definition of the message format.

---

## 2. Routes backend (Tao)

The dashboard calls the existing backend endpoint:

```
POST /api/routes
{ "start": [25.6612, 60.9827], "end": [26.038, 61.205] }      // [longitude, latitude]
```

It uses these fields from the response (`backend/app/schemas.py`, `RoutesResponse`):

| Backend field | Dashboard field |
|---|---|
| `routes[].distance_m` | `distanceKm` (÷ 1000) |
| `routes[].duration_s` | `durationMin` (÷ 60) |
| `routes[].climb_m` / `descent_m` | `totalUphill` / `totalDownhill` |
| `routes[].coords` (`[lon, lat, elev]`) | `path`, drawn on the route map |
| `routes[].e_total_kwh` | shown as **Backend estimate** for comparison |
| `data_source` | shown next to the source (`ors` or `demo`) |

**Please keep these field names stable**, or tell the dashboard team if they change. The mapping is in one function, `mapBackendRoutes()`, and covered by tests.

### Running both together
```bash
# terminal 1 — backend (see backend/README.md)
cd backend && .venv/bin/python -m uvicorn app.main:app --port 8000
# terminal 2 — dashboard
cd frontend && npm run dev
```
Then open **Settings → Route data → Backend API (Tao)** and the **Route Evaluation** tab.

- In development, Vite forwards `/api` to `http://localhost:8000` (`frontend/vite.config.js`), so the backend needs **no CORS setup**. For another address: `BACKEND_URL=http://host:port npm run dev`.
- The start and destination choices come from `routes.backend.places` in `integrations.json`. They match the `[cities]` in `backend/config.toml`. Add a city in both places.
- If the backend is not running, Route Evaluation shows a clear error instead of fake data.

### Open decision: one energy model
The dashboard calculates energy, battery and CO₂ itself, from the backend's distance and climb/descent, using the frontend energy model (`energy-model.json`). The backend uses its own physics model (mass, gravity, efficiencies), so the two numbers differ slightly. That's why the card shows both. The team should agree on one model:
- **Option A:** the dashboard uses `e_total_kwh` and `co2_kg` from the backend directly.
- **Option B:** the backend's physics constants move into `energy-model.json`.

---

## 3. Planned: live vehicle telemetry

Battery level, system status (Motor, ABS…) and the starting state currently come from `vehicle-state.json` and `vehicle-systems.json`. A live feed can plug in the same way: a provider module with the same output shape, selected in `integrations.json`.
