import { ingredientById } from '../data/ingredients.js'

export function getIngredientCost(item, quantity, unit = item.unit || 'g') {
  const ingredient = ingredientById[item.ingredientId || item.id]
  if (!ingredient) return 0
  const price = item.price ?? ingredient.price
  const priceUnit = ingredient.priceUnit
  if (priceUnit === 'piece' || priceUnit === 'loaf') return price * quantity
  if (unit === 'piece' && priceUnit === 'kg') return price * quantity * 150 / 1000
  if (unit === 'piece' && priceUnit === 'litre') return price * quantity * 240 / 1000
  if ((unit === 'ml' || unit === 'litre') && priceUnit === 'litre') return price * quantity / (unit === 'ml' ? 1000 : 1)
  if (unit === 'g' || unit === 'kg') return price * quantity / (unit === 'g' ? 1000 : 1)
  return price * quantity / 1000
}

export function getRecipeCosts(recipe, servings) {
  const multiplier = servings / recipe.servings
  const lineItems = recipe.ingredients.map((item) => {
    const quantity = item.quantity * multiplier
    const ingredient = ingredientById[item.ingredientId]
    return {
      ...item,
      quantity,
      name: ingredient?.name ?? item.ingredientId,
      cost: getIngredientCost(item, quantity, item.unit),
    }
  })
  const total = lineItems.reduce((sum, item) => sum + item.cost, 0)
  return {
    lineItems,
    total: Math.round(total),
    perPerson: servings > 0 ? Math.round(total / servings) : 0,
  }
}

function quantityInRecipeUnit(entry, recipeItem, ingredient) {
  if (entry.quantity == null || !entry.unit) return Number.POSITIVE_INFINITY
  const quantity = Number(entry.quantity)
  if (entry.unit === recipeItem.unit) return quantity
  if (entry.unit === 'kg' && recipeItem.unit === 'g') return quantity * 1000
  if (entry.unit === 'g' && recipeItem.unit === 'kg') return quantity / 1000
  if (entry.unit === 'litre' && recipeItem.unit === 'ml') return quantity * 1000
  if (entry.unit === 'ml' && recipeItem.unit === 'litre') return quantity / 1000
  if (entry.unit === 'cup') return quantity * (recipeItem.unit === 'ml' ? 240 : 200)
  if (entry.unit === 'piece' && recipeItem.unit === 'g' && ingredient?.priceUnit === 'kg') return quantity * 150
  if (entry.unit === 'piece' && recipeItem.unit === 'ml' && ingredient?.priceUnit === 'litre') return quantity * 240
  if (entry.unit === 'ml' && recipeItem.unit === 'g') return quantity
  if (entry.unit === 'g' && recipeItem.unit === 'ml') return quantity
  return 0
}

export function getAvailability(recipe, selectedIngredients, pantryIds = []) {
  const selected = new Map(selectedIngredients.map((entry) => {
    const item = typeof entry === 'string' ? { id: entry } : entry
    return [item.id || item.ingredientId, item]
  }))
  const pantry = new Set(pantryIds)
  const available = recipe.ingredients.filter((item) => {
    if (pantry.has(item.ingredientId)) return true
    const entry = selected.get(item.ingredientId)
    if (!entry) return false
    return quantityInRecipeUnit(entry, item, ingredientById[item.ingredientId]) >= item.quantity
  })
  const availableItemIds = new Set(available.map((item) => item.ingredientId))
  const missing = recipe.ingredients.filter((item) => !availableItemIds.has(item.ingredientId))
  return {
    available,
    missing,
    match: recipe.ingredients.length ? Math.round((available.length / recipe.ingredients.length) * 100) : 0,
  }
}
