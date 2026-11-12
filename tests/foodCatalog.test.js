import assert from 'node:assert/strict'
import test from 'node:test'
import { ingredientNutrition, ingredients, recipes } from '../supabase/seed/catalogData.js'

test('seed catalog meets the requested Indian-first catalog size and meal coverage', () => {
  assert.ok(ingredients.length >= 200)
  assert.ok(recipes.length >= 120)
  for (const mealType of ['breakfast', 'lunch', 'dinner', 'snacks', 'sweets']) {
    assert.ok(recipes.filter((recipe) => recipe.mealType === mealType).length >= 20, `expected at least 20 recipes for ${mealType}`)
  }
  for (const region of ['north', 'south', 'east', 'west']) {
    assert.ok(recipes.some((recipe) => recipe.region === region), `expected recipes for ${region} India`)
  }
  assert.ok(recipes.some((recipe) => recipe.cuisine === 'Indo-Chinese'))
  assert.ok(recipes.some((recipe) => recipe.cuisine === 'Continental'))
  assert.ok(recipes.some((recipe) => recipe.cuisine === 'Student quick meals'))
  for (const dietType of ['veg', 'vegan', 'eggetarian', 'non-veg', 'jain-friendly']) {
    assert.ok(recipes.some((recipe) => recipe.dietType === dietType), `expected recipes for ${dietType}`)
  }
})

test('all seeded ingredients have plausible per-100g reference nutrition', () => {
  for (const ingredient of ingredients) {
    const values = ingredientNutrition(ingredient)
    assert.ok(values, `${ingredient.id} should have nutrition`)
    assert.equal(values.length, 7)
    assert.ok(values.every((value) => Number.isFinite(value) && value >= 0), `${ingredient.id} values must be non-negative`)
    assert.ok(values[0] <= 950, `${ingredient.id} energy should be plausible`)
    assert.ok(values[4] <= values[2], `${ingredient.id} fibre must not exceed carbohydrate`)
    assert.ok(values[5] <= values[2], `${ingredient.id} sugar must not exceed carbohydrate`)
    assert.ok(values[6] <= 100000, `${ingredient.id} sodium should be plausible`)
  }
})

test('every recipe points to a seeded ingredient with a nutrition profile', () => {
  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]))
  const seenRecipeNames = new Set()
  for (const recipe of recipes) {
    assert.ok(!seenRecipeNames.has(recipe.name), `${recipe.name} should be unique`)
    seenRecipeNames.add(recipe.name)
    const main = ingredientsById.get(recipe.mainIngredient)
    assert.ok(main, `${recipe.name} references ${recipe.mainIngredient}`)
    assert.ok(ingredientNutrition(main), `${recipe.mainIngredient} needs nutrition`)
  }
})
