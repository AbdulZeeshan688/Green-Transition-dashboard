# ⚡ EV Digital Twin — Frontend Dashboard

A frontend dashboard for an EV digital twin. It works standalone as a simulator for now, and it's built so live vehicle data can be swapped in later.

---

## Running it

```bash
npm install

# Add your Google Maps API key
echo "VITE_GOOGLE_MAPS_KEY=your_key_here" > .env

npm run dev
```

### Required Google APIs

Enable these APIs for the project your key belongs to in the [Google Cloud Console](https://console.cloud.google.com/apis/library) (APIs & Services → Library):

| # | API (exact name to search) | Used for |
|---|---|---|
| 1 | **Maps JavaScript API** | Rendering the map, polylines, markers |
| 2 | **Places API** *(legacy — NOT "Places API (New)")* | Search-bar autocomplete suggestions |
| 3 | **Geocoding API** | Converting selected places from autocomplete into coordinates |
| 4 | **Directions API** | Route calculation between origin and destination |
| 5 | **Elevation API** | Elevation profile along the route for the energy model |

## Controls

| Key | Action |
|---|---|
| `↑` | Accelerate |
| `↓` | Brake |
| `←` / `→` | Steer |
| `1` | Demo state: Normal |
| `2` | Demo state: Warning |
| `3` | Demo state: Error |
| `4` | Demo state: Charging |
| `0` / `Esc` | Clear demo state |
| `7` | Left turn signal on/off |
| `9` | Right turn signal on/off |

Gear (P/R/N/D) and drive mode (Eco / Comfort / 1-Pedal) are changed with the buttons on the dashboard.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build |

## Stack

- React 19
- Vite 8
- Chart.js
- Google Maps API

## Connecting the backend

The app simulates everything locally for now. Each integration point (BMS, CAN bus, telemetry, route API) is documented inline in the code with the expected data shape, so simulated data can be swapped for live data without touching the UI.
