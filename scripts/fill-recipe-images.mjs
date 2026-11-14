#!/usr/bin/env node

/**
 * scripts/fill-recipe-images.mjs
 *
 * Populates recipes.image_url from Wikipedia (Pexels fallback) via the Supabase REST API.
 * Requires Node 18+ (uses native fetch). No extra dependencies.
 *
 * Usage:
 *   SUPABASE_URL="https://your-project.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="your-secret-key" \
 *   node scripts/fill-recipe-images.mjs [--dry-run] [--force] [--limit=N]
 *
 * Options:
 *   --dry-run     Show what would be saved, change nothing
 *   --force       Also replace rows that already have an image_url
 *   --limit=N     Only process the first N matching rows
 *
 * Optional:
 *   PEXELS_API_KEY="..."   Used as a fallback when Wikipedia has no photo
 */

const WIKIPEDIA_USER_AGENT = 'KhaanaKyaRecipeImageBot/1.0 (https://github.com/khaanakya; contact@khaanakya.app)'
const REJECT_WORDS = ['flag', 'map', 'logo', 'icon', 'symbol', 'coat_of_arms', 'diagram']

/**
 * Cleans a dish name by removing brackets, trailing descriptors, and words like "raw".
 * Exported so it can be unit-tested independently.
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
 * Validates that the URL points to a standard photo (.jpg, .jpeg, .webp)
 * and does not contain blacklisted diagram/symbol keywords.
 * Exported so it can be unit-tested independently.
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
 * 1. Direct Wikipedia pageimages title query
 */
async function searchWikipediaDirect(dishName) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=960&format=json&titles=${encodeURIComponent(dishName)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': WIKIPEDIA_USER_AGENT },
    })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null

    for (const page of Object.values(pages)) {
      if (page.thumbnail?.source && isValidImageUrl(page.thumbnail.source)) {
        return {
          url: page.thumbnail.source,
          source: 'Wikipedia',
          matchedTitle: page.title || dishName,
        }
      }
    }
  } catch {
    return null
  }
  return null
}

/**
 * 2. Wikipedia search query (using generator=search)
 */
async function searchWikipediaQuery(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=960&format=json`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': WIKIPEDIA_USER_AGENT },
    })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null

    // Sort by search rank index
    const sorted = Object.values(pages).sort((a, b) => (a.index || 0) - (b.index || 0))
    for (const page of sorted) {
      if (page.thumbnail?.source && isValidImageUrl(page.thumbnail.source)) {
        return {
          url: page.thumbnail.source,
          source: 'Wikipedia search',
          matchedTitle: page.title,
        }
      }
    }
  } catch {
    return null
  }
  return null
}

/**
 * 3. Pexels search query (if PEXELS_API_KEY is configured)
 *    Reads PEXELS_API_KEY lazily from env so the module can be safely imported for testing.
 */
async function searchPexels(dishName, cuisine) {
  const pexelsKey = process.env.PEXELS_API_KEY?.trim()
  if (!pexelsKey) return null
  const query = `${dishName} ${cuisine || ''} indian food`.trim()
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`
  try {
    const res = await fetch(url, {
      headers: { Authorization: pexelsKey },
    })
    if (!res.ok) return null
    const data = await res.json()
    const photo = data?.photos?.[0]
    const candidate = photo?.src?.large2x || photo?.src?.large || photo?.src?.original
    if (candidate && isValidImageUrl(candidate)) {
      return {
        url: candidate,
        source: 'Pexels',
        matchedTitle: photo.photographer ? `Photo by ${photo.photographer}` : query,
      }
    }
  } catch {
    return null
  }
  return null
}

/**
 * Orchestrates image discovery for a dish
 */
async function findImageForDish(dishName, cuisine) {
  const cleaned = cleanDishName(dishName)
  if (!cleaned) return null

  // 1. Wikipedia exact title
  const directMatch = await searchWikipediaDirect(cleaned)
  if (directMatch) return directMatch

  // 2. Wikipedia search: "<dish> <cuisine> dish"
  const searchMatch1 = await searchWikipediaQuery(`${cleaned} ${cuisine || ''} dish`.trim())
  if (searchMatch1) return searchMatch1

  // 2b. Wikipedia search: "<dish> Indian cuisine"
  const searchMatch2 = await searchWikipediaQuery(`${cleaned} Indian cuisine`)
  if (searchMatch2) return searchMatch2

  // 3. Pexels (if API key available)
  const pexelsMatch = await searchPexels(cleaned, cuisine)
  if (pexelsMatch) return pexelsMatch

  return null
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  // Read env vars inside run() so the module can be safely imported for testing
  const SUPABASE_URL = process.env.SUPABASE_URL?.trim()
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Missing required environment variables.')
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.')
    console.error('')
    console.error('Example:')
    console.error('  SUPABASE_URL="https://xyz.supabase.co" \\')
    console.error('  SUPABASE_SERVICE_ROLE_KEY="sb_secret_... or eyJ..." \\')
    console.error('  node scripts/fill-recipe-images.mjs --dry-run --limit=5')
    process.exit(1)
  }

  // Parse command-line flags
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isForce = args.includes('--force')
  const limitArg = args.find((arg) => arg.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null

  // Headers for Supabase REST API
  const authHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
  }
  if (!SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')) {
    authHeaders.Authorization = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }

  const baseUrl = SUPABASE_URL.replace(/\/$/, '')
  console.log('Connecting to Supabase REST API...')

  // Step 1: Fetch cuisines to map cuisine_id to human names
  const cuisineMap = new Map()
  try {
    const cuisinesRes = await fetch(`${baseUrl}/rest/v1/cuisines?select=id,name`, {
      headers: authHeaders,
    })
    if (cuisinesRes.ok) {
      const cuisinesData = await cuisinesRes.json()
      if (Array.isArray(cuisinesData)) {
        for (const c of cuisinesData) {
          cuisineMap.set(c.id, c.name)
        }
      }
    }
  } catch {}

  // Step 2: Paginate and fetch all recipes
  const PAGE_SIZE = 100
  let offset = 0
  const allRecipes = []

  while (true) {
    const rangeHeader = `${offset}-${offset + PAGE_SIZE - 1}`
    const res = await fetch(`${baseUrl}/rest/v1/recipes?select=*&order=id.asc`, {
      headers: {
        ...authHeaders,
        Range: rangeHeader,
        'Range-Unit': 'items',
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`Failed to fetch recipes from Supabase: ${res.status} ${res.statusText}`)
      console.error(errText)
      process.exit(1)
    }

    const chunk = await res.json()
    if (!Array.isArray(chunk) || chunk.length === 0) break
    allRecipes.push(...chunk)
    if (chunk.length < PAGE_SIZE) break
    offset += chunk.length
  }

  if (allRecipes.length === 0) {
    console.log('No recipes found in the "recipes" table.')
    return
  }

  const sampleRow = allRecipes[0]
  const availableColumns = Object.keys(sampleRow)

  // Step 3: Detect dish name column
  const candidateNameCols = ['title', 'name', 'recipe_name', 'dish_name']
  const nameCol = candidateNameCols.find((col) => col in sampleRow)

  if (!nameCol) {
    console.error('Could not detect dish name column in recipes table.')
    console.error(`Actual columns found: ${availableColumns.join(', ')}`)
    process.exit(1)
  }

  // Step 4: Verify image_url column
  if (!('image_url' in sampleRow)) {
    console.error('The "image_url" column does not exist on the public.recipes table.')
    console.error('Please execute the following SQL statement in your Supabase SQL Editor:')
    console.error('ALTER TABLE public.recipes ADD COLUMN image_url text;')
    process.exit(1)
  }

  console.log(`Detected dish name column: "${nameCol}"`)
  console.log(`Found ${allRecipes.length} total recipes in database.`)

  // Filter rows
  let rowsToProcess = allRecipes.filter((row) => {
    if (isForce) return true
    return !row.image_url || String(row.image_url).trim() === ''
  })

  if (limit && Number.isFinite(limit) && limit > 0) {
    rowsToProcess = rowsToProcess.slice(0, limit)
  }

  console.log(`Processing ${rowsToProcess.length} recipes (mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}${isForce ? ', force=true' : ''})...`)
  console.log('--------------------------------------------------------------------------------')

  let foundCount = 0
  let missingCount = 0
  let failedCount = 0

  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i]
    const rawDishName = row[nameCol]
    const cuisine = cuisineMap.get(row.cuisine_id) || row.cuisine || ''

    try {
      const match = await findImageForDish(rawDishName, cuisine)

      if (match) {
        foundCount++
        console.log(`[${match.source}] "${rawDishName}" -> matched "${match.matchedTitle}": ${match.url}`)

        if (!isDryRun) {
          const patchUrl = `${baseUrl}/rest/v1/recipes?id=eq.${encodeURIComponent(row.id)}`
          const patchRes = await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
              ...authHeaders,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ image_url: match.url }),
          })

          if (!patchRes.ok) {
            failedCount++
            const errBody = await patchRes.text()
            console.error(`  -> Failed to update row id=${row.id}: ${patchRes.status} ${errBody}`)
          }
        }
      } else {
        missingCount++
        console.log(`[Not Found] "${rawDishName}" -> no matching photo found`)
      }
    } catch (err) {
      failedCount++
      console.error(`[Error] "${rawDishName}": ${err.message}`)
    }

    // Rate limiting: 250ms between rows
    await sleep(250)
  }

  console.log('================================================================================')
  console.log('Recipe Image Fill Summary')
  console.log('================================================================================')
  console.log(`Total processed : ${rowsToProcess.length}`)
  console.log(`Found & matched : ${foundCount}`)
  console.log(`Missing/No photo: ${missingCount}`)
  console.log(`Failed/Errors   : ${failedCount}`)
  console.log(`Execution Mode  : ${isDryRun ? 'DRY RUN (no database changes written)' : 'LIVE (saved to database)'}`)
  console.log('================================================================================')
}

// Only execute when invoked directly as a script
if (process.argv[1]?.endsWith('fill-recipe-images.mjs')) {
  run().catch((err) => {
    console.error('Fatal error running fill-recipe-images script:', err)
    process.exit(1)
  })
}
