export interface SelectedIngredient {
  id: string
  quantity?: number
  unit?: string
}

export interface CatalogIngredient {
  id: string
  name: string
  allergens: string[]
  grams_per_piece?: number
  grams_per_ml?: number
  price_per_kg_inr?: number
}

export interface RecipeIngredient {
  ingredientId: string
  quantity: number
  unit: string
  optional?: boolean
}

export interface RecipeNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre: number
  sugar: number
  sodium: number
}

export interface CatalogRecipe {
  id: string
  name: string
  cuisine: string
  category: string
  foodType: string
  prepTime: number
  cookTime: number
  servings: number
  estimatedCost: number
  ingredients: RecipeIngredient[]
  nutrition: RecipeNutrition
  tags: string[]
  [key: string]: unknown
}

export interface RecommendationInput {
  ingredients: SelectedIngredient[]
  pantryAlwaysAvailable: boolean
  servings: number
  preferences: {
    foodType?: string
    cuisines?: string[]
    healthGoals?: string[]
    allergies?: string[]
    budget?: number
    budgetScope?: string
    maxTime?: number
  }
}

export interface RankedRecipe extends CatalogRecipe {
  available: RecipeIngredient[]
  missing: RecipeIngredient[]
  match: number
  rankingScore: number
  underBudget: boolean
  missingCount: number
  reason: string
}

const allergyAliases: Record<string, string> = {
  eggs: 'egg',
  'tree nuts': 'nuts',
  'ground nuts': 'peanuts',
  peanut: 'peanuts',
}

const toGrams = (quantity: number, unit: string, ingredient?: CatalogIngredient): number => {
  if (unit === 'g') return quantity
  if (unit === 'kg') return quantity * 1000
  if (unit === 'ml') return quantity * (ingredient?.grams_per_ml || 1)
  if (unit === 'l') return quantity * 1000 * (ingredient?.grams_per_ml || 1)
  if (unit === 'piece') return quantity * (ingredient?.grams_per_piece || 1)
  if (unit === 'cup') return quantity * 200
  return 0
}

const matchesFoodType = (recipeType: string, preference?: string): boolean => {
  if (!preference || preference === 'No preference') return true
  if (preference === 'Vegetarian') return ['vegetarian', 'vegan', 'jain-friendly'].includes(recipeType)
  if (preference === 'Vegan') return recipeType === 'vegan'
  if (preference === 'Non-Vegetarian') return recipeType === 'non-vegetarian'
  if (preference === 'Pescatarian') return ['pescatarian', 'vegetarian', 'vegan', 'jain-friendly'].includes(recipeType)
  if (preference === 'Eggetarian') return ['eggetarian', 'vegetarian', 'vegan', 'jain-friendly'].includes(recipeType)
  return true
}

const matchesHealthGoal = (recipe: CatalogRecipe, goal: string): boolean => {
  if (goal === 'High Protein') return recipe.nutrition.protein >= 18
  if (goal === 'Muscle Building') return recipe.nutrition.protein >= 20
  if (goal === 'Low Calorie') return recipe.nutrition.calories <= 300
  if (goal === 'Weight Management') return recipe.nutrition.calories <= 350
  if (goal === 'Low Carb') return recipe.nutrition.carbs <= 30
  if (goal === 'Low Sugar') return recipe.nutrition.sugar <= 10
  if (goal === 'High Fibre') return recipe.nutrition.fibre >= 5
  if (goal === 'Balanced Diet') return recipe.nutrition.fibre >= 5 && recipe.nutrition.protein >= 8
  return true
}

function rankOne(
  recipe: CatalogRecipe,
  input: RecommendationInput,
  ingredientById: Record<string, CatalogIngredient>,
  aliases: Record<string, string>,
  pantryIds: string[],
): RankedRecipe | null {
  const excluded = new Set((input.preferences.allergies || []).map((allergy) => {
    const key = allergy.trim().toLowerCase().replaceAll('_', ' ')
    return allergyAliases[key] || key
  }))
  const recipeIngredients = recipe.ingredients.filter((item) => !item.optional)
  const hasExcludedIngredient = recipeIngredients.some((item) => {
    const ingredient = ingredientById[item.ingredientId]
    if (!ingredient) return false
    const idOrName = `${ingredient.id} ${ingredient.name}`.toLowerCase().replaceAll('-', ' ')
    return ingredient.allergens.some((allergen) => excluded.has(allergen))
      || [...excluded].some((allergen) => idOrName.includes(allergen))
  })
  if (hasExcludedIngredient || !matchesFoodType(recipe.foodType, input.preferences.foodType)) return null

  const goals = input.preferences.healthGoals || []
  if (goals.includes('Gluten Free') && recipeIngredients.some((item) => ingredientById[item.ingredientId]?.allergens.includes('gluten'))) return null
  if (goals.includes('Dairy Free') && recipeIngredients.some((item) => ingredientById[item.ingredientId]?.allergens.includes('dairy'))) return null

  const selected = new Map(input.ingredients.map((item) => [aliases[item.id] || item.id, item]))
  const pantry = new Set(pantryIds)
  const available = recipeIngredients.filter((item) => {
    if (pantry.has(item.ingredientId)) return true
    const entry = selected.get(item.ingredientId)
    if (!entry || entry.quantity == null || !entry.unit) return false
    const ingredient = ingredientById[item.ingredientId]
    return toGrams(entry.quantity, entry.unit, ingredient) >= toGrams(item.quantity, item.unit, ingredient)
  })
  const availableIds = new Set(available.map((item) => item.ingredientId))
  const missing = recipeIngredients.filter((item) => !availableIds.has(item.ingredientId))
  const match = recipeIngredients.length ? Math.round((available.length / recipeIngredients.length) * 100) : 0
  const budget = Number(input.preferences.budget || 0)
  const comparedCost = recipe.estimatedCost * (input.preferences.budgetScope === 'per person' ? 1 : input.servings)
  const underBudget = budget > 0 && comparedCost <= budget
  const cuisines = input.preferences.cuisines || []
  const cuisineMatches = cuisines.length === 0 || cuisines.includes(recipe.cuisine)
  const goalMatches = goals.length === 0 || goals.some((goal) => matchesHealthGoal(recipe, goal))
  const timeMatches = !input.preferences.maxTime || recipe.prepTime + recipe.cookTime <= input.preferences.maxTime
  const rankingScore = Math.round(Math.max(0, Math.min(100,
    match * 0.62
    + (cuisineMatches ? 10 : 0)
    + (goalMatches ? 14 : 0)
    + (underBudget ? 10 : 0)
    + (timeMatches ? 4 : 0),
  )))
  const reasons: string[] = []
  if (match >= 75) reasons.push('uses most of your available ingredients')
  if (cuisineMatches && cuisines.length) reasons.push(`fits your ${recipe.cuisine} cuisine preference`)
  if (goalMatches && goals.length) reasons.push('supports a goal you selected')
  if (underBudget) reasons.push('fits your estimated budget')

  return {
    ...recipe,
    available,
    missing,
    match,
    rankingScore,
    underBudget,
    missingCount: missing.length,
    reason: reasons.length ? `Recommended because it ${reasons.join(', ')}.` : 'A practical recipe option based on your current kitchen selection.',
  }
}

export function rankRecipeCatalog(
  recipes: CatalogRecipe[],
  input: RecommendationInput,
  ingredientById: Record<string, CatalogIngredient>,
  aliases: Record<string, string> = {},
): RankedRecipe[] {
  const pantryIds = input.pantryAlwaysAvailable ? ['cooking_oil', 'salt', 'garam_masala'] : []
  return recipes
    .map((recipe) => rankOne(recipe, input, ingredientById, aliases, pantryIds))
    .filter((recipe): recipe is RankedRecipe => recipe !== null)
    .sort((a, b) => b.rankingScore - a.rankingScore || b.match - a.match || a.estimatedCost - b.estimatedCost)
}
