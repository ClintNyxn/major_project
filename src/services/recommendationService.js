import axios from 'axios'
import { recipes, recipeById } from '../data/recipes.js'
import { pantryIngredientIds, ingredientById, ingredients } from '../data/ingredients.js'
import { getAvailability, getRecipeCosts } from '../utils/recipeMath.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
})

const allergenByIngredient = {
  milk: ['Dairy'], paneer: ['Dairy'], curd: ['Dairy'], cheese: ['Dairy'], butter: ['Dairy'],
  'wheat-flour': ['Gluten'], bread: ['Gluten'], pasta: ['Gluten'],
  eggs: ['Eggs'], fish: ['Fish'], tofu: ['Soy'], 'soy-chunks': ['Soy'], peanuts: ['Peanuts'],
}

const foodTypeMatches = (recipeType, preference) => {
  if (!preference || preference === 'No preference') return true
  if (preference === 'Vegetarian') return ['vegetarian', 'vegan'].includes(recipeType)
  if (preference === 'Vegan') return recipeType === 'vegan'
  if (preference === 'Non-Vegetarian') return recipeType === 'non-vegetarian'
  if (preference === 'Pescatarian') return ['pescatarian', 'vegetarian', 'vegan'].includes(recipeType)
  if (preference === 'Eggetarian') return ['eggetarian', 'vegetarian', 'vegan'].includes(recipeType)
  return true
}

function isExcluded(recipe, allergies) {
  const excluded = new Set(allergies.map((allergy) => allergy.toLowerCase()))
  const recipeAllergens = recipe.allergens.map((allergen) => allergen.toLowerCase())
  for (const item of recipe.ingredients) {
    recipeAllergens.push(...(allergenByIngredient[item.ingredientId] || []).map((allergen) => allergen.toLowerCase()))
  }
  if (recipe.ingredients.some((item) => item.ingredientId === 'tree-nuts')) recipeAllergens.push('tree nuts')
  const ingredientNames = recipe.ingredients.map((item) => item.ingredientId.replaceAll('-', ' ').toLowerCase())
  if (ingredientNames.some((name) => excluded.has(name))) return true
  return recipeAllergens.some((allergen) => excluded.has(allergen))
}

function hasIngredientAllergen(recipe, allergen) {
  const normalized = allergen.toLowerCase()
  return recipe.allergens.some((item) => item.toLowerCase() === normalized)
    || recipe.ingredients.some((item) => (allergenByIngredient[item.ingredientId] || []).some((value) => value.toLowerCase() === normalized))
}

function matchesHealthGoal(recipe, goal) {
  if (goal === 'High Protein' || goal === 'Muscle Building') return recipe.nutrition.protein >= (goal === 'High Protein' ? 18 : 20)
  if (goal === 'Low Calorie' || goal === 'Weight Management') return recipe.nutrition.calories <= (goal === 'Low Calorie' ? 300 : 350)
  if (goal === 'Low Carb') return recipe.nutrition.carbs <= 30
  if (goal === 'Low Sugar') return !recipe.ingredients.some((item) => item.ingredientId === 'sugar')
  if (goal === 'Balanced Diet') return recipe.tags.includes(goal) || (recipe.nutrition.fibre >= 5 && recipe.nutrition.protein >= 8)
  if (goal === 'Gluten Free') return !hasIngredientAllergen(recipe, 'Gluten')
  if (goal === 'Dairy Free') return !hasIngredientAllergen(recipe, 'Dairy')
  return recipe.tags.includes(goal)
}

function rankRecipes(input) {
  const pantry = input.pantryAlwaysAvailable ? pantryIngredientIds : []
  return recipes
    .filter((item) => !isExcluded(item, input.preferences.allergies || []))
    .filter((item) => foodTypeMatches(item.foodType, input.preferences.foodType))
    .filter((item) => !(input.preferences.healthGoals || []).includes('Gluten Free') || !hasIngredientAllergen(item, 'Gluten'))
    .filter((item) => !(input.preferences.healthGoals || []).includes('Dairy Free') || !hasIngredientAllergen(item, 'Dairy'))
    .map((item) => {
      const availability = getAvailability(item, input.ingredients, pantry)
      const costs = getRecipeCosts(item, input.servings)
      const budgetCap = Number(input.preferences.budget || 0)
      const comparedCost = input.preferences.budgetScope === 'per person' ? costs.perPerson : costs.total
      const underBudget = budgetCap > 0 && comparedCost <= budgetCap
      const cuisineMatches = !input.preferences.cuisines?.length || input.preferences.cuisines.includes(item.cuisine)
      const goalMatches = !input.preferences.healthGoals?.length || input.preferences.healthGoals.some((goal) => matchesHealthGoal(item, goal))
      const timeMatches = !input.preferences.maxTime || item.prepTime + item.cookTime <= input.preferences.maxTime
      const score = Math.max(0, Math.min(100,
        availability.match * 0.62
        + (cuisineMatches ? 10 : 0)
        + (goalMatches ? 14 : 0)
        + (underBudget ? 10 : 0)
        + (timeMatches ? 4 : 0),
      ))
      const reasons = []
      if (availability.match >= 75) reasons.push('uses most of your available ingredients')
      if (cuisineMatches && input.preferences.cuisines?.length) reasons.push(`fits your ${item.cuisine} cuisine preference`)
      if (goalMatches && input.preferences.healthGoals?.length) reasons.push('supports a goal you selected')
      if (underBudget) reasons.push('fits your estimated budget')
      const rankingScore = Math.round(score)
      return {
        ...item,
        ...availability,
        match: availability.match,
        rankingScore,
        costs,
        underBudget,
        missingCount: availability.missing.length,
        reason: reasons.length ? `Recommended because it ${reasons.join(', ')}.` : 'A practical recipe option based on your current kitchen selection.',
      }
    })
    .sort((a, b) => b.rankingScore - a.rankingScore || b.match - a.match || a.costs.total - b.costs.total)
}

function normalizeApiRecommendations(data, input) {
  const rows = Array.isArray(data) ? data : data.recommendations
  if (!Array.isArray(rows)) throw new Error('The recommendations API returned an unexpected response.')
  const namesToIds = new Map(ingredients.map((item) => [item.name.toLowerCase(), item.id]))
  const pantry = input.pantryAlwaysAvailable ? pantryIngredientIds : []
  return rows.map((row) => {
    const recipe = recipeById[String(row.recipe_id)]
    if (!recipe) throw new Error(`The recommendations API returned unknown recipe ID ${row.recipe_id}.`)
    const reported = row.available_ingredients
    const selected = Array.isArray(reported) ? reported.map((item) => {
      if (typeof item !== 'string') return item
      return { id: ingredientById[item.toLowerCase()]?.id || namesToIds.get(item.toLowerCase()) || item }
    }) : input.ingredients
    const availability = getAvailability(recipe, selected, pantry)
    const baseCosts = getRecipeCosts(recipe, input.servings)
    const total = Number(row.estimated_cost ?? baseCosts.total)
    const costs = { ...baseCosts, total: Math.round(total), perPerson: Number(row.cost_per_person ?? total / input.servings) }
    const budgetCap = Number(input.preferences.budget || 0)
    const comparedCost = input.preferences.budgetScope === 'per person' ? costs.perPerson : costs.total
    const nutrition = row.nutrition ? {
      calories: Number(row.nutrition.calories ?? recipe.nutrition.calories),
      protein: Number(row.nutrition.protein ?? recipe.nutrition.protein),
      carbs: Number(row.nutrition.carbs ?? recipe.nutrition.carbs),
      fat: Number(row.nutrition.fat ?? recipe.nutrition.fat),
      fibre: Number(row.nutrition.fibre ?? recipe.nutrition.fibre),
    } : recipe.nutrition
    const match = Number(row.ingredient_match ?? availability.match)
    return {
      ...recipe,
      ...availability,
      match: Math.round(match),
      rankingScore: Math.round(match),
      costs,
      underBudget: budgetCap > 0 && comparedCost <= budgetCap,
      nutrition,
      prepTime: Number(row.prep_time ?? recipe.prepTime + recipe.cookTime),
      reason: row.reason || 'Recommended by your configured recipe service.',
    }
  }).filter((recipe) =>
    !isExcluded(recipe, input.preferences.allergies || [])
    && foodTypeMatches(recipe.foodType, input.preferences.foodType)
    && (!(input.preferences.healthGoals || []).includes('Gluten Free') || !hasIngredientAllergen(recipe, 'Gluten'))
    && (!(input.preferences.healthGoals || []).includes('Dairy Free') || !hasIngredientAllergen(recipe, 'Dairy')),
  )
}

export async function getRecommendations(input) {
  const payload = {
    user_id: input.profile.email || 'prototype-user',
    available_ingredients: input.ingredients,
    ingredient_quantities: input.ingredients,
    dietary_preferences: input.preferences.foodType,
    cuisines: input.preferences.cuisines,
    allergies: input.preferences.allergies,
    health_goals: input.preferences.healthGoals,
    budget: input.preferences.budget,
    budget_scope: input.preferences.budgetScope,
    people: input.servings,
    maximum_preparation_time: input.preferences.maxTime,
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    const { data } = await api.post('/recommendations', payload)
    return normalizeApiRecommendations(data, input)
  }
  await new Promise((resolve) => window.setTimeout(resolve, 900))
  return rankRecipes(input)
}

export const recommendationGroups = [
  { title: 'Best matches', test: () => true },
  { title: 'Uses almost all your ingredients', test: (item) => item.match >= 70 },
  { title: 'Quick & easy', test: (item) => item.prepTime + item.cookTime <= 25 },
  { title: 'Healthy choices', test: (item) => item.tags.some((tag) => ['Low Calorie', 'Balanced Diet', 'High Fibre'].includes(tag)) },
  { title: 'Budget friendly', test: (item, preferences) => (preferences.budgetScope === 'per person' ? item.costs.perPerson : item.costs.total) <= preferences.budget },
  { title: 'High protein', test: (item) => item.nutrition.protein >= 18 },
]
