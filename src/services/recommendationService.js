import { rankRecipeCatalog } from './recommendationEngine.ts'
import { getRecipeCosts } from '../utils/recipeMath.js'

export async function getRecommendations(input, catalog) {
  if (!catalog?.recipes?.length) throw new Error('Recipe data is not available. Check the Supabase catalog connection and try again.')
  return rankRecipeCatalog(catalog.recipes, input, catalog.ingredientById, catalog.ingredientAliases)
    .map((recipe) => ({
      ...recipe,
      costs: getRecipeCosts(recipe, input.servings, catalog.ingredientById),
    }))
}

export const recommendationGroups = [
  { title: 'Best matches', test: () => true },
  { title: 'Uses almost all your ingredients', test: (item) => item.match >= 70 },
  { title: 'Quick & easy', test: (item) => item.prepTime + item.cookTime <= 25 },
  { title: 'Healthy choices', test: (item) => item.tags.some((tag) => ['Balanced Diet', 'High Fibre', 'Quick'].includes(tag)) },
  { title: 'Budget friendly', test: (item, preferences) => (preferences.budgetScope === 'per person' ? item.costs.perPerson : item.costs.total) <= preferences.budget },
  { title: 'High protein', test: (item) => item.nutrition.protein >= 18 },
]
