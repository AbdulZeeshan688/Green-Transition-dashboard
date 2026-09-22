import './index.css'
import './App.css'
import { useState, useEffect } from 'react'
import DashboardGrid from './components/layout/DashboardGrid'
import MapContainer from './components/map/MapContainer'
import useGoogleMaps from './hooks/useGoogleMaps'
import useRoute from './hooks/useRoute'
import useDrivingSim from './hooks/useDrivingSim'
import useTheme from './hooks/useTheme'
import SoCBar from './components/battery/SoCBar'
import BatteryStats from './components/battery/BatteryStats'
import MetricsGrid from './components/metrics/MetricsGrid'
import MetricCard from './components/metrics/MetricCard'
import SteeringWheel from './components/vehicle/SteeringWheel'
import { BrakePedal, AccelPedal } from './components/vehicle/Pedal'
import SimControls from './components/controls/SimControls'
import SpeedGauge from './components/vehicle/SpeedGauge'
import VehicleParams from './components/controls/VehicleParams'
import ElevationChart from './components/charts/ElevationChart'
import EnergyFlow from './components/charts/EnergyFlow'

// Vehicle config for the physics model, swap in a backend call when ready
const DEFAULT_PARAMS = {
  mass:     1500,
  speedKmh: 90,
  CdA:      0.60,
  regenPct: 30,
  battKWh:  75
}

const DEMO_STATES = {
  normal: {
    label:   'Normal',
    color:   '#22c55e',
    battery: { batteryPct: 84, batteryTemp: 24, estimatedRange: 322 },
    systems: [
      { label: 'Motor',      status: 'normal' },
      { label: 'Controller', status: 'normal' },
      { label: 'CAN Bus',    status: 'normal' },
      { label: 'ABS',        status: 'normal' },
      { label: 'ESC',        status: 'normal' },
    ],
  },
  warning: {
    label:   'Warning',
    color:   '#f59e0b',
    battery: { batteryPct: 28, batteryTemp: 41, estimatedRange: 108 },
    systems: [
      { label: 'Motor',      status: 'normal' },
      { label: 'Controller', status: 'warning' },
      { label: 'CAN Bus',    status: 'normal' },
      { label: 'ABS',        status: 'warning' },
      { label: 'ESC',        status: 'normal' },
    ],
  },
  error: {
    label:   'Error',
    color:   '#ef4444',
    battery: { batteryPct: 6, batteryTemp: 57, estimatedRange: 23 },
    systems: [
      { label: 'Motor',      status: 'error' },
      { label: 'Controller', status: 'error' },
      { label: 'CAN Bus',    status: 'warning' },
      { label: 'ABS',        status: 'error' },
      { label: 'ESC',        status: 'warning' },
    ],
  },
  charging: {
    label:   'Charging',
    color:   '#38bdf8',
    battery: { batteryPct: 47, batteryTemp: 28, estimatedRange: 190, charging: true, timeToFull: '1h 05m' },
    systems: [
      { label: 'Motor',      status: 'off' },
      { label: 'Controller', status: 'off' },
      { label: 'Charger',    status: 'normal' },
      { label: 'CAN Bus',    status: 'normal' },
      { label: 'BMS',        status: 'normal' },
    ],
  },
}

export default function App() {
  const { isLoaded, error: mapsError } = useGoogleMaps()
  // fetchRoute kicks off the route request from the map search bar
  const { routeData, routeName, distKm, status, error: routeError, initServices, fetchRoute } = useRoute()
  const [params] = useState(DEFAULT_PARAMS)

  // Local physics sim, swap in a real telemetry client later
  const sim = useDrivingSim()
  const { themeIndex, cycle: cycleTheme } = useTheme()

  // Demo state switcher — 1/2/3 for Normal/Warning/Error, 0 or Esc to clear.
  const [demoKey, setDemoKey] = useState(null)
  const demo = demoKey ? DEMO_STATES[demoKey] : null

  // Independent turn signal — toggled with 7 (left) / 9 (right), off on re-press.
  const [turnSignal, setTurnSignal] = useState(null)

  useEffect(() => {
    function onKey(e) {
      if (e.target && e.target.tagName === 'INPUT') return
      const map = { '1': 'normal', '2': 'warning', '3': 'error', '4': 'charging' }
      if (map[e.key]) setDemoKey(map[e.key])
      else if (e.key === '0' || e.key === 'Escape') setDemoKey(null)
      else if (e.key === '7') setTurnSignal(prev => (prev === 'left' ? null : 'left'))
      else if (e.key === '9') setTurnSignal(prev => (prev === 'right' ? null : 'right'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-root">
      <DashboardGrid
        left={<>
          <MetricsGrid
            distanceKm={distKm ? Math.round(distKm) : null}
            eta={routeData?.directionsResult?.routes?.[0]?.legs?.[0]?.duration?.text || null}
            avgEnergy={routeData?.wh100 ? (routeData.wh100 / 1000).toFixed(1) : null}
          />
          <MetricCard />
          <ElevationChart routeData={routeData} />
          <EnergyFlow
            motorPower={sim.motorPower}
            motorTorque={sim.motorTorque}
            mode={sim.mode}
          />
        </>}

        center={
          <MapContainer
            isLoaded={isLoaded}
            routeData={routeData}
            onServicesReady={initServices}
            onRouteRequest={(o, d) => fetchRoute(o, d, params)}
            routeName={routeName}
            status={status}
            mapsError={mapsError}
            routeError={routeError}
            themeIndex={themeIndex}
            onThemeToggle={cycleTheme}
          />
        }

        right={<>
          <SoCBar {...(demo ? demo.battery : {})} />
          <BatteryStats vehicleStatus={demoKey} systems={demo ? demo.systems : undefined} />
          <VehicleParams speed={sim.speed} mode={sim.mode} />
        </>}

        driver={<>
          <div className="driver-pedal-left">
            <BrakePedal value={sim.brakePct} />
          </div>
          <div className="driver-center">
            <SteeringWheel />
          </div>
          <div className="driver-pedal-right">
            <AccelPedal value={sim.accelPct} />
          </div>
        </>}

        driverLeft={
          <SimControls
            gear={sim.gear}
            setGear={sim.setGear}
            driveMode={sim.driveMode}
            setDriveMode={sim.setDriveMode}
          />
        }

        driverRight={
          <SpeedGauge
            speed={sim.speed}
            gear={sim.gear}
            mode={sim.mode}
            rpm={sim.rpm}
            odo={sim.odo}
            alert={demoKey || 'ok'}
            turnSignal={turnSignal}
          />
        }
      />
    </div>
  )
}
