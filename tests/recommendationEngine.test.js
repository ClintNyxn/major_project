import assert from 'node:assert/strict'
import test from 'node:test'
import { rankRecipeCatalog } from '../src/services/recommendationEngine.ts'

const ingredientById = {
  basmati_rice: { id: 'basmati_rice', name: 'Basmati rice', allergens: [], grams_per_piece: 1 },
  peanuts: { id: 'peanuts', name: 'Peanuts', allergens: ['peanuts'], grams_per_piece: 1 },
  fish: { id: 'fish', name: 'Rohu fish', allergens: ['fish'], grams_per_piece: 1 },
  onion: { id: 'onion', name: 'Onion', allergens: [], grams_per_piece: 100 },
}

const recipes = [
  {
    id: 'rice-bowl',
    name: 'Rice bowl',
    cuisine: 'South Indian',
    category: 'Lunch',
    foodType: 'vegetarian',
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    estimatedCost: 45,
    ingredients: [{ ingredientId: 'basmati_rice', quantity: 150, unit: 'g' }, { ingredientId: 'onion', quantity: 1, unit: 'piece' }],
    nutrition: { calories: 300, protein: 8, carbs: 55, fat: 6, fibre: 5, sugar: 2, sodium: 300 },
    tags: [],
  },
  {
    id: 'peanut-rice',
    name: 'Peanut rice',
    cuisine: 'South Indian',
    category: 'Lunch',
    foodType: 'vegan',
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    estimatedCost: 35,
    ingredients: [{ ingredientId: 'basmati_rice', quantity: 150, unit: 'g' }, { ingredientId: 'peanuts', quantity: 10, unit: 'g' }],
    nutrition: { calories: 320, protein: 12, carbs: 52, fat: 9, fibre: 6, sugar: 2, sodium: 350 },
    tags: [],
  },
  {
    id: 'fish-curry',
    name: 'Fish curry',
    cuisine: 'Kerala',
    category: 'Dinner',
    foodType: 'pescatarian',
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    estimatedCost: 130,
    ingredients: [{ ingredientId: 'fish', quantity: 200, unit: 'g' }],
    nutrition: { calories: 350, protein: 28, carbs: 12, fat: 18, fibre: 2, sugar: 3, sodium: 400 },
    tags: [],
  },
]

const input = {
  ingredients: [{ id: 'rice', quantity: 500, unit: 'g' }, { id: 'onion', quantity: 200, unit: 'g' }],
  pantryAlwaysAvailable: false,
  servings: 2,
  preferences: {
    foodType: 'Vegetarian',
    cuisines: ['South Indian'],
    healthGoals: ['High Protein'],
    allergies: ['Peanuts'],
    budget: 100,
    budgetScope: 'per person',
    maxTime: 30,
  },
}

test('ranking is deterministic, explainable, and filters diet and allergens', () => {
  const first = rankRecipeCatalog(recipes, input, ingredientById, { rice: 'basmati_rice' })
  const second = rankRecipeCatalog(recipes, input, ingredientById, { rice: 'basmati_rice' })

  assert.deepEqual(first, second)
  assert.deepEqual(first.map((recipe) => recipe.id), ['rice-bowl'])
  assert.equal(first[0].match, 100)
  assert.match(first[0].reason, /ingredients|goal|budget/)
})

test('pescatarian preferences include seafood while quantity matching remains strict', () => {
  const results = rankRecipeCatalog(
    recipes,
    { ...input, ingredients: [], preferences: { ...input.preferences, foodType: 'Pescatarian', allergies: [], healthGoals: [] } },
    ingredientById,
  )

  assert.deepEqual(results.map((recipe) => recipe.id), ['peanut-rice', 'rice-bowl', 'fish-curry'])
  assert.equal(results[0].match, 0)
})
