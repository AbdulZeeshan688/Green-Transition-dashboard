import { useState, useRef } from 'react'
import { computeRouteEnergy } from '../utils/physics'

// Route + elevation data from Google Maps. If the backend takes over
// route planning, keep the same routeData shape:
//   elevArr, whData, gradeArr, cumWh, totalWh, regenWh, climb, descent,
//   wh100, rangeKm, elevLocations [{lat,lng,elevation}], directionsResult
export default function useRoute() {
  const [routeData, setRouteData] = useState(null)
  const [routeName, setRouteName] = useState(null)
  const [distKm,    setDistKm]    = useState(0)
  const [status,    setStatus]    = useState('')
  const [error,     setError]     = useState(null)

  const directionsService = useRef(null)
  const elevationService  = useRef(null)
  // Increments per request so stale async callbacks can be ignored
  const requestId         = useRef(0)

  function initServices() {
    directionsService.current = new window.google.maps.DirectionsService()
    elevationService.current  = new window.google.maps.ElevationService()
  }

  function fetchRoute(originPlace, destPlace, params) {
    if (!directionsService.current) return
    if (!originPlace || !destPlace) return

    const id = ++requestId.current

    setError(null)
    setRouteData(null)
    setStatus('Fetching route...')

    directionsService.current.route({
      origin:      originPlace.geometry.location,
      destination: destPlace.geometry.location,
      travelMode:  window.google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status !== 'OK') {
        if (id === requestId.current) {
          setError('Route error: ' + status)
          setStatus('')
        }
        return
      }

      const leg          = result.routes[0].legs[0]
      const km           = leg.distance.value / 1000
      const overviewPath = result.routes[0].overview_path
      const name         = `${leg.start_address.split(',')[0]} → ${leg.end_address.split(',')[0]}`

      if (id !== requestId.current) return // stale response — ignore

      setDistKm(km)
      setRouteName(name)
      setStatus('Fetching elevation data...')

      elevationService.current.getElevationAlongPath({
        path:    overviewPath,
        samples: Math.min(256, Math.max(64, Math.round(km * 3)))
      }, (elevResults, elevStatus) => {
        if (elevStatus !== 'OK') {
          if (id === requestId.current) {
            setError('Elevation error: ' + elevStatus)
            setStatus('')
          }
          return
        }

        if (id !== requestId.current) return // stale response — ignore

        const elevValues = elevResults.map(e => e.elevation)
        const elevMin    = Math.min(...elevValues)
        const elevMax    = Math.max(...elevValues)
        const elevRange  = elevMax - elevMin || 1

        const syntheticRoute = {
          distKm:    km,
          baseElev:  elevMin,
          elevRange,
          elev: elevValues.map(e => (e - elevMin) / elevRange)
        }

        const computed = computeRouteEnergy(syntheticRoute, params)

        computed.elevLocations = elevResults.map(e => ({
          lat:       e.location.lat(),
          lng:       e.location.lng(),
          elevation: e.elevation
        }))

        computed.directionsResult = result

        setRouteData(computed)
        setStatus('')
      })
    })
  }

  return {
    routeData,
    routeName,
    distKm,
    status,
    error,
    initServices,
    fetchRoute
  }
}