import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import PageHeader from '../components/PageHeader.jsx'
import { useApp } from '../context/useApp.js'
import { fetchNearbyPlaces, rankPlaces } from '../services/placesService.js'

const categories = [
  { id: 'all', label: 'All places' },
  { id: 'food', label: 'Restaurants & cafes' },
  { id: 'store', label: 'Stores' },
]

const locationOptions = { enableHighAccuracy: false, maximumAge: 300000, timeout: 60000 }

function placeIcon(kind) {
  return L.divIcon({
    className: 'nearby-marker-root',
    html: `<span class="nearby-marker nearby-marker-${kind}" aria-hidden="true"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function MapViewport({ center, selectedPlace }) {
  const map = useMap()
  const targetLat = selectedPlace?.lat ?? center.lat
  const targetLon = selectedPlace?.lon ?? center.lon
  const targetZoom = selectedPlace ? 16 : 14
  useEffect(() => {
    map.setView([targetLat, targetLon], targetZoom, { animate: true })
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }))
    return () => cancelAnimationFrame(frame)
  }, [map, targetLat, targetLon, targetZoom])
  return null
}

function placeLabel(place) {
  if (place.kind === 'store') {
    if (place.category === 'supermarket') return 'Grocery store'
    if (place.category === 'bakery') return 'Bakery'
    return 'Local shop'
  }
  if (place.category === 'cafe') return 'Cafe'
  if (place.category === 'fast_food') return 'Quick service'
  return 'Restaurant'
}

function formatDistance(distance) {
  return distance < 1 ? `${Math.max(50, Math.round(distance * 1000 / 50) * 50)} m` : `${distance.toFixed(1)} km`
}

function preferenceLabels(place) {
  const labels = []
  if (place.dietaryFit === 'match') labels.push('Diet tag match')
  if (place.dietaryFit === 'conflict') labels.push('Diet tag may not fit')
  if (place.dietaryFit === 'unknown') labels.push('Check menu')
  if (place.healthGoalFit === 'match') labels.push('Health-goal tag match')
  if (place.healthGoalFit === 'conflict') labels.push('Health-goal tag may not fit')
  if (place.cuisineFit === 'match') labels.push('Cuisine match')
  return labels.length ? labels.join(' · ') : 'Menu details not tagged'
}

function preferenceClass(place) {
  if (place.dietaryFit === 'conflict' || place.healthGoalFit === 'conflict') return 'conflict'
  if (place.dietaryFit === 'match' || place.healthGoalFit === 'match') return 'match'
  if (place.dietaryFit === 'neutral' && place.healthGoalFit === 'neutral') return 'neutral'
  return 'unknown'
}

function NearbyPlaceSkeleton() {
  return <article className="nearby-place nearby-place-skeleton" aria-hidden="true">
    <div className="nearby-place-select">
      <span className="skeleton nearby-skeleton-icon" />
      <span className="nearby-place-copy">
        <span className="skeleton nearby-skeleton-line" />
        <span className="skeleton nearby-skeleton-line short" />
      </span>
      <span className="skeleton nearby-skeleton-distance" />
    </div>
    <span className="skeleton nearby-skeleton-detail" />
  </article>
}

function NearbyLoadingLayout() {
  return <div className="nearby-layout" aria-busy="true">
    <section className="nearby-map-panel" aria-label="Nearby map loading">
      <div className="nearby-panel-heading"><div><p className="eyebrow">EXPLORE THE NEIGHBOURHOOD</p><h2>Nearby map</h2></div><span className="nearby-count">Waiting…</span></div>
      <div className="nearby-map">
        <div className="nearby-map-skeleton" role="status">
          <div className="nearby-map-skeleton-grid" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span className="skeleton" key={index} />)}</div>
          <span className="nearby-map-skeleton-label">Getting your location…</span>
        </div>
      </div>
      <div className="nearby-map-legend"><span><i className="legend-dot legend-food" />Restaurants & cafes</span><span><i className="legend-dot legend-store" />Stores</span><span><i className="legend-dot legend-user" />You</span></div>
    </section>
    <section className="nearby-results-panel" aria-label="Nearby places loading">
      <div className="nearby-panel-heading"><div><p className="eyebrow">PICKED FOR YOUR PREFERENCES</p><h2>Places to explore</h2></div></div>
      <div className="nearby-preference-skeleton" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <span className="skeleton" key={index} />)}
      </div>
      <div className="nearby-filter-skeleton" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => <span className="skeleton" key={index} />)}
      </div>
      <div className="nearby-search-skeleton" aria-hidden="true"><span className="skeleton" /></div>
      <p className="nearby-loading-note" role="status">Waiting for your location to find nearby matches…</p>
      <div className="nearby-place-list">{Array.from({ length: 3 }, (_, index) => <NearbyPlaceSkeleton key={index} />)}</div>
    </section>
  </div>
}

function directionsUrl(location, place) {
  return `https://www.openstreetmap.org/directions?engine=graphhopper_foot&route=${location.lat},${location.lon};${place.lat},${place.lon}`
}

function geolocationMessage(error) {
  if (error.code === 1) return 'Location access was declined. Allow location access in your browser settings, then try again.'
  if (error.code === 2) return 'Your location could not be determined. Check your device location settings and try again.'
  if (error.code === 3) return 'Getting your location took too long. Please try again.'
  return 'Your browser could not share your location. Please try again.'
}

export default function Nearby() {
  const { preferences } = useApp()
  const [location, setLocation] = useState(null)
  const [locationPending, setLocationPending] = useState(false)
  const [places, setPlaces] = useState([])
  const [placesPending, setPlacesPending] = useState(false)
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false)
  const [mapTileError, setMapTileError] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!location) return undefined
    let active = true
    const controller = new AbortController()
    async function load() {
      setPlacesPending(true)
      setError('')
      try {
        const results = await fetchNearbyPlaces(location, controller.signal)
        if (active && !controller.signal.aborted) setPlaces(results)
      } catch (loadError) {
        if (active && loadError.name !== 'AbortError') {
          setError(loadError.message)
        }
      } finally {
        if (!controller.signal.aborted) setPlacesPending(false)
      }
    }
    load()
    return () => {
      active = false
      controller.abort()
    }
  }, [location])

  const visiblePlaces = useMemo(() => {
    const ranked = rankPlaces(places, preferences, location || { lat: 0, lon: 0 })
    const query = search.trim().toLowerCase()
    return ranked.filter((place) => {
      const matchesCategory = category === 'all' || place.kind === category
      const matchesSearch = !query || [place.name, place.cuisine, placeLabel(place)].join(' ').toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [category, location, places, preferences, search])

  const selectedPlace = visiblePlaces.find((place) => place.id === selectedId) || null
  const displayedPlaces = placesPending ? visiblePlaces.slice(0, 4) : visiblePlaces
  const skeletonCount = placesPending ? (places.length ? 2 : 3) : 0

  function locate() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location access. You can enable it in a supported browser and try again.')
      return
    }

    setLocationPending(true)
    setError('')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setPlaces([])
      setSelectedId(null)
      setMapTilesLoaded(false)
      setMapTileError(false)
      setLocation({ lat: coords.latitude, lon: coords.longitude })
      setLocationPending(false)
    }, (locationError) => {
      setError(geolocationMessage(locationError))
      setLocationPending(false)
    }, locationOptions)
  }

  return <div className="nearby-page">
    <PageHeader
      eyebrow="GOOD FOOD, A LITTLE CLOSER"
      title="Places around you."
      description="Explore nearby stores, restaurants and cafes. Places with food-type, cuisine or health-goal tags that match your preferences appear first."
      action={<button className="button button-primary" type="button" onClick={locate} disabled={locationPending || placesPending}>{locationPending ? 'Finding you…' : placesPending ? 'Finding places…' : location ? 'Refresh nearby places' : 'Use my location'} <span aria-hidden="true">→</span></button>}
    />

    <p className="nearby-privacy-note"><span aria-hidden="true">i</span> Your precise location is used only after you choose to share it. OpenStreetMap receives it to find nearby places and display map tiles; it is not saved in your KhaanaKya profile.</p>
    {error && <p className="nearby-error" role="alert">{error}</p>}

    {!location ? locationPending ? <NearbyLoadingLayout /> : <section className="nearby-intro">
      <div className="nearby-intro-icon" aria-hidden="true">⌖</div>
      <p className="eyebrow">YOUR LOCATION STAYS YOURS</p>
      <h2>Find good options nearby.</h2>
      <p>Share your location when you’re ready. We’ll show nearby grocery stores, restaurants and cafes, with diet and cuisine tags highlighted when map data includes them.</p>
      <button className="button button-primary" type="button" onClick={locate} disabled={locationPending}>{locationPending ? 'Finding your location…' : 'Show places near me'} <span aria-hidden="true">→</span></button>
    </section> : <div className="nearby-layout">
      <section className="nearby-map-panel" aria-label="Nearby places map">
        <div className="nearby-panel-heading"><div><p className="eyebrow">EXPLORE THE NEIGHBOURHOOD</p><h2>Nearby map</h2></div><span className="nearby-count">{placesPending ? 'Searching…' : `${visiblePlaces.length} places`}</span></div>
        <div className="nearby-map">
          <MapContainer center={[location.lat, location.lon]} zoom={14} scrollWheelZoom={false} zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                load: () => setMapTilesLoaded(true),
                tileerror: () => setMapTileError(true),
              }}
            />
            <ZoomControl position="topright" />
            <MapViewport center={location} selectedPlace={selectedPlace} />
            <CircleMarker center={[location.lat, location.lon]} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#315bcb', fillOpacity: 1 }}>
              <Popup>You are here</Popup>
            </CircleMarker>
            {visiblePlaces.map((place) => <Marker key={place.id} position={[place.lat, place.lon]} icon={placeIcon(place.kind)} eventHandlers={{ click: () => setSelectedId(place.id) }}>
              <Popup>
                <strong>{place.name}</strong><br />
                <span>{placeLabel(place)}{place.cuisine ? ` · ${place.cuisine.replaceAll(';', ', ')}` : ''}</span><br />
                <a href={directionsUrl(location, place)} target="_blank" rel="noreferrer">Get directions</a>
              </Popup>
            </Marker>)}
          </MapContainer>
          {!mapTilesLoaded && !mapTileError && <div className="nearby-map-skeleton" role="status">
            <div className="nearby-map-skeleton-grid" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span className="skeleton" key={index} />)}</div>
            <span className="nearby-map-skeleton-label">Loading map…</span>
          </div>}
          {mapTileError && <div className="nearby-map-tile-error" role="status">Some map tiles are unavailable. Try zooming or moving the map; nearby results are still listed below.</div>}
        </div>
        <div className="nearby-map-legend"><span><i className="legend-dot legend-food" />Restaurants & cafes</span><span><i className="legend-dot legend-store" />Stores</span><span><i className="legend-dot legend-user" />You</span></div>
        <p className="nearby-map-credit">Place details from OpenStreetMap contributors. Map labels and dietary tags may be incomplete.</p>
      </section>

      <section className="nearby-results-panel" aria-label="Nearby places list">
        <div className="nearby-panel-heading"><div><p className="eyebrow">PICKED FOR YOUR PREFERENCES</p><h2>Places to explore</h2></div></div>
        {placesPending ? <div className="nearby-preference-skeleton" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => <span className="skeleton" key={index} />)}
        </div> : <div className="nearby-preference-summary">
          <span>{preferences.foodType || 'No food preference'}</span>
          {(preferences.cuisines || []).slice(0, 2).map((cuisine) => <span key={cuisine}>{cuisine}</span>)}
          {(preferences.healthGoals || []).slice(0, 2).map((goal) => <span key={goal}>{goal}</span>)}
          {(preferences.allergies || []).length > 0 && <span>Allergies: verify with venue</span>}
        </div>}
        <div className="nearby-filters" role="group" aria-label="Filter nearby places">
          {categories.map((item) => <button key={item.id} type="button" className={category === item.id ? 'active' : ''} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
        </div>
        <label className="nearby-search"><span className="sr-only">Search nearby places</span><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a place or cuisine" /></label>

        {placesPending && <p className="nearby-loading-note" role="status">{places.length ? 'Showing the closest options while we search farther…' : 'Finding nearby restaurants and cafes…'}</p>}
        {displayedPlaces.length > 0 || placesPending ? <div className="nearby-place-list">{displayedPlaces.map((place) => <article className={`nearby-place ${selectedId === place.id ? 'selected' : ''}`} key={place.id}>
            <button type="button" className="nearby-place-select" onClick={() => setSelectedId(place.id)} aria-pressed={selectedId === place.id}>
              <span className={`nearby-place-icon nearby-place-icon-${place.kind}`} aria-hidden="true">{place.kind === 'store' ? 'S' : 'F'}</span>
              <span className="nearby-place-copy"><strong>{place.name}</strong><span>{placeLabel(place)}{place.cuisine ? ` · ${place.cuisine.replaceAll(';', ', ')}` : ''}</span></span>
              <span className="nearby-distance">{formatDistance(place.distance)}</span>
            </button>
            {place.kind === 'food' && <p className={`nearby-fit nearby-fit-${preferenceClass(place)}`}>{preferenceLabels(place)}</p>}
            <a className="nearby-directions" href={directionsUrl(location, place)} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
          </article>)}
          {Array.from({ length: skeletonCount }, (_, index) => <NearbyPlaceSkeleton key={`skeleton-${index}`} />)}
        </div>
          : <div className="nearby-empty">{search ? 'No nearby places match that search. Try another name or cuisine.' : 'No named places were found in this area. Nearby map data varies by neighbourhood; try again later.'}</div>}
        <p className="nearby-footnote">Preference tags come from public map data, not verified menus. Always confirm ingredients and allergens directly with a venue.</p>
      </section>
    </div>}
  </div>
}
