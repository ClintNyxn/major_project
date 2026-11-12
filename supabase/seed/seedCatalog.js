import { Client } from 'pg'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ingredientNutrition, ingredients, recipes } from './catalogData.js'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
const source = 'IFCT 2017 / USDA FoodData Central estimate'
const sourceNote = 'Rounded representative value per 100 g edible portion guided by IFCT 2017 (ICMR-NIN) and USDA FoodData Central; preparation and cultivar vary. Not a lab analysis or a direct IFCT table transcription.'

const allergens = {
  gluten: new Set(['whole_wheat_flour', 'refined_wheat_flour', 'barley', 'semolina', 'vermicelli', 'whole_wheat_pasta', 'whole_wheat_noodles', 'whole_wheat_bread', 'wholemeal_bread', 'white_bread', 'spelt_flour', 'whole_wheat_tortilla', 'pav_bread', 'soy_sauce', 'soy_sauce_low_sodium']),
  dairy: new Set(['milk', 'low_fat_milk', 'buffalo_milk', 'curd', 'buttermilk', 'paneer', 'paneer_cubes', 'paneer_fresh', 'paneer_low_fat', 'cheese', 'mozzarella', 'ricotta', 'feta', 'cream_cheese', 'butter', 'ghee', 'ghee_cow', 'cream', 'khoya', 'condensed_milk', 'greek_yogurt', 'parmesan', 'ice_cream']),
  nuts: new Set(['cashews', 'raw_cashew', 'almonds', 'walnuts', 'pistachios', 'hazelnuts', 'pecans', 'pine_nuts', 'almond_butter', 'chironji']),
  peanuts: new Set(['peanuts', 'peanut_butter', 'peanut_chutney', 'roasted_peanuts', 'chikki_jaggery']),
  soy: new Set(['soybeans', 'soy_chunks', 'tofu', 'tempeh', 'edamame', 'soy_milk', 'soy_yogurt', 'soy_curd', 'soy_sauce', 'soy_sauce_low_sodium']),
  egg: new Set(['eggs']),
  fish: new Set(['fish', 'salmon', 'anchovy', 'white_fish', 'sardines', 'tuna', 'tilapia', 'whitefish', 'fish_fillet']),
  shellfish: new Set(['prawns', 'crab', 'lobster', 'oyster', 'scallops', 'shrimp', 'shrimp_small']),
  sesame: new Set(['sesame_seeds', 'black_sesame', 'white_sesame', 'sesame_paste', 'sesame_oil', 'sesame_oil_roasted']),
}
const onionGarlic = new Set(['red_onion', 'white_onion', 'shallot', 'garlic', 'spring_onion', 'leek', 'onion_powder', 'garlic_powder', 'garlic_paste', 'garlic_clove'])
const noDairy = new Set(['milk', 'low_fat_milk', 'buffalo_milk', 'curd', 'buttermilk', 'paneer', 'paneer_cubes', 'paneer_fresh', 'paneer_low_fat', 'cheese', 'mozzarella', 'ricotta', 'feta', 'cream_cheese', 'butter', 'ghee', 'ghee_cow', 'cream', 'khoya', 'condensed_milk', 'greek_yogurt', 'parmesan', 'ice_cream'])
const regionNames = {
  north: 'North India',
  south: 'South India',
  east: 'East India',
  west: 'West India',
  global: 'International',
}
const idFor = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const ingredientById = new Map(ingredients.map((item) => [item.id, item]))

function assertSeedData() {
  if (ingredients.length < 200) throw new Error(`Seed needs 200+ ingredients; found ${ingredients.length}.`)
  if (recipes.length < 120) throw new Error(`Seed needs 120+ recipes; found ${recipes.length}.`)
  if (ingredientById.size !== ingredients.length) throw new Error('Ingredient IDs must be unique.')
  for (const recipe of recipes) {
    if (!ingredientById.has(recipe.mainIngredient)) throw new Error(`${recipe.name} references missing ingredient ${recipe.mainIngredient}.`)
    if (!nutritionProfilesExist(recipe.mainIngredient)) throw new Error(`${recipe.name} has no nutrition profile for ${recipe.mainIngredient}.`)
  }
  for (const ingredient of ingredients) {
    const values = ingredientNutrition(ingredient)
    if (!values || values.some((value) => !Number.isFinite(value) || value < 0)) throw new Error(`${ingredient.id} has invalid nutrition data.`)
  }
}

function nutritionProfilesExist(id) {
  return ingredientNutrition(ingredientById.get(id)) !== undefined
}

export function recipeIngredients(recipe) {
  const rows = new Map()
  const add = (id, quantity, unit = 'g', optional = false) => {
    if (!ingredientById.has(id)) throw new Error(`${recipe.name} references missing ingredient ${id}.`)
    const current = rows.get(id)
    rows.set(id, { id, quantity: (current?.quantity || 0) + quantity, unit, optional: current ? current.optional && optional : optional })
  }
  const addMain = (quantity = 180) => add(recipe.mainIngredient, quantity)

  if (recipe.method === 'poha') {
    addMain()
    add('red_onion', 50)
    add('green_peas', 40, 'g', true)
    add('peanuts', 15, 'g', true)
    add('mustard_seeds', 3)
    add('curry_leaves', 4)
    add('cooking_oil', 10)
    add('lemon_juice', 10, 'g', true)
  } else if (recipe.method === 'grain') {
    addMain(160)
    add('carrot', 40, 'g', true)
    add('green_peas', 35, 'g', true)
    add('red_onion', 35)
    add('mustard_seeds', 3)
    add('curry_leaves', 4)
    add('cooking_oil', 10)
    add('salt', 3)
    if (recipe.name.includes('Idiyappam')) add('coconut_milk', 100, 'ml', true)
  } else if (recipe.method === 'rice') {
    if (recipe.mainIngredient === 'basmati_rice' || recipe.mainIngredient === 'sona_masoori_rice' || recipe.mainIngredient === 'brown_rice') addMain(170)
    else {
      add('basmati_rice', 150)
      addMain(100)
    }
    add('red_onion', 45)
    add('tomato', 50, 'g', true)
    add('green_peas', 30, 'g', true)
    add('cooking_oil', 10)
    add('cumin_seeds', 2)
    add('coriander_leaves', 5)
    add('salt', 3)
    if (recipe.name.includes('Lemon')) add('lemon_juice', 15, 'g', true)
    if (recipe.name.includes('Tamarind') || recipe.name.includes('Puliyodarai')) add('tamarind', 18)
    if (recipe.name.includes('Biryani')) {
      add('cardamom', 1, 'g', true)
      add('cinnamon', 2, 'g', true)
      add('cloves', 1, 'g', true)
    }
  } else if (recipe.method === 'dal') {
    addMain(140)
    add('basmati_rice', 120, 'g', true)
    add('tomato', 80)
    add('red_onion', 45)
    add('ginger', 6)
    add('garlic', 4)
    add('ghee', 8, 'g', recipe.dietType === 'vegan')
    add('cumin_seeds', 3)
    add('turmeric', 2)
  } else if (recipe.method === 'dosa') {
    if (['chickpea_flour', 'finger_millet', 'green_moong'].includes(recipe.mainIngredient)) addMain(140)
    else {
      add('basmati_rice', 130)
      add('urad_dal', 60)
      addMain(70)
    }
    add('fenugreek_seeds', 2, 'g', true)
    add('ginger', 5, 'g', true)
    add('cooking_oil', 8)
    add('salt', 3)
  } else if (recipe.method === 'flatbread') {
    const flour = recipe.mainIngredient === 'rice_flour' ? recipe.mainIngredient : 'whole_wheat_flour'
    add(flour, 160)
    if (recipe.mainIngredient !== flour) addMain(100)
    add('curd', 25, 'g', recipe.dietType === 'vegan' || recipe.dietType === 'jain-friendly')
    add('cooking_oil', 8)
    add('cumin_seeds', 2, 'g', true)
    add('coriander_leaves', 5, 'g', true)
    add('salt', 3)
  } else if (recipe.method === 'curry') {
    addMain(200)
    add('red_onion', 60)
    add('tomato', 80)
    add('ginger', 6)
    add('garlic', 4)
    add('cooking_oil', 10)
    add('turmeric', 2)
    add('red_chilli_powder', 2, 'g', true)
    add('coconut_milk', 60, 'g', true)
    add('coriander_leaves', 5, 'g', true)
  } else if (recipe.method === 'stir_fry' || recipe.method === 'noodle') {
    const pastaRecipe = recipe.mainIngredient === 'whole_wheat_pasta'
    if (recipe.method === 'noodle' && !pastaRecipe) add('whole_wheat_noodles', 150)
    addMain(recipe.method === 'noodle' ? (pastaRecipe ? 160 : 100) : 180)
    if (recipe.method === 'stir_fry' && recipe.name.includes('Rice')) add('basmati_rice', 130)
    add('capsicum', 50)
    add('carrot', 40)
    add('cabbage', 45)
    add('soy_sauce', 8, 'g', recipe.dietType === 'jain-friendly')
    add('garlic', 4)
    add('cooking_oil', 8)
    add('sesame_seeds', 3, 'g', true)
  } else if (recipe.method === 'salad') {
    addMain(130)
    add('cucumber', 70)
    add('tomato', 60)
    add('red_onion', 25, 'g', true)
    add('lemon_juice', 12)
    add('coriander_leaves', 5, 'g', true)
    add('olive_oil', 5, 'g', true)
    add('cumin_seeds', 2, 'g', true)
  } else if (recipe.method === 'snack') {
    addMain(170)
    if (!recipe.name.includes('Samosa') && !recipe.name.includes('Kachori')) add('chickpea_flour', 45, 'g', true)
    add('red_onion', 30, 'g', true)
    add('turmeric', 2)
    add('cumin_seeds', 2, 'g', true)
    add('cooking_oil', 8)
    add('coriander_leaves', 5, 'g', true)
    add('lemon_juice', 8, 'g', true)
    if (recipe.name.includes('Samosa') || recipe.name.includes('Kachori')) {
      add('whole_wheat_flour', 90)
    }
  } else if (recipe.method === 'porridge') {
    add('rolled_oats', 70)
    addMain(80)
    add('milk', 180, 'ml', recipe.dietType === 'vegan')
    add('cardamom', 1, 'g', true)
    add('jaggery', 10, 'g', true)
  } else if (recipe.method === 'toast') {
    add('whole_wheat_bread', 60)
    addMain(25)
    add('banana', 60, 'g', true)
  } else if (recipe.method === 'dumpling') {
    add('refined_wheat_flour', 100)
    addMain(150)
    add('cabbage', 60, 'g', recipe.mainIngredient === 'cabbage')
    add('spring_onion', 20, 'g', true)
    add('ginger', 4)
    add('soy_sauce', 8, 'g', recipe.dietType === 'jain-friendly')
    add('sesame_oil', 5, 'g', true)
  } else if (recipe.method === 'sweet') {
    addMain(100)
    add('milk', 150, 'ml', recipe.dietType === 'vegan' || recipe.dietType === 'jain-friendly')
    add('sugar', 18, 'g', true)
    add('ghee', 8, 'g', recipe.dietType === 'vegan' || recipe.dietType === 'jain-friendly')
    add('cardamom', 1, 'g', true)
    add('cashews', 8, 'g', true)
    add('raisins', 8, 'g', true)
  } else {
    addMain(120)
    add('carrot', 60)
    add('potato', 50, 'g', true)
    add('tomato', 60)
    add('red_onion', 35)
    add('cooking_oil', 5)
    add('black_pepper', 1, 'g', true)
    add('salt', 2)
  }

  if (recipe.dietType === 'vegan') {
    for (const [id, item] of rows) {
      if (noDairy.has(id)) {
        rows.delete(id)
        const replacement = id === 'milk' || id === 'cream' ? 'coconut_milk' : 'cooking_oil'
        add(replacement, item.quantity, item.unit, item.optional)
      }
    }
  }
  if (recipe.dietType === 'jain-friendly') {
    for (const id of rows.keys()) if (onionGarlic.has(id)) rows.delete(id)
  }

  return [...rows.values()]
}

export function recipeSteps(recipe, mainName) {
  const steps = {
    poha: [
      'Rinse the flattened rice briefly, drain it, and let it soften while you prepare the vegetables.',
      'Warm the oil in a wide pan. Add mustard seeds and curry leaves and let them crackle.',
      'Add the onion and cook until translucent; stir in the peas and cook until just tender.',
      `Fold in the ${mainName.toLowerCase()} and season with salt and turmeric. Sprinkle in a little water if it looks dry.`,
      'Cover and steam over low heat for 3 minutes, then turn gently so the grains stay separate.',
      'Finish with lemon and coriander, taste for seasoning, and serve warm.',
    ],
    grain: [
      `Measure the ${mainName.toLowerCase()} and prepare the vegetables. Keep measured hot water nearby.`,
      'Heat oil in a heavy pan and temper mustard seeds and curry leaves until fragrant.',
      'Add onion and vegetables; sauté until they begin to soften.',
      `Stir in the ${mainName.toLowerCase()} and toast briefly so each grain is coated.`,
      'Pour in hot water gradually, season, cover, and cook until tender.',
      'Rest covered for 3 minutes, fluff gently, and serve with a squeeze of lemon.',
    ],
    porridge: [
      'Combine the oats with milk and a splash of water in a small saucepan.',
      'Bring to a gentle simmer, stirring often so the oats do not stick.',
      `Add the ${mainName.toLowerCase()} and cook until the fruit softens and the oats turn creamy.`,
      'Stir in cardamom and a little jaggery if desired.',
      'Add more warm milk or water to adjust the consistency.',
      'Serve warm with sliced fruit or toasted seeds.',
    ],
    toast: [
      'Toast the bread on both sides until crisp and golden.',
      `Spread the ${mainName.toLowerCase()} evenly over each warm slice.`,
      'Add sliced banana or another fruit if desired.',
      'Sprinkle with cinnamon or seeds for extra texture.',
      'Cut into manageable pieces for serving.',
      'Serve immediately while the toast is still crisp.',
    ],
    dumpling: [
      'Mix the flour with water and a pinch of salt to form a smooth, firm dough; cover and rest.',
      `Finely chop the ${mainName.toLowerCase()} and mix with ginger, spring onion, and a little soy sauce.`,
      'Roll the dough thinly and cut small circles for wrappers.',
      'Place a small spoonful of filling in each wrapper and pleat the edges closed.',
      'Steam the dumplings over boiling water until the wrappers are translucent and the filling is cooked through.',
      'Serve hot with a dipping sauce.',
    ],
    rice: [
      'Rinse the rice until the water runs mostly clear, then soak for 10 minutes and drain.',
      'Chop the aromatics and prepare the vegetables or protein before heating the pan.',
      'Warm oil, bloom cumin and whole spices, then cook the onion until soft.',
      `Add the ${mainName.toLowerCase()}, tomato and seasoning; stir until coated with the spice base.`,
      'Add rice and measured water, bring to a simmer, cover, and cook until the grains are tender.',
      'Rest off the heat for 5 minutes, fluff with a fork, and serve with fresh herbs.',
    ],
    dal: [
      `Rinse the ${mainName.toLowerCase()} and cook it with water until soft; mash lightly for a creamy texture.`,
      'Heat ghee or oil in a small pan and add cumin, turmeric, ginger and garlic.',
      'Add tomato and onion and cook until the mixture is soft and aromatic.',
      'Stir the tempering into the cooked lentils and add water to reach the consistency you like.',
      'Simmer gently for 8 minutes, stirring occasionally so the lentils do not catch.',
      'Taste, adjust salt and spice, garnish with coriander, and serve with rice or flatbread.',
    ],
    dosa: [
      `Combine the ${mainName.toLowerCase()} with the batter ingredients and enough water to make a pourable mixture.`,
      'Rest the batter while you prepare any filling; keep the pan and oil ready.',
      'Heat a flat griddle over medium heat and wipe it lightly with oil.',
      'Pour a ladle of batter and spread it in a thin circle, working from the centre outwards.',
      'Cook until the edges lift and the underside is golden; add filling if the recipe calls for it.',
      'Fold or roll while hot and serve immediately with chutney or sambar.',
    ],
    flatbread: [
      `Mix the flour with salt and the ${mainName.toLowerCase()}, then add water gradually to make a soft dough.`,
      'Knead briefly until smooth, cover, and rest for 10 minutes.',
      'Divide the dough into equal portions and roll each one on a lightly floured surface.',
      'Heat a tawa; cook each bread until bubbles appear, then turn and cook the other side.',
      'Brush lightly with oil or ghee and cook until brown spots form.',
      'Serve hot with curd, chutney, or a simple vegetable accompaniment.',
    ],
    curry: [
      'Wash and cut the main ingredient into even pieces; prepare the onion, tomato, ginger and garlic.',
      'Heat oil in a pan and cook the aromatics slowly until soft and fragrant.',
      'Add turmeric and chilli to the pan and stir for 30 seconds so the spices do not burn.',
      `Add the ${mainName.toLowerCase()} and turn it through the masala until coated.`,
      'Add a little water or coconut milk, cover, and simmer until the centre is cooked and the sauce thickens.',
      'Taste for salt and spice, finish with coriander, and serve with rice or flatbread.',
    ],
    stir_fry: [
      'Slice the main ingredient and vegetables into even pieces; mix the soy sauce with a spoonful of water.',
      'Heat a wok or wide pan until hot, then add a small amount of oil.',
      'Add garlic and the main ingredient; stir-fry until nearly cooked through.',
      'Add the vegetables and toss over high heat so they stay bright and crisp.',
      'Pour in the sauce and sesame, toss for another minute, and check that everything is cooked.',
      'Serve immediately with steamed rice or noodles.',
    ],
    noodle: [
      'Cook the noodles according to the packet directions, drain, and rinse briefly with cool water.',
      'Slice the vegetables and main ingredient; stir together the soy sauce and a little water.',
      'Heat oil in a wok and briefly cook the garlic and main ingredient.',
      'Add the vegetables and stir-fry over high heat until just tender.',
      'Add the noodles and sauce; toss until evenly coated and hot.',
      'Taste, adjust seasoning, and serve straight from the pan.',
    ],
    salad: [
      `Cook or rinse the ${mainName.toLowerCase()} as needed and let it cool completely.`,
      'Dice the cucumber and tomato into bite-sized pieces and finely chop the herbs.',
      'Whisk lemon juice with cumin, salt, and a little oil to make a bright dressing.',
      'Combine the main ingredient and vegetables in a bowl.',
      'Pour over the dressing and toss gently so the pieces stay intact.',
      'Rest for 5 minutes, taste, and finish with fresh coriander before serving.',
    ],
    snack: [
      `Prepare the ${mainName.toLowerCase()}: wash, drain, and cut or mash it as the recipe requires.`,
      'Mix the flour with salt and spices, then add enough water to make a coating or soft mixture.',
      'Fold in the main ingredient and herbs until evenly coated.',
      'Shape into even pieces and heat a skillet with a thin layer of oil.',
      'Cook in batches, turning once, until crisp outside and fully cooked in the centre.',
      'Drain briefly and serve hot with chutney or lemon.',
    ],
    sweet: [
      `Wash, grate, or measure the ${mainName.toLowerCase()} and prepare the nuts and cardamom.`,
      'Warm the ghee in a heavy pan and roast the main ingredient gently until fragrant.',
      'Add milk or a plant-based alternative and simmer, stirring often.',
      'Stir in sugar or jaggery and continue cooking until the mixture thickens.',
      'Add cardamom and nuts; cook until the mixture reaches a soft, spoonable texture.',
      'Serve warm, or cool completely before portioning.',
    ],
  }
  return steps[recipe.method] || steps.curry
}

function gramsFor(item, ingredient) {
  if (item.unit === 'ml') return item.quantity * ingredient.gramsPerMl
  if (item.unit === 'piece') return item.quantity * ingredient.gramsPerPiece
  if (item.unit === 'kg') return item.quantity * 1000
  if (item.unit === 'l') return item.quantity * 1000 * ingredient.gramsPerMl
  return item.quantity
}

async function insertRows(client, table, columns, rows, conflictColumn, updateColumns) {
  const chunkSize = Math.max(1, Math.floor(60000 / columns.length))
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize)
    const values = []
    const placeholders = chunk.map((row) => {
      const current = columns.map((column) => {
        values.push(row[column])
        return `$${values.length}`
      })
      return `(${current.join(', ')})`
    })
    const updates = updateColumns.map((column) => `${column} = excluded.${column}`).join(', ')
    await client.query(
      `insert into public.${table} (${columns.join(', ')}) values ${placeholders.join(', ')} on conflict (${conflictColumn}) do update set ${updates}`,
      values,
    )
  }
}

async function seed() {
  assertSeedData()
  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query('begin')
    const regionMap = new Map()
    for (const recipe of recipes) regionMap.set(recipe.region, { id: recipe.region, name: regionNames[recipe.region] })
    await insertRows(client, 'regions', ['id', 'name'], [...regionMap.values()], 'id', ['name'])

    const cuisineMap = new Map()
    for (const recipe of recipes) {
      const id = idFor(recipe.cuisine)
      cuisineMap.set(id, { id, name: recipe.cuisine, region_id: recipe.region })
    }
    await insertRows(client, 'cuisines', ['id', 'name', 'region_id'], [...cuisineMap.values()], 'id', ['name', 'region_id'])

    const ingredientRowsForDb = ingredients.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price_per_kg_inr: item.price,
      grams_per_piece: item.gramsPerPiece,
      grams_per_ml: item.gramsPerMl,
      ...Object.fromEntries(Object.entries(allergens).map(([name, ids]) => [name, ids.has(item.id)])),
      is_onion_garlic: onionGarlic.has(item.id),
    }))
    await insertRows(
      client,
      'ingredients',
      ['id', 'name', 'category', 'price_per_kg_inr', 'grams_per_piece', 'grams_per_ml', ...Object.keys(allergens), 'is_onion_garlic'],
      ingredientRowsForDb,
      'id',
      ['name', 'category', 'price_per_kg_inr', 'grams_per_piece', 'grams_per_ml', ...Object.keys(allergens), 'is_onion_garlic'],
    )
    const nutritionRows = ingredients.map((item) => {
      const [kcal, protein, carbs, fat, fiber, sugar, sodium] = ingredientNutrition(item)
      return {
        ingredient_id: item.id,
        kcal_per_100g: kcal,
        protein_g_per_100g: protein,
        carbs_g_per_100g: carbs,
        fat_g_per_100g: fat,
        fiber_g_per_100g: fiber,
        sugar_g_per_100g: sugar,
        sodium_mg_per_100g: sodium,
        source,
        source_note: sourceNote,
      }
    })
    await insertRows(
      client,
      'nutrition_per_ingredient',
      ['ingredient_id', 'kcal_per_100g', 'protein_g_per_100g', 'carbs_g_per_100g', 'fat_g_per_100g', 'fiber_g_per_100g', 'sugar_g_per_100g', 'sodium_mg_per_100g', 'source', 'source_note'],
      nutritionRows,
      'ingredient_id',
      ['kcal_per_100g', 'protein_g_per_100g', 'carbs_g_per_100g', 'fat_g_per_100g', 'fiber_g_per_100g', 'sugar_g_per_100g', 'sodium_mg_per_100g', 'source', 'source_note'],
    )

    const generated = recipes.map((recipe, index) => {
      const id = idFor(recipe.name)
      const ingredientsForRecipe = recipeIngredients(recipe)
      const servings = 2
      const cost = ingredientsForRecipe.reduce((sum, item) => {
        const ingredient = ingredientById.get(item.id)
        return sum + ingredient.price * gramsFor(item, ingredient) / 1000
      }, 0)
      const prep = 8 + (index % 6) * 3
      const cook = recipe.method === 'sweet' ? 18 + index % 20 : 10 + (index * 7) % 35
      const total = prep + cook
      return {
        ...recipe,
        id,
        ingredients: ingredientsForRecipe,
        servings,
        prep,
        cook,
        difficulty: total > 50 || index % 13 === 0 ? 'Medium' : 'Easy',
        spice: recipe.method === 'sweet' ? 0 : index % 5 + 1,
        costPerServing: Math.max(1, Math.round(cost / servings)),
        steps: recipeSteps(recipe, ingredientById.get(recipe.mainIngredient).name),
      }
    })
    const recipeRowsForDb = generated.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      description: `${recipe.cuisine} ${recipe.mealType} featuring ${ingredientById.get(recipe.mainIngredient).name.toLowerCase()}, prepared with everyday ingredients.`,
      meal_type: recipe.mealType,
      cuisine_id: idFor(recipe.cuisine),
      prep_minutes: recipe.prep,
      cook_minutes: recipe.cook,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      diet_type: recipe.dietType,
      spice_level: recipe.spice,
      cost_per_serving_inr: recipe.costPerServing,
      image_url: null,
    }))
    await insertRows(
      client,
      'recipes',
      ['id', 'name', 'description', 'meal_type', 'cuisine_id', 'prep_minutes', 'cook_minutes', 'difficulty', 'servings', 'diet_type', 'spice_level', 'cost_per_serving_inr', 'image_url'],
      recipeRowsForDb,
      'id',
      ['name', 'description', 'meal_type', 'cuisine_id', 'prep_minutes', 'cook_minutes', 'difficulty', 'servings', 'diet_type', 'spice_level', 'cost_per_serving_inr', 'image_url'],
    )

    const recipeIds = generated.map((recipe) => recipe.id)
    await client.query('delete from public.recipe_ingredients where recipe_id = any($1::text[])', [recipeIds])
    await client.query('delete from public.recipe_steps where recipe_id = any($1::text[])', [recipeIds])
    await client.query('delete from public.recipe_tags where recipe_id = any($1::text[])', [recipeIds])
    const ingredientLinks = generated.flatMap((recipe) => recipe.ingredients.map((item) => ({
      recipe_id: recipe.id,
      ingredient_id: item.id,
      quantity: item.quantity,
      unit: item.unit,
      is_optional: item.optional,
    })))
    await insertRows(client, 'recipe_ingredients', ['recipe_id', 'ingredient_id', 'quantity', 'unit', 'is_optional'], ingredientLinks, 'recipe_id, ingredient_id', ['quantity', 'unit', 'is_optional'])
    const steps = generated.flatMap((recipe) => recipe.steps.map((instruction, index) => ({
      recipe_id: recipe.id,
      step_number: index + 1,
      instruction,
    })))
    await insertRows(client, 'recipe_steps', ['recipe_id', 'step_number', 'instruction'], steps, 'recipe_id, step_number', ['instruction'])

    const tagsForRecipe = generated.map((recipe) => {
      const tags = new Set([recipe.dietType === 'jain-friendly' ? 'Jain-friendly' : recipe.dietType === 'vegan' ? 'Vegan' : recipe.dietType === 'veg' ? 'Vegetarian' : recipe.dietType === 'eggetarian' ? 'Eggetarian' : 'Non-vegetarian'])
      if (recipe.prep + recipe.cook <= 30) tags.add('Quick')
      if (recipe.costPerServing <= 100) tags.add('Student budget')
      tags.add(recipe.region === 'global' ? 'International' : regionNames[recipe.region])
      return { recipe, tags: [...tags] }
    })
    const tagMap = new Map()
    for (const entry of tagsForRecipe) {
      for (const name of entry.tags) {
        const id = idFor(name)
        tagMap.set(id, { id, name })
      }
    }
    await insertRows(client, 'tags', ['id', 'name'], [...tagMap.values()], 'id', ['name'])
    const tagIds = new Map([...tagMap.values()].map((tag) => [tag.name, tag.id]))
    const recipeTagRows = tagsForRecipe.flatMap(({ recipe, tags }) => tags.map((name) => ({
      recipe_id: recipe.id,
      tag_id: tagIds.get(name),
    })))
    await insertRows(client, 'recipe_tags', ['recipe_id', 'tag_id'], recipeTagRows, 'recipe_id, tag_id', ['tag_id'])
    await client.query('commit')

    console.info(`Seeded ${ingredients.length} ingredients and ${generated.length} recipes with ${steps.length} ordered steps.`)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  seed().catch((error) => {
    console.error('Could not seed the recipe catalog.', error)
    process.exitCode = 1
  })
}
