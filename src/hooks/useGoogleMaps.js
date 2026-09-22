import { useEffect, useState } from 'react'

const SCRIPT_ID = 'gmap-script'

function mapsReady() {
  return Boolean(
    window.google &&
    window.google.maps &&
    window.google.maps.places &&
    window.google.maps.places.AutocompleteService
  )
}

export default function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(mapsReady)
  // Check for problems we can detect up front: a missing API key or a
  // script tag that already failed to load on a previous mount.
  const [error, setError] = useState(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_KEY) return 'Missing API in .env'
    if (document.getElementById(SCRIPT_ID)?.dataset.failed === 'true') {
      return 'Failed to load Google Maps — check your API key or disable ad blocker'
    }
    return null
  })

  useEffect(() => {
    // If the script is already loaded, the lazy initializer above handled it.
    if (mapsReady()) return
    if (!import.meta.env.VITE_GOOGLE_MAPS_KEY) return

    let canceled = false
    let interval = null

    // Maps is loaded asynchronously, so poll until `window.google.maps` appears.
    const POLL_TIMEOUT_MS = 15000
    const startPolling = (delay) => {
      const started = performance.now()
      interval = setInterval(() => {
        if (mapsReady()) {
          clearInterval(interval)
          interval = null
          if (!canceled) setIsLoaded(true)
        } else if (performance.now() - started > POLL_TIMEOUT_MS) {
          clearInterval(interval)
          interval = null
          if (!canceled) {
            setError('Places API not available — enable the legacy "Places API" in Google Cloud Console')
          }
        }
      }, delay)
    }

    // A script tag may already exist from a previous mount (or StrictMode).
    // If it failed before, there's nothing to wait for.
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      if (existing.dataset.failed === 'true') return
      startPolling(100)
      return () => { canceled = true; if (interval) clearInterval(interval) }
    }

    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
    const script = document.createElement('script')
    script.id    = SCRIPT_ID
    script.src   = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly&loading=async`
    script.async = true
    script.defer = true

    script.onload = () => startPolling(50)

    script.onerror = () => {
      script.dataset.failed = 'true'
      if (!canceled) setError('Failed to load Google Maps — check your API key or disable ad blocker')
    }

    document.head.appendChild(script)

    return () => {
      canceled = true
      if (interval) clearInterval(interval)
    }
  }, [])

  return { isLoaded, error }
}