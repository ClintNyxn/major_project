import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from './appContext.js'
import { useAuth } from './useAuth.js'
import { loadAccountData, saveAccountData } from '../services/accountDataService.js'
import { loadCatalog } from '../services/catalogService.js'

const STORAGE_KEY = 'khaanakya-prototype-v1'
const ACCOUNT_CACHE_PREFIX = 'khaanakya-account-v1:'
const GUEST_OWNER = 'guest'
const CATALOG_CONNECTION_ERROR = 'Connect to Supabase to load the recipe catalog. Run npm run db:setup for the local database.'

const initialState = {
  profile: { name: '', phone: '', email: '', city: '', address: '', pinCode: '' },
  preferences: { foodType: 'No preference', cuisines: [], healthGoals: [], allergies: [], budget: 400, budgetScope: 'per person', maxTime: 60 },
  ingredients: [],
  pantryAlwaysAvailable: true,
  servings: 2,
  favorites: [],
  shopping: [],
  viewed: [],
  recentRecommendations: [],
  compared: [],
}

function normalizeState(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Your saved account data is not valid.')
  return {
    ...initialState,
    ...saved,
    profile: { ...initialState.profile, ...saved.profile },
    preferences: { ...initialState.preferences, ...saved.preferences },
  }
}

function readState(key = STORAGE_KEY) {
  try {
    const saved = window.localStorage.getItem(key)
    return saved ? normalizeState(JSON.parse(saved)) : initialState
  } catch (error) {
    console.error('Could not restore the saved KhaanaKya data.', error)
    return initialState
  }
}

function accountCacheKey(userId) {
  return `${ACCOUNT_CACHE_PREFIX}${userId}`
}

function readAccountCache(userId) {
  try {
    const saved = window.localStorage.getItem(accountCacheKey(userId))
    if (!saved) return null
    const cache = JSON.parse(saved)
    return {
      state: normalizeState(cache.state),
      dirty: cache.dirty === true,
      baseUpdatedAt: cache.baseUpdatedAt || null,
    }
  } catch (error) {
    console.error('Could not restore the local account-data cache.', error)
    return null
  }
}

function writeAccountCache(userId, cache) {
  try {
    window.localStorage.setItem(accountCacheKey(userId), JSON.stringify(cache))
    return ''
  } catch (error) {
    console.error('Could not save the local account-data cache.', error)
    return `Your account data could not be cached on this device: ${error.message}`
  }
}

function withAccountDetails(state, accountDetails) {
  const name = accountDetails.fullName?.trim()
  return {
    ...state,
    profile: {
      ...state.profile,
      name: state.profile.name || name || '',
      email: state.profile.email || accountDetails.email || '',
    },
  }
}

export function AppProvider({ children }) {
  const { client, user } = useAuth()
  const userId = user?.id || null
  const accountName = user?.user_metadata?.full_name
  const accountEmail = user?.email
  const [state, setState] = useState(readState)
  const [hydratedOwner, setHydratedOwner] = useState(GUEST_OWNER)
  const [dataReady, setDataReady] = useState(true)
  const [dataError, setDataError] = useState('')
  const [dataConflict, setDataConflict] = useState(null)
  const [syncStatus, setSyncStatus] = useState('local')
  const [syncError, setSyncError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  const [catalog, setCatalog] = useState(null)
  const [catalogStatus, setCatalogStatus] = useState(client ? 'loading' : 'error')
  const [catalogError, setCatalogError] = useState(client ? '' : CATALOG_CONNECTION_ERROR)
  const syncBaseUpdatedAt = useRef(null)
  const saveTimer = useRef(null)
  const saveQueue = useRef(Promise.resolve())
  const activeUserId = useRef(userId)
  useLayoutEffect(() => {
    activeUserId.current = userId
  }, [userId])

  useEffect(() => {
    let active = true
    if (!client) return undefined
    loadCatalog(client).then((nextCatalog) => {
      if (!active) return
      setCatalog(nextCatalog)
      setCatalogStatus('success')
    }).catch((error) => {
      if (!active) return
      console.error('Could not load the Supabase recipe catalog.', error)
      setCatalogError(error.message)
      setCatalogStatus('error')
    })
    return () => { active = false }
  }, [catalogAttempt, client])

  useEffect(() => {
    let active = true
    if (!userId || !client) {
      setState(readState())
      setHydratedOwner(GUEST_OWNER)
      setDataReady(true)
      setDataError('')
      setDataConflict(null)
      setSyncStatus('local')
      setSyncError('')
      syncBaseUpdatedAt.current = null
      return undefined
    }

    setHydratedOwner(null)
    setDataReady(false)
    setDataError('')
    setDataConflict(null)
    setSyncStatus('loading')
    setSyncError('')
    syncBaseUpdatedAt.current = null

    async function hydrateAccount() {
      const cached = readAccountCache(userId)
      let remote
      try {
        remote = await loadAccountData(client, userId)
      } catch (error) {
        if (!active) return
        if (cached) {
          setState(cached.state)
          setHydratedOwner(userId)
          setDataReady(true)
          setSyncStatus('error')
          setSyncError(`${error.message} Showing this account's saved device copy until it reconnects.`)
          return
        }
        setDataError(error.message)
        return
      }

      try {
        let nextState
        let updatedAt = remote?.updated_at || cached?.baseUpdatedAt || null
        const remoteState = remote?.data ? normalizeState(remote.data) : null
        if (cached?.dirty && remote && cached.baseUpdatedAt !== remote.updated_at) {
          syncBaseUpdatedAt.current = remote.updated_at
          setDataConflict({
            localState: cached.state,
            remoteState,
            updatedAt: remote.updated_at,
          })
          setState(cached.state)
          setHydratedOwner(userId)
          setDataReady(true)
          setSyncStatus('conflict')
          return
        }
        if (cached?.dirty) {
          nextState = cached.state
        } else if (remoteState) {
          nextState = remoteState
        } else {
          nextState = cached?.state || readState()
        }
        nextState = withAccountDetails(nextState, { fullName: accountName, email: accountEmail })

        if (!remote || cached?.dirty || JSON.stringify(remoteState) !== JSON.stringify(nextState)) {
          try {
            updatedAt = await saveAccountData(client, userId, nextState)
            if (!remote) {
              try {
                window.localStorage.removeItem(STORAGE_KEY)
              } catch (error) {
                console.error('Could not clear the imported guest data from this device.', error)
              }
            }
          } catch (error) {
            if (!active) return
            const cacheError = writeAccountCache(userId, { state: nextState, dirty: true, baseUpdatedAt: updatedAt })
            setState(nextState)
            setHydratedOwner(userId)
            setDataReady(true)
            setSyncStatus('error')
            setSyncError(cacheError ? `${error.message} ${cacheError}` : error.message)
            return
          }
        }

        if (!active) return
        const cacheError = writeAccountCache(userId, { state: nextState, dirty: false, baseUpdatedAt: updatedAt })
        setState(nextState)
        setHydratedOwner(userId)
        setDataReady(true)
        setSyncStatus('synced')
        setSyncError(cacheError)
        syncBaseUpdatedAt.current = updatedAt
      } catch (error) {
        if (!active) return
        setDataError(error.message)
      }
    }

    hydrateAccount()
    return () => {
      active = false
      window.clearTimeout(saveTimer.current)
    }
  }, [accountEmail, accountName, client, loadAttempt, userId])

  const persistAccountState = useCallback(async (nextState) => {
    if (!userId || !client || hydratedOwner !== userId || !dataReady) return
    const operation = saveQueue.current.catch(() => {}).then(() => saveAccountData(client, userId, nextState))
    saveQueue.current = operation
    setSyncStatus('syncing')
    setSyncError('')
    try {
      const updatedAt = await operation
      if (activeUserId.current !== userId) return
      syncBaseUpdatedAt.current = updatedAt
      const cacheError = writeAccountCache(userId, { state: nextState, dirty: false, baseUpdatedAt: updatedAt })
      setSyncStatus('synced')
      setSyncError(cacheError)
    } catch (error) {
      const cacheError = writeAccountCache(userId, { state: nextState, dirty: true, baseUpdatedAt: syncBaseUpdatedAt.current })
      if (activeUserId.current !== userId) return
      setSyncStatus('error')
      setSyncError(cacheError ? `${error.message} ${cacheError}` : error.message)
      throw error
    }
  }, [client, dataReady, hydratedOwner, userId])

  useEffect(() => {
    if (hydratedOwner !== (userId || GUEST_OWNER)) return undefined
    if (dataConflict) return undefined
    if (!userId) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error('Could not save the local KhaanaKya data.', error)
        setSyncError(`Your changes could not be saved on this device: ${error.message}`)
      }
      return undefined
    }

    const cacheError = writeAccountCache(userId, {
      state,
      dirty: true,
      baseUpdatedAt: syncBaseUpdatedAt.current,
    })
    if (cacheError) setSyncError(cacheError)
    setSyncStatus('syncing')
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      persistAccountState(state).catch(() => {})
    }, 650)
    return () => window.clearTimeout(saveTimer.current)
  }, [dataConflict, hydratedOwner, persistAccountState, state, userId])

  const actions = useMemo(() => ({
    updateProfile: (updates) => setState((current) => ({ ...current, profile: { ...current.profile, ...updates } })),
    updatePreferences: (updates) => setState((current) => ({ ...current, preferences: { ...current.preferences, ...updates } })),
    setIngredients: (ingredients) => setState((current) => ({ ...current, ingredients })),
    setPantryAlwaysAvailable: (value) => setState((current) => ({ ...current, pantryAlwaysAvailable: value })),
    setServings: (servings) => setState((current) => ({ ...current, servings: Math.max(1, Math.min(20, Number(servings) || 1)) })),
    toggleFavorite: (recipeId) => setState((current) => ({
      ...current,
      favorites: current.favorites.includes(recipeId) ? current.favorites.filter((id) => id !== recipeId) : [...current.favorites, recipeId],
    })),
    addShopping: (items) => setState((current) => {
      const next = [...current.shopping]
      for (const item of items) {
        const existing = next.find((entry) => entry.ingredientId === item.ingredientId && entry.recipeId === item.recipeId)
        if (existing) continue
        next.push({ ...item, id: `${item.recipeId}-${item.ingredientId}-${Date.now()}-${next.length}`, purchased: false })
      }
      return { ...current, shopping: next }
    }),
    updateShoppingItem: (id, updates) => setState((current) => ({ ...current, shopping: current.shopping.map((item) => item.id === id ? { ...item, ...updates } : item) })),
    removeShoppingItem: (id) => setState((current) => ({ ...current, shopping: current.shopping.filter((item) => item.id !== id) })),
    addCustomShopping: (name) => setState((current) => ({ ...current, shopping: [...current.shopping, { id: `custom-${Date.now()}`, ingredientId: 'custom', name, quantity: 1, unit: 'item', cost: 0, recipeName: 'Custom item', purchased: false }] })),
    markViewed: (recipeId) => setState((current) => ({ ...current, viewed: [recipeId, ...current.viewed.filter((id) => id !== recipeId)].slice(0, 6) })),
    setRecentRecommendations: (recipeIds) => setState((current) => ({ ...current, recentRecommendations: recipeIds.slice(0, 6) })),
    toggleCompare: (recipeId) => setState((current) => ({
      ...current,
      compared: current.compared.includes(recipeId)
        ? current.compared.filter((id) => id !== recipeId)
        : current.compared.length < 3 ? [...current.compared, recipeId] : current.compared,
    })),
  }), [])

  const value = useMemo(() => ({
    ...state,
    ...actions,
    catalogStatus,
    catalogError,
    catalogRecipes: catalog?.recipes || [],
    recipeById: catalog?.recipeById || {},
    catalogIngredients: catalog?.ingredients || [],
    ingredientById: catalog?.ingredientById || {},
    ingredientAliases: catalog?.ingredientAliases || {},
    retryCatalog: () => {
      setCatalogStatus(client ? 'loading' : 'error')
      setCatalogError(client ? '' : CATALOG_CONNECTION_ERROR)
      setCatalogAttempt((attempt) => attempt + 1)
    },
    dataConflict,
    dataError,
    dataReady,
    retryDataLoad: () => setLoadAttempt((attempt) => attempt + 1),
    retrySync: () => persistAccountState(state),
    saveNow: () => {
      window.clearTimeout(saveTimer.current)
      return persistAccountState(state)
    },
    resolveDataConflict: async (choice) => {
      if (!dataConflict || !userId || !client) return
      const nextState = choice === 'cloud' ? dataConflict.remoteState : dataConflict.localState
      if (choice === 'device') await persistAccountState(nextState)
      else {
        const updatedAt = dataConflict.updatedAt
        syncBaseUpdatedAt.current = updatedAt
        const cacheError = writeAccountCache(userId, { state: nextState, dirty: false, baseUpdatedAt: updatedAt })
        setSyncStatus('synced')
        setSyncError(cacheError)
      }
      setState(nextState)
      setDataConflict(null)
      setDataReady(true)
      setHydratedOwner(userId)
    },
    syncError,
    syncStatus,
  }), [actions, catalog, catalogError, catalogStatus, dataConflict, dataError, dataReady, persistAccountState, state, syncError, syncStatus, userId, client])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
