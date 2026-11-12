import { legacyIngredientAliases } from '../services/catalogService.js'

function gramsFor(quantity, unit, ingredient = {}) {
  if (unit === 'g') return quantity
  if (unit === 'kg') return quantity * 1000
  if (unit === 'ml') return quantity * (ingredient.grams_per_ml || 1)
  if (unit === 'litre' || unit === 'l') return quantity * 1000 * (ingredient.grams_per_ml || 1)
  if (unit === 'piece') return quantity * (ingredient.grams_per_piece || 1)
  if (unit === 'cup') return quantity * 200
  return 0
}

export function getIngredientCost(item, quantity, unit = item.unit || 'g', ingredientById = {}) {
  const ingredient = ingredientById[item.ingredientId || item.id]
  if (!ingredient) return 0
  const pricePerKg = item.price ?? ingredient.price_per_kg_inr ?? ingredient.price
  return pricePerKg * gramsFor(quantity, unit, ingredient) / 1000
}

export function getRecipeCosts(recipe, servings, ingredientById = {}) {
  const multiplier = servings / recipe.servings
  const lineItems = recipe.ingredients.map((item) => {
    const quantity = item.quantity * multiplier
    const ingredient = ingredientById[item.ingredientId]
    return {
      ...item,
      quantity,
      name: ingredient?.name ?? item.ingredientId,
      cost: getIngredientCost(item, quantity, item.unit, ingredientById),
    }
  })
  const total = lineItems.reduce((sum, item) => sum + item.cost, 0)
  return {
    lineItems,
    total: Math.round(total),
    perPerson: servings > 0 ? Math.round(total / servings) : 0,
  }
}

export function getAvailability(recipe, selectedIngredients, pantryIds = [], ingredientById = {}) {
  const selected = new Map(selectedIngredients.map((entry) => {
    const item = typeof entry === 'string' ? { id: entry } : entry
    const id = item.id || item.ingredientId
    return [legacyIngredientAliases[id] || id, item]
  }))
  const pantry = new Set(pantryIds.map((id) => legacyIngredientAliases[id] || id))
  const required = recipe.ingredients.filter((item) => !item.optional)
  const available = required.filter((item) => {
    if (pantry.has(item.ingredientId)) return true
    const entry = selected.get(item.ingredientId)
    if (!entry || entry.quantity == null || !entry.unit) return false
    const ingredient = ingredientById[item.ingredientId]
    return gramsFor(Number(entry.quantity), entry.unit, ingredient)
      >= gramsFor(item.quantity, item.unit, ingredient)
  })
  const availableIds = new Set(available.map((item) => item.ingredientId))
  return {
    available: [...available, ...recipe.ingredients.filter((item) => item.optional)],
    missing: required.filter((item) => !availableIds.has(item.ingredientId)),
    match: required.length ? Math.round((available.length / required.length) * 100) : 0,
  }
}
