import { useEffect, useMemo, useState } from 'react'
import { AppContext } from './appContext.js'

const STORAGE_KEY = 'khaanakya-prototype-v1'

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

function readState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? { ...initialState, ...JSON.parse(saved) } : initialState
  } catch (error) {
    console.error('Could not restore the saved KhaanaKya prototype data.', error)
    return initialState
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(readState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Could not save KhaanaKya prototype data.', error)
    }
  }, [state])

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

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
