import assert from 'node:assert/strict'
import test from 'node:test'
import { ingredients, recipes } from '../supabase/seed/catalogData.js'
import { recipeIngredients, recipeSteps } from '../supabase/seed/seedCatalog.js'

test('every seeded recipe generates valid ingredient quantities and 5–10 preparation steps', () => {
  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]))
  const recipeIds = new Set()
  let recipeIngredientCount = 0
  for (const recipe of recipes) {
    const id = recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    assert.ok(!recipeIds.has(id), `${recipe.name} should have a unique recipe id`)
    recipeIds.add(id)

    const recipeItems = recipeIngredients(recipe)
    recipeIngredientCount += recipeItems.length
    const steps = recipeSteps(recipe, ingredientsById.get(recipe.mainIngredient).name)
    assert.ok(recipeItems.length > 0, `${recipe.name} should have ingredients`)
    assert.ok(recipeItems.every((item) => ingredientsById.has(item.id) && item.quantity > 0), `${recipe.name} ingredient entries should be valid`)
    assert.ok(steps.length >= 5 && steps.length <= 10, `${recipe.name} should have 5–10 steps`)
    assert.ok(steps.every((step) => typeof step === 'string' && step.trim()), `${recipe.name} steps should be non-empty`)
  }
  assert.ok(recipeIngredientCount < 1000, 'recipe ingredient links should fit within Supabase REST default row limits')
})
