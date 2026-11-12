import assert from 'node:assert/strict'
import test from 'node:test'
import { getAvailability, getIngredientCost, getRecipeCosts } from '../src/utils/recipeMath.js'

const ingredientById = {
  basmati_rice: { id: 'basmati_rice', name: 'Basmati rice', price_per_kg_inr: 100, grams_per_ml: 1, grams_per_piece: 1 },
  capsicum: { id: 'capsicum', name: 'Capsicum', price_per_kg_inr: 80, grams_per_piece: 120, grams_per_ml: 1 },
  cooking_oil: { id: 'cooking_oil', name: 'Cooking oil', price_per_kg_inr: 150, grams_per_ml: 0.92, grams_per_piece: 1 },
}

const recipe = {
  id: 'rice-and-capsicum',
  servings: 2,
  ingredients: [
    { ingredientId: 'basmati_rice', quantity: 150, unit: 'g' },
    { ingredientId: 'capsicum', quantity: 1, unit: 'piece' },
    { ingredientId: 'cooking_oil', quantity: 10, unit: 'g', optional: true },
  ],
}

test('serving changes scale recipe quantities and estimated costs', () => {
  const twoServings = getRecipeCosts(recipe, 2, ingredientById)
  const fourServings = getRecipeCosts(recipe, 4, ingredientById)

  assert.equal(fourServings.lineItems[0].quantity, twoServings.lineItems[0].quantity * 2)
  assert.equal(fourServings.total, twoServings.total * 2)
  assert.equal(fourServings.perPerson, twoServings.perPerson)
})

test('piece quantities use the ingredient-specific edible weight', () => {
  assert.equal(getIngredientCost({ ingredientId: 'capsicum' }, 2, 'piece', ingredientById), 19.2)
})

test('availability converts units, accepts legacy ids, and excludes optional items from match', () => {
  const complete = getAvailability(
    recipe,
    [{ id: 'rice', quantity: 500, unit: 'g' }, { id: 'capsicum', quantity: 1, unit: 'piece' }],
    ['oil'],
    ingredientById,
  )
  const incomplete = getAvailability(recipe, [{ id: 'rice', quantity: 100, unit: 'g' }], [], ingredientById)

  assert.equal(complete.match, 100)
  assert.equal(complete.missing.length, 0)
  assert.equal(incomplete.match, 0)
  assert.equal(incomplete.missing.length, 2)
  assert.equal(incomplete.available.length, 1)
})
