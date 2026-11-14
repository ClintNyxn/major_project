/**
 * src/utils/recipeImageFallback.js
 *
 * Client-side recipe image discovery via Wikipedia API with:
 * - Dish name cleaning (removes brackets, "raw")
 * - 30-day localStorage cache by recipe ID
 * - Max 4 concurrent lookups to prevent request flooding
 * - Photo credit detection (Wikipedia vs Pexels)
 */

export const REJECT_WORDS = ['flag', 'map', 'logo', 'icon', 'symbol', 'coat_of_arms', 'diagram']
export const CACHE_PREFIX = 'kk_recipe_img_v1_'
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php'

/**
 * Cleans a dish name by removing brackets, trailing descriptors, and words like "raw".
 */
export function cleanDishName(rawName) {
  if (!rawName || typeof rawName !== 'string') return ''
  return rawName
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\braw\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Validates that an image URL has an acceptable photo extension
 * and does not contain diagram/symbol/flag keywords.
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  const lower = url.toLowerCase()

  for (const word of REJECT_WORDS) {
    if (lower.includes(word)) return false
  }

  const cleanPath = lower.split('?')[0].split('#')[0]
  return (
    cleanPath.endsWith('.jpg') ||
    cleanPath.endsWith('.jpeg') ||
    cleanPath.endsWith('.webp')
  )
}

/**
 * Derives the photo credit string from the image URL host.
 * upload.wikimedia.org = Wikipedia, images.pexels.com = Pexels.
 */
export function getPhotoCredit(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null
  const lower = imageUrl.toLowerCase()

  if (lower.includes('wikimedia.org') || lower.includes('wikipedia.org')) {
    return 'Wikipedia'
  }
  if (lower.includes('pexels.com')) {
    return 'Pexels'
  }
  return null
}

/**
 * Reads cached lookup result from localStorage if within 30 days.
 */
export function getCachedRecipeImage(recipeId) {
  if (!recipeId || typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}${recipeId}`)
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const age = Date.now() - (parsed.timestamp || 0)
      if (age < CACHE_TTL_MS) {
        return parsed.url || null
      }
    }
  } catch {
    // Ignore localStorage read errors
  }
  return undefined
}

/**
 * Saves lookup result to localStorage with current timestamp.
 */
export function setCachedRecipeImage(recipeId, url) {
  if (!recipeId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      `${CACHE_PREFIX}${recipeId}`,
      JSON.stringify({
        url: url || null,
        timestamp: Date.now(),
      })
    )
  } catch {
    // Ignore localStorage quota errors
  }
}

// Concurrency queue: limits active browser Wikipedia lookups to at most 4
let activeLookups = 0
const lookupQueue = []
const inFlightRequests = new Map()

function processQueue() {
  while (activeLookups < 4 && lookupQueue.length > 0) {
    const task = lookupQueue.shift()
    activeLookups++
    task().finally(() => {
      activeLookups--
      processQueue()
    })
  }
}

function enqueueLookup(task) {
  return new Promise((resolve, reject) => {
    lookupQueue.push(() => task().then(resolve, reject))
    processQueue()
  })
}

/**
 * Searches Wikipedia via direct title match, then search generator.
 */
async function fetchWikipediaImage(cleanedName, cuisine) {
  // 1. Direct title query with redirects enabled
  try {
    const directUrl = `${WIKIPEDIA_API_URL}?action=query&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=960&format=json&origin=*&titles=${encodeURIComponent(cleanedName)}`
    const res = await fetch(directUrl)
    if (res.ok) {
      const data = await res.json()
      const pages = data?.query?.pages
      if (pages) {
        for (const page of Object.values(pages)) {
          if (page.thumbnail?.source && isValidImageUrl(page.thumbnail.source)) {
            return page.thumbnail.source
          }
        }
      }
    }
  } catch {}

  // 2. Search query: "<dish> <cuisine> dish"
  const queries = [
    `${cleanedName} ${cuisine || ''} dish`.trim(),
    `${cleanedName} Indian cuisine`.trim(),
  ]

  for (const query of queries) {
    try {
      const searchUrl = `${WIKIPEDIA_API_URL}?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=960&format=json&origin=*`
      const res = await fetch(searchUrl)
      if (res.ok) {
        const data = await res.json()
        const pages = data?.query?.pages
        if (pages) {
          const sorted = Object.values(pages).sort((a, b) => (a.index || 0) - (b.index || 0))
          for (const page of sorted) {
            if (page.thumbnail?.source && isValidImageUrl(page.thumbnail.source)) {
              return page.thumbnail.source
            }
          }
        }
      }
    } catch {}
  }

  return null
}

/**
 * Gets or fetches a recipe image with local caching and concurrency limiting.
 */
export async function getOrFetchRecipeImage(recipe) {
  if (!recipe) return null

  // If already provided on recipe object, use directly
  const directUrl = recipe.image_url || recipe.image
  if (directUrl && typeof directUrl === 'string' && directUrl.trim() !== '') {
    return directUrl
  }

  if (!recipe.id) return null

  // Check 30-day localStorage cache
  const cached = getCachedRecipeImage(recipe.id)
  if (cached !== undefined) {
    return cached
  }

  // Deduplicate in-flight requests for the same recipe
  if (inFlightRequests.has(recipe.id)) {
    return inFlightRequests.get(recipe.id)
  }

  const cleanedName = cleanDishName(recipe.name)
  if (!cleanedName) {
    setCachedRecipeImage(recipe.id, null)
    return null
  }

  const lookupPromise = enqueueLookup(async () => {
    try {
      const foundUrl = await fetchWikipediaImage(cleanedName, recipe.cuisine)
      setCachedRecipeImage(recipe.id, foundUrl)
      return foundUrl
    } catch {
      setCachedRecipeImage(recipe.id, null)
      return null
    } finally {
      inFlightRequests.delete(recipe.id)
    }
  })

  inFlightRequests.set(recipe.id, lookupPromise)
  return lookupPromise
}

