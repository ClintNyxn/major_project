const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const SEARCH_RADIUS_METERS = 3500

const foodAmenities = new Set(['restaurant', 'cafe', 'fast_food', 'food_court'])
const groceryShops = new Set(['supermarket', 'convenience', 'greengrocer', 'bakery', 'health_food', 'farm'])
const supportedHealthGoals = {
  'Low Carb': 'diet:low_carb',
  'Low Sugar': 'diet:low_sugar',
  'Gluten Free': 'diet:gluten_free',
  'Dairy Free': 'diet:dairy_free',
}

function normalized(value) {
  return String(value || '').toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ').trim()
}

function coordinateOf(element) {
  const lat = element.lat ?? element.center?.lat
  const lon = element.lon ?? element.center?.lon
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
}

export function getPlaceKind(tags = {}) {
  if (foodAmenities.has(tags.amenity)) return 'food'
  if (groceryShops.has(tags.shop)) return 'store'
  return null
}

export function normalizePlace(element) {
  const tags = element.tags || {}
  const coordinates = coordinateOf(element)
  const kind = getPlaceKind(tags)
  if (!coordinates || !kind || !tags.name) return null

  return {
    id: `${element.type}/${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name: tags.name,
    kind,
    category: tags.amenity || tags.shop,
    cuisine: tags.cuisine || '',
    tags,
    ...coordinates,
  }
}

export function getDistanceInKm(from, to) {
  const radians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = radians(to.lat - from.lat)
  const longitudeDelta = radians(to.lon - from.lon)
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export function getDietaryFit(place, preferences) {
  if (place.kind !== 'food' || !preferences.foodType || preferences.foodType === 'No preference' || preferences.foodType === 'Non-Vegetarian') return 'neutral'

  const tags = place.tags || {}
  const vegan = tags['diet:vegan']
  const vegetarian = tags['diet:vegetarian']
  const pescetarian = tags['diet:pescetarian']
  const foodType = preferences.foodType

  if (foodType === 'Vegan') {
    if (vegan === 'yes') return 'match'
    if (vegan === 'no' || vegetarian === 'no') return 'conflict'
  } else if (foodType === 'Pescatarian') {
    if (pescetarian === 'yes' || vegetarian === 'yes' || vegan === 'yes') return 'match'
    if (pescetarian === 'no') return 'conflict'
  } else if (foodType === 'Vegetarian' || foodType === 'Eggetarian') {
    if (vegetarian === 'yes' || vegan === 'yes') return 'match'
    if (vegetarian === 'no') return 'conflict'
  }

  return 'unknown'
}

export function getCuisineFit(place, preferences) {
  const selectedCuisines = (preferences.cuisines || []).map(normalized).filter(Boolean)
  if (place.kind !== 'food' || selectedCuisines.length === 0 || !place.cuisine) return 'unknown'
  const placeCuisines = place.cuisine.split(';').map(normalized)
  return selectedCuisines.some((cuisine) => placeCuisines.some((item) => item === cuisine || item.includes(cuisine)))
    ? 'match'
    : 'unknown'
}

export function getHealthGoalFit(place, preferences) {
  if (place.kind !== 'food') return 'neutral'
  const tags = (preferences.healthGoals || []).map((goal) => supportedHealthGoals[goal]).filter(Boolean)
  if (tags.length === 0) return 'neutral'
  const values = tags.map((tag) => place.tags?.[tag])
  if (values.includes('yes')) return 'match'
  if (values.every((value) => value === 'no')) return 'conflict'
  return 'unknown'
}

export function rankPlaces(places, preferences, location) {
  return places
    .map((place) => ({
      ...place,
      distance: getDistanceInKm(location, place),
      dietaryFit: getDietaryFit(place, preferences),
      cuisineFit: getCuisineFit(place, preferences),
      healthGoalFit: getHealthGoalFit(place, preferences),
    }))
    .sort((left, right) => {
      const score = (place) => (place.dietaryFit === 'match' ? 4 : place.dietaryFit === 'conflict' ? -2 : 0)
        + (place.cuisineFit === 'match' ? 2 : 0)
        + (place.healthGoalFit === 'match' ? 2 : place.healthGoalFit === 'conflict' ? -1 : 0)
      return score(right) - score(left) || left.distance - right.distance
    })
}

export async function fetchNearbyPlaces(location, signal) {
  const query = `[out:json][timeout:20];(nwr(around:${SEARCH_RADIUS_METERS},${location.lat},${location.lon})["amenity"~"^(restaurant|cafe|fast_food|food_court)$"];nwr(around:${SEARCH_RADIUS_METERS},${location.lat},${location.lon})["shop"~"^(supermarket|convenience|greengrocer|bakery|health_food|farm)$"];);out body center;`
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({ data: query }),
    signal,
  })

  if (!response.ok) throw new Error(`Nearby places are unavailable right now (HTTP ${response.status}). Please try again.`)

  const payload = await response.json()
  if (!Array.isArray(payload.elements)) throw new Error('The map service returned an unexpected response. Please try again.')
  return payload.elements.map(normalizePlace).filter(Boolean)
}
