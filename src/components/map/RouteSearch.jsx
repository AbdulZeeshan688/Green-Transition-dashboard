import { useEffect, useRef, useState } from 'react'
import './RouteSearch.css'

export default function RouteSearch({ isLoaded, onRouteRequest }) {
  const [originPlace, setOriginPlace] = useState(null)
  const [destPlace,   setDestPlace]   = useState(null)
  const [originVal,   setOriginVal]   = useState('')
  const [destVal,     setDestVal]     = useState('')
  const [originSugg,  setOriginSugg]  = useState([])
  const [destSugg,    setDestSugg]    = useState([])
  const [placeError,  setPlaceError]  = useState(null)

  const acService    = useRef(null)
  const sessionToken = useRef(null)

  useEffect(() => {
    if (!isLoaded) return
    acService.current    = new window.google.maps.places.AutocompleteService()
    sessionToken.current = new window.google.maps.places.AutocompleteSessionToken()
  }, [isLoaded])

  function getSuggestions(val, setter) {
    if (!acService.current || val.length < 2) { setter([]); setPlaceError(null); return }
    acService.current.getPlacePredictions(
      { input: val, sessionToken: sessionToken.current },
      (predictions, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
          setter([])
          if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setPlaceError('Autocomplete denied — enable legacy "Places API" in Google Cloud Console')
          }
          return
        }
        setPlaceError(null)
        setter(predictions.slice(0, 5))
      }
    )
  }

  function selectPlace(prediction, field) {
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status !== 'OK' || !results[0]) return
      const place = {
        name:              prediction.structured_formatting.main_text,
        formatted_address: prediction.description,
        geometry:          results[0].geometry
      }
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken()
      if (field === 'origin') {
        setOriginPlace(place)
        setOriginVal(place.name)
        setOriginSugg([])
      } else {
        setDestPlace(place)
        setDestVal(place.name)
        setDestSugg([])
      }
    })
  }

  function handleSearch() {
    if (!originPlace || !destPlace) return
    onRouteRequest(originPlace, destPlace)
  }

  if (!isLoaded) return (
    <div className="search-loading">Loading maps...</div>
  )

  const canSearch = !!originPlace && !!destPlace

  return (
    <div className="search-bar">
      <SearchInput
        value={originVal}
        placeholder="From..."
        suggestions={originSugg}
        onChange={v => {
          setOriginVal(v)
          setOriginPlace(null)
          getSuggestions(v, setOriginSugg)
        }}
        onSelect={p => selectPlace(p, 'origin')}
        onClear={() => { setOriginVal(''); setOriginPlace(null); setOriginSugg([]) }}
      />

      <div className="search-arrow">→</div>

      <SearchInput
        value={destVal}
        placeholder="To..."
        suggestions={destSugg}
        onChange={v => {
          setDestVal(v)
          setDestPlace(null)
          getSuggestions(v, setDestSugg)
        }}
        onSelect={p => selectPlace(p, 'dest')}
        onClear={() => { setDestVal(''); setDestPlace(null); setDestSugg([]) }}
      />

      <button
        onClick={handleSearch}
        disabled={!canSearch}
        className={`search-btn ${canSearch ? 'active' : 'inactive'}`}
      >
        {canSearch ? 'Go →' : 'Select locations'}
      </button>

      {placeError && (
        <div className="search-place-error">{placeError}</div>
      )}
    </div>
  )
}

function SearchInput({ value, placeholder, suggestions, onChange, onSelect, onClear }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div ref={wrapRef} className="search-input-wrap">
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          placeholder={placeholder}
          className="search-input"
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button
            className="search-clear"
            onMouseDown={e => { e.preventDefault(); onClear(); setOpen(false) }}
            aria-label="Clear input"
          >
            ×
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="search-dropdown">
          {suggestions.map(p => (
            <div
              key={p.place_id}
              className="search-suggestion"
              onMouseDown={e => { e.preventDefault(); onSelect(p); setOpen(false) }}
            >
              <div className="search-suggestion-main">
                {p.structured_formatting.main_text}
              </div>
              <div className="search-suggestion-sub">
                {p.structured_formatting.secondary_text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}