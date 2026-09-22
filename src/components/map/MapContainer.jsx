import { memo, useEffect, useRef } from 'react'
import { getSegmentColor } from '../../utils/colors'
import RouteSearch from './RouteSearch'
import './MapContainer.css'

function ThemeIcon({ themeIndex }) {
  const icons = [
    // Dark — moon
    <svg key="moon" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 9.5C12.5 11.5 10.5 13 8 13C4.5 13 2 10.5 2 7C2 4.5 3.5 2.5 5.5 1.5C3 2.5 1.5 5 1.5 7.5C1.5 11 4.5 14 8 14C10.5 14 12.5 12.5 13.5 10.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>,
    // Light — sun
    <svg key="sun" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.3 3.3L4.7 4.7M11.3 11.3L12.7 12.7M3.3 12.7L4.7 11.3M11.3 4.7L12.7 3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>,
  ]
  return icons[themeIndex] || icons[0]
}

const mapStyles = [
  // Theme 0: Dark
  [
    { elementType: 'geometry',           stylers: [{ color: '#0d1117' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#4b5e7a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0d14' }] },
    { featureType: 'road',               elementType: 'geometry', stylers: [{ color: '#1e2d45' }] },
    { featureType: 'road.highway',       elementType: 'geometry', stylers: [{ color: '#243552' }] },
    { featureType: 'water',              elementType: 'geometry', stylers: [{ color: '#060c14' }] },
    { featureType: 'poi',                stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',            stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape',          elementType: 'geometry', stylers: [{ color: '#0d1420' }] },
  ],
  // Theme 1: Light
  [
    { elementType: 'geometry',           stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road',               elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.highway',       elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
    { featureType: 'water',              elementType: 'geometry', stylers: [{ color: '#dce8f0' }] },
    { featureType: 'poi',                stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',            stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape',          elementType: 'geometry', stylers: [{ color: '#f0f0f0' }] },
  ],
]

const THEME_LABELS = ['Dark', 'Light']

function MapContainer({
  isLoaded,
  routeData,
  onServicesReady,
  onRouteRequest,
  routeName,
  status,
  mapsError,
  routeError,
  themeIndex = 0,
  onThemeToggle
}) {
  const mapDivRef    = useRef(null)
  const mapRef       = useRef(null)
  const polylinesRef = useRef([])
  const markersRef   = useRef([])
  const rendererRef  = useRef(null)

  useEffect(() => {
    if (!isLoaded || !mapDivRef.current) return
    if (mapRef.current) return

    const map = new window.google.maps.Map(mapDivRef.current, {
      center:            { lat: 62.0, lng: 25.5 },
      zoom:              6,
      mapTypeId:         'terrain',
      streetViewControl: false,
      mapTypeControl:    false,
      fullscreenControl: false,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM
      },
      styles: mapStyles[themeIndex] || mapStyles[0]
    })

    mapRef.current      = map
    rendererRef.current = new window.google.maps.DirectionsRenderer({
      map,
      suppressPolylines: true,
      suppressMarkers:   true
    })

    // Services are only initialized once when the map mounts.
    // onServicesReady is a stable callback from the parent.
    onServicesReady()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  // Update map styles when theme changes
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setOptions({ styles: mapStyles[themeIndex] || mapStyles[0] })
  }, [themeIndex])

  useEffect(() => {
    if (!routeData || !mapRef.current) return

    polylinesRef.current.forEach(p => p.setMap(null))
    markersRef.current.forEach(m => m.setMap(null))
    polylinesRef.current = []
    markersRef.current   = []

    rendererRef.current.setDirections(routeData.directionsResult)

    const locs = routeData.elevLocations
    for (let i = 1; i < locs.length; i++) {
      const dH    = locs[i].elevation - locs[i - 1].elevation
      const color = getSegmentColor(dH)
      const poly  = new window.google.maps.Polyline({
        path: [
          { lat: locs[i - 1].lat, lng: locs[i - 1].lng },
          { lat: locs[i].lat,     lng: locs[i].lng }
        ],
        strokeColor:   color,
        strokeOpacity: 1.0,
        strokeWeight:  5,
        map:           mapRef.current,
        zIndex:        i
      })
      polylinesRef.current.push(poly)
    }

    const start = locs[0]
    const end   = locs[locs.length - 1]

    markersRef.current.push(new window.google.maps.Marker({
      position: { lat: start.lat, lng: start.lng },
      map:      mapRef.current,
      label:    { text: 'A', color: '#fff', fontWeight: '700' },
      title:    'Start'
    }))

    markersRef.current.push(new window.google.maps.Marker({
      position: { lat: end.lat, lng: end.lng },
      map:      mapRef.current,
      label:    { text: 'B', color: '#fff', fontWeight: '700' },
      title:    'End'
    }))

    const bounds = new window.google.maps.LatLngBounds()
    locs.forEach(l => bounds.extend({ lat: l.lat, lng: l.lng }))
    mapRef.current.fitBounds(bounds, { padding: 60 })

  }, [routeData])

  return (
    <div className="map-root">

      <div
        ref={mapDivRef}
        id="google-map-div"
        className="map-div"
      />

      {!isLoaded && (
        <div className="map-loading">
          {mapsError || 'Loading map...'}
        </div>
      )}

      {/* Theme toggle — top right corner */}
      {isLoaded && (
        <button
          className="map-theme-toggle"
          onClick={onThemeToggle}
          title={THEME_LABELS[themeIndex]}
          aria-label={`Switch theme (currently ${THEME_LABELS[themeIndex]})`}
        >
          <ThemeIcon themeIndex={themeIndex} />
        </button>
      )}

      {/* Search bar floating center-top */}
      {isLoaded && (
        <div className="map-search-overlay">
          <RouteSearch
            isLoaded={isLoaded}
            onRouteRequest={onRouteRequest}
          />
        </div>
      )}

      {/* Route name floating bottom */}
      {routeName && (
        <div className="map-route-bar">
          {routeName}
        </div>
      )}

      {/* Status top right */}
      {status && (
        <div className="map-status-bar">
          {status}
        </div>
      )}

      {/* Route error — replaces status when route fetch fails */}
      {routeError && (
        <div className="map-error-bar">
          {routeError}
        </div>
      )}

    </div>
  )
}

export default memo(MapContainer)
