# Green Transition Dashboard — Frontend

React + Vite dashboard for the EMDT Green Transition Dashboard (LAB REDI 2026, task 3.4).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # logic + data-file validation tests
npm run build    # production build into dist/
```

Controls: press **START** (or **S**) to switch the vehicle on. Then **↑** accelerate · **↓** brake · **← →** steer · **P R N D** change gear. STOP only works in P.
With a mouse or touchscreen, hold a pedal or one side of the steering wheel.
Each tab has its own link: `#dashboard`, `#route`, `#vehicle`.

## Where the numbers come from

No values are hardcoded in components. Everything the UI shows is either loaded from a data file or calculated live.

| File (`public/data/`) | What it holds | Who edits it |
|---|---|---|
| `ui.json` | Brand, tabs, touchscreen tiles, units | Anyone |
| `vehicles.json` | Vehicle specs, same field names as Sanjeev's model (`batteryCapacity`, `energyConsumption`) | Vehicle-data team |
| `vehicle-state.json` | Initial telemetry snapshot (SoC, gear, mode, climate) | Telemetry team (later a live feed) |
| `drive-modes.json` | Acceleration / coasting / regen per drive mode | Anyone |
| `simulation.json` | Pedal ramp time, steering speed, shift speed limit, climate limits, default vehicle dynamics | Anyone |
| `energy-model.json` | Sanjeev's uphill/regen factors, grid CO₂ intensity (with sources) | Energy-model owner |
| `routes.json` | Places and route candidates: distance, duration, uphill/downhill (**sample data**) | Routing team (OpenRouteService) |
| `scoring.json` | Route-score metrics and weights | Anyone |
| `charging.json` | Charger power, charge-limit range, demo speed-up | Anyone |
| `vehicle-systems.json` | Vehicle systems (Motor, ABS…), which ones block driving, demo scenarios | Telemetry team (later live CAN data) |
| `cabin.json` | Climate, lights, doors, audio and phone limits and defaults | Anyone |
| `integrations.json` | Steering wheel / backend addresses and default sources | Integration owners |

Why separate files:
1. **Non-programmers can change the dashboard.** Adding a vehicle, place or tile, or retuning score weights, means editing JSON only.
2. **Swappable data source.** All data loads through `src/services/dataService.js`. Setting `VITE_DATA_BASE_URL` points the same calls at a backend API without changing any component.
3. **Safe edits.** `npm test` checks every data file (unique ids, valid references, positive specs), so a typo fails the tests instead of the demo.

## What is calculated live

**Energy model** (`src/lib/energyModel.js`). This is Sanjeev-Kumar Chaudhary's model from
[Green-Transition-Dashboard-LAB-REDI-](https://github.com/Sanjeev7071/Green-Transition-Dashboard-LAB-REDI-).
The formulas are unchanged; only the constants moved to `energy-model.json`:

| Quantity | Formula |
|---|---|
| Base rate (kWh/km) | `energyConsumption / 100` |
| Energy used (kWh) | `distance × baseRate + uphill_m × 0.001 − downhill_m × 0.0005`, never below 0 |
| Battery usage (%) | `energyUsed / batteryCapacity × 100` |
| CO₂ (kg) | `energyUsed × gridIntensity_g/kWh / 1000` |
| Average speed | `distance / (duration / 60)` |
| Fastest / Eco route | fastest = shortest duration; eco = lowest energy, if lower than the fastest route's |

On the dashboard:
- **Energy use (kWh/km).** With a route applied, this is that route's average rate, including climbs and regen. Without one, it is the vehicle's base rate.
- **Live battery** = starting SoC − trip energy ÷ capacity. **Range** = remaining battery energy ÷ base rate.
- **Speed, steering, pedals, trip distance** come from the physics loop in `src/lib/vehicleModel.js`.
- **Road animation:** the lane lines move by the distance actually driven (`roadScrollPxPerM` in `simulation.json`), so they stop when the car stops and run backwards in reverse.
- **Route score (0–100)** comes from `src/lib/routeScoring.js`, weighted by `scoring.json`. It is a ranking aid; the Eco/Fastest labels use Sanjeev's rule.

## Touchscreen panels

| Tile / menu | What it does |
|---|---|
| **Charging** | Set a charge limit and charge. SoC rises by `power × time / capacity`. Shows energy and **real** time to the limit; the on-screen demo runs `demoTimeScale`× faster. The vehicle must be off to charge. |
| **Safety** | Live status of Motor, Controller, CAN bus, ABS and ESC. A fault in a system marked `blocksDriving` disables driving (display shows FAULT), and the header pill switches to WARNING/FAULT. |
| **Comfort** / Drive | Drive mode (acceleration and regen per `drive-modes.json`) and a regenerative-braking switch. With regen off, Sanjeev's downhill-recovery term is set to 0. |
| **Settings** | Choose the vehicle (re-calculates range, energy and routes) and reset the trip. |
| Vehicle, Route Evaluation | Open the matching tab. |

| **Climate** (side menu, fan button) | Driver/passenger temperature with sync, fan level or Auto, A/C, recirculation, defrost, seat and steering-wheel heating |
| **Interior** | Ambient lighting (colour and brightness, glows on the driver display), reading lights, door lock, child lock |
| **Exterior** | Headlights (Off/Auto/Low/High), fog lights, hazard lights, fold mirrors; trunk, front trunk and charge port open only when parked |
| **Phone** (bottom bar) | Bluetooth, pairing, dial pad and call screen. Demo only: no real phone is connected |
| **Audio** (bottom bar) | Volume and mute |

The bottom bar also has driver and passenger seat heating (tap to cycle levels) and a back arrow. Turn signals and hazard: **Q / E / H**. Doors lock automatically above `autoLockKmh`. All limits and defaults are in `cabin.json`, and the logic is in `src/lib/cabin.js`.

## Connections to other teams

Settings → Connections switches between local sources and external ones (`integrations.json`):
- **Steering input:** keyboard & touch, or an external steering wheel over WebSocket (CARLA team). Try it with `npm run mock-wheel`.
- **Route data:** `routes.json`, or Tao's backend (`POST /api/routes`, proxied by Vite in development).

The message formats and setup are in [`../docs/INTEGRATION.md`](../docs/INTEGRATION.md).

## Not done yet

- `routes.json` holds **sample** route geometry. Next step: a backend that calls OpenRouteService and returns the same fields.
- Grid CO₂ is a fixed **32 gCO₂/kWh**, Fingrid's figure for H1 2026. Next step: the backend relays Fingrid dataset 265 live (Sanjeev's `/api/fingrid/co2-intensity`).
- The map is a schematic SVG drawn from the route `path` points.

## Structure

```
src/
  services/dataService.js   loads all JSON (swap for API later)
  lib/vehicleModel.js       pure driving physics (tested)
  lib/routeScoring.js       pure route scoring (tested)
  hooks/useSimulation.js    runs the physics loop
  components/               Header, DriverDisplay, DrivingControls,
                            TouchScreen, RouteEvaluation, VehicleStatus
  data.test.js              validates public/data/*.json
```
