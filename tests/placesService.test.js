import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchNearbyPlaces, getCuisineFit, getDietaryFit, getDistanceInKm, getHealthGoalFit, getPlaceKind, normalizePlace, rankPlaces } from '../src/services/placesService.js'

test('normalizes named OSM nodes and ways into food and store places', () => {
  const cafe = normalizePlace({
    type: 'node',
    id: 11,
    lat: 12.9,
    lon: 77.6,
    tags: { name: 'Cafe Green', amenity: 'cafe', cuisine: 'indian' },
  })
  const store = normalizePlace({
    type: 'way',
    id: 12,
    center: { lat: 12.91, lon: 77.61 },
    tags: { name: 'Market', shop: 'supermarket' },
  })

  assert.equal(cafe.kind, 'food')
  assert.equal(cafe.lat, 12.9)
  assert.equal(store.kind, 'store')
  assert.equal(store.lon, 77.61)
  assert.equal(normalizePlace({ type: 'node', id: 13, lat: 12, lon: 77, tags: { amenity: 'cafe' } }), null)
  assert.equal(getPlaceKind({ shop: 'supermarket' }), 'store')
})

test('ranks explicit dietary and cuisine matches ahead of closer unknown venues', () => {
  const places = [
    { id: 'unknown', kind: 'food', lat: 12.901, lon: 77.6, tags: {}, cuisine: '' },
    { id: 'match', kind: 'food', lat: 12.95, lon: 77.6, tags: { 'diet:vegan': 'yes' }, cuisine: 'north_indian' },
  ]
  const ranked = rankPlaces(places, { foodType: 'Vegan', cuisines: ['North Indian'] }, { lat: 12.9, lon: 77.6 })

  assert.equal(ranked[0].id, 'match')
  assert.equal(ranked[0].dietaryFit, 'match')
  assert.equal(ranked[1].dietaryFit, 'unknown')
  assert.equal(getCuisineFit(places[1], { cuisines: ['North Indian'] }), 'match')
})

test('reports incompatible tags without removing places from results', () => {
  const place = { kind: 'food', tags: { 'diet:vegan': 'no', 'diet:vegetarian': 'no' }, cuisine: '' }
  const preferences = { foodType: 'Vegan', cuisines: [] }

  assert.equal(getDietaryFit(place, preferences), 'conflict')
  assert.equal(rankPlaces([{ ...place, id: 'listed', lat: 12.9, lon: 77.6 }], preferences, { lat: 12.9, lon: 77.6 }).length, 1)
  assert.ok(getDistanceInKm({ lat: 12.9, lon: 77.6 }, { lat: 12.9, lon: 77.6 }) < 0.001)
})

test('uses supported health-goal tags only when map data explicitly includes them', () => {
  const place = { kind: 'food', tags: { 'diet:gluten_free': 'yes' } }
  assert.equal(getHealthGoalFit(place, { healthGoals: ['Gluten Free'] }), 'match')
  assert.equal(getHealthGoalFit({ kind: 'food', tags: {} }, { healthGoals: ['Gluten Free'] }), 'unknown')
  assert.equal(getHealthGoalFit({ kind: 'store', tags: {} }, { healthGoals: ['Gluten Free'] }), 'neutral')
})

test('queries nearby food and grocery places and surfaces service errors', async () => {
  const originalFetch = globalThis.fetch
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return {
      ok: true,
      json: async () => ({ elements: [{ type: 'node', id: 21, lat: 12.9, lon: 77.6, tags: { name: 'Cafe', amenity: 'cafe' } }] }),
    }
  }

  try {
    const places = await fetchNearbyPlaces({ lat: 12.9, lon: 77.6 })
    const query = new URLSearchParams(request.options.body).get('data')
    assert.equal(request.options.method, 'POST')
    assert.ok(query.includes('12.9,77.6'))
    assert.ok(query.includes('supermarket'))
    assert.ok(query.endsWith('out body center;'))
    assert.equal(places[0].name, 'Cafe')

    globalThis.fetch = async () => ({ ok: false, status: 503 })
    await assert.rejects(fetchNearbyPlaces({ lat: 12.9, lon: 77.6 }), /HTTP 503/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
