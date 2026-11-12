const allergenFields = ['gluten', 'dairy', 'nuts', 'peanuts', 'soy', 'egg', 'fish', 'shellfish', 'sesame']

export const legacyIngredientAliases = {
  rice: 'basmati_rice',
  onion: 'red_onion',
  'wheat-flour': 'whole_wheat_flour',
  dal: 'toor_dal',
  'kidney-beans': 'kidney_beans',
  'green-gram': 'green_moong',
  lentils: 'masoor_dal',
  'soy-chunks': 'soy_chunks',
  'coconut-milk': 'coconut_milk',
  oats: 'rolled_oats',
  spices: 'garam_masala',
  oil: 'cooking_oil',
  lemon: 'lemon_juice',
  cumin: 'cumin_seeds',
  coriander: 'coriander_leaves',
  coconut: 'fresh_coconut',
}

function assertQuery(result, label) {
  if (result.error) throw new Error(`Could not load ${label}: ${result.error.message}`)
  return result.data || []
}

function indexRows(rows, key) {
  return new Map(rows.map((row) => [row[key], row]))
}

export async function loadCatalog(client) {
  const [recipeResult, ingredientResult, nutrientResult, regionResult, cuisineResult, recipeIngredientResult, stepResult, tagResult, recipeTagResult, recipeNutritionResult] = await Promise.all([
    client.from('recipes').select('*').order('name'),
    client.from('ingredients').select('*').order('name'),
    client.from('nutrition_per_ingredient').select('*'),
    client.from('regions').select('*'),
    client.from('cuisines').select('*'),
    client.from('recipe_ingredients').select('*'),
    client.from('recipe_steps').select('*').order('step_number'),
    client.from('tags').select('*'),
    client.from('recipe_tags').select('*'),
    client.from('recipe_nutrition').select('*'),
  ])
  const recipeRows = assertQuery(recipeResult, 'recipes')
  const ingredientRows = assertQuery(ingredientResult, 'ingredients')
  const nutritionRows = assertQuery(nutrientResult, 'ingredient nutrition')
  const regionRows = assertQuery(regionResult, 'regions')
  const cuisineRows = assertQuery(cuisineResult, 'cuisines')
  const recipeIngredientRows = assertQuery(recipeIngredientResult, 'recipe ingredients')
  const stepRows = assertQuery(stepResult, 'recipe steps')
  const tagRows = assertQuery(tagResult, 'recipe tags')
  const recipeTagRows = assertQuery(recipeTagResult, 'recipe tag links')
  const recipeNutritionRows = assertQuery(recipeNutritionResult, 'computed recipe nutrition')

  if (!recipeRows.length) throw new Error('The Supabase catalog is empty. Run the local database setup and seed command.')
  const nutritionByIngredient = indexRows(nutritionRows, 'ingredient_id')
  const nutritionByRecipe = indexRows(recipeNutritionRows, 'recipe_id')
  const regions = indexRows(regionRows, 'id')
  const cuisines = indexRows(cuisineRows, 'id')
  const tags = indexRows(tagRows, 'id')
  const ingredients = ingredientRows.map((row) => {
    const nutrition = nutritionByIngredient.get(row.id)
    if (!nutrition) throw new Error(`Ingredient "${row.name}" has no nutrition reference row.`)
    return {
      ...row,
      price: Number(row.price_per_kg_inr),
      priceUnit: 'kg',
      allergens: allergenFields.filter((field) => row[field]),
      nutrition: {
        calories: Number(nutrition.kcal_per_100g),
        protein: Number(nutrition.protein_g_per_100g),
        carbs: Number(nutrition.carbs_g_per_100g),
        fat: Number(nutrition.fat_g_per_100g),
        fibre: Number(nutrition.fiber_g_per_100g),
        sugar: Number(nutrition.sugar_g_per_100g),
        sodium: Number(nutrition.sodium_mg_per_100g),
      },
    }
  })
  const ingredientById = Object.fromEntries(ingredients.map((item) => [item.id, item]))
  for (const [legacyId, currentId] of Object.entries(legacyIngredientAliases)) {
    if (ingredientById[currentId]) ingredientById[legacyId] = { ...ingredientById[currentId], id: legacyId }
  }

  const ingredientsByRecipe = new Map()
  for (const row of recipeIngredientRows) {
    const list = ingredientsByRecipe.get(row.recipe_id) || []
    list.push({
      ingredientId: row.ingredient_id,
      quantity: Number(row.quantity),
      unit: row.unit,
      optional: row.is_optional,
    })
    ingredientsByRecipe.set(row.recipe_id, list)
  }
  const stepsByRecipe = new Map()
  for (const row of stepRows) {
    const list = stepsByRecipe.get(row.recipe_id) || []
    list.push(row.instruction)
    stepsByRecipe.set(row.recipe_id, list)
  }
  const tagsByRecipe = new Map()
  for (const row of recipeTagRows) {
    const list = tagsByRecipe.get(row.recipe_id) || []
    const tag = tags.get(row.tag_id)
    if (tag) list.push(tag.name)
    tagsByRecipe.set(row.recipe_id, list)
  }

  const dietLabels = {
    veg: 'vegetarian',
    vegan: 'vegan',
    eggetarian: 'eggetarian',
    'non-veg': 'non-vegetarian',
    'jain-friendly': 'jain-friendly',
  }
  const seafoodIds = new Set(['fish', 'salmon', 'prawns', 'crab', 'anchovy', 'white_fish', 'sardines', 'tuna', 'lobster', 'oyster', 'tilapia', 'whitefish', 'scallops', 'shrimp', 'shrimp_small'])
  const landMeatIds = new Set(['chicken', 'chicken_thigh', 'chicken_breast', 'chicken_minced', 'chicken_leg', 'mutton', 'goat_meat', 'duck'])
  const recipes = recipeRows.map((row) => {
    const nutrition = nutritionByRecipe.get(row.id)
    if (!nutrition) throw new Error(`Recipe "${row.name}" has no computed nutrition. Check its ingredient nutrition rows.`)
    const cuisine = cuisines.get(row.cuisine_id)
    if (!cuisine) throw new Error(`Recipe "${row.name}" has no cuisine record.`)
    const region = regions.get(cuisine.region_id)
    const recipeIngredients = ingredientsByRecipe.get(row.id) || []
    const pescatarian = recipeIngredients.some((item) => seafoodIds.has(item.ingredientId))
      && !recipeIngredients.some((item) => landMeatIds.has(item.ingredientId))
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.meal_type[0].toUpperCase() + row.meal_type.slice(1),
      cuisine: cuisine.name,
      region: region?.name || '',
      prepTime: row.prep_minutes,
      cookTime: row.cook_minutes,
      difficulty: row.difficulty,
      servings: row.servings,
      dietType: row.diet_type,
      foodType: row.diet_type === 'non-veg' && pescatarian ? 'pescatarian' : dietLabels[row.diet_type],
      spiceLevel: row.spice_level,
      estimatedCost: Number(row.cost_per_serving_inr),
      image: row.image_url,
      ingredients: recipeIngredients,
      instructions: stepsByRecipe.get(row.id) || [],
      tags: tagsByRecipe.get(row.id) || [],
      nutrition: {
        calories: Number(nutrition.kcal_per_serving),
        protein: Number(nutrition.protein_g_per_serving),
        carbs: Number(nutrition.carbs_g_per_serving),
        fat: Number(nutrition.fat_g_per_serving),
        fibre: Number(nutrition.fiber_g_per_serving),
        sugar: Number(nutrition.sugar_g_per_serving),
        sodium: Number(nutrition.sodium_mg_per_serving),
      },
    }
  })

  return {
    recipes,
    recipeById: Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe])),
    ingredients,
    ingredientById,
    ingredientAliases: legacyIngredientAliases,
  }
}
