import assert from 'node:assert/strict'
import test from 'node:test'
import { recipes, recipeById } from '../src/data/recipes.js'
import { ingredientById } from '../src/data/ingredients.js'
import { getAvailability, getIngredientCost, getRecipeCosts } from '../src/utils/recipeMath.js'

test('sample library contains 30 complete recipes with known priced ingredients', () => {
  assert.equal(recipes.length, 30)
  for (const recipe of recipes) {
    assert.ok(recipe.name)
    assert.ok(recipe.ingredients.length > 0)
    assert.ok(recipe.nutrition.calories > 0)
    assert.ok(recipe.ingredients.every((item) => ingredientById[item.ingredientId]))
    assert.ok(getRecipeCosts(recipe, 2).total > 0)
  }
})

test('serving changes scale quantities and costs', () => {
  const recipe = recipeById['1']
  const twoServings = getRecipeCosts(recipe, 2)
  const fourServings = getRecipeCosts(recipe, 4)

  assert.equal(fourServings.lineItems[0].quantity, twoServings.lineItems[0].quantity * 2)
  assert.equal(fourServings.total, twoServings.total * 2)
  assert.equal(fourServings.perPerson, twoServings.perPerson)
})

test('piece quantities use the estimated per-kilogram price', () => {
  assert.equal(getIngredientCost({ ingredientId: 'capsicum' }, 2, 'piece'), 21)
})

test('ingredient match includes pantry basics and checks selected quantities', () => {
  const recipe = recipeById['1']
  const match = getAvailability(recipe, [{ id: 'rice', quantity: 500, unit: 'g' }], ['oil', 'spices'])
  const insufficient = getAvailability(recipe, [{ id: 'rice', quantity: 100, unit: 'g' }], ['oil', 'spices'])

  assert.equal(match.match, 43)
  assert.equal(match.available.length, 3)
  assert.ok(insufficient.missing.some((item) => item.ingredientId === 'rice'))
})
