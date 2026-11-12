const recipe = (id, name, cuisine, foodType, category, minutes, difficulty, kcal, protein, carbs, fat, fibre, cost, tags, items, allergens = []) => ({
  id, name, cuisine, foodType, category, prepTime: Math.max(5, Math.round(minutes * 0.3)), cookTime: minutes - Math.max(5, Math.round(minutes * 0.3)), difficulty, servings: 2,
  nutrition: { calories: kcal, protein, carbs, fat, fibre }, estimatedCost: cost, tags, allergens,
  image: `https://images.unsplash.com/${images[(id - 1) % images.length]}?auto=format&fit=crop&w=1000&q=82`,
  description: `A satisfying ${cuisine.toLowerCase()} ${category.toLowerCase()} made with familiar ingredients and everyday techniques.`,
  ingredients: items.map(([ingredientId, quantity, unit = 'g']) => ({ ingredientId, quantity, unit })),
  instructions: [
    `Prepare and measure the ingredients for ${name.toLowerCase()}. Wash and chop the fresh produce.`,
    'Warm a little oil in a pan over medium heat. Add the aromatics and spices, stirring until fragrant.',
    'Add the remaining ingredients and cook gently until tender, stirring occasionally.',
    'Taste, adjust the seasoning, and serve warm. Quantities scale with the serving selector.',
  ],
})

const images = [
  'photo-1596560548464-f010549b84d7', 'photo-1546833999-b9f581a1996d', 'photo-1547592180-85f173990554',
  'photo-1512621776951-a57141f2eefd', 'photo-1547592180-176c7c24ef25', 'photo-1512058564366-18510be2db19',
  'photo-1603894584373-5ac82b2ae398', 'photo-1565557623262-b51c2513a641', 'photo-1546069901-ba9599a7e63c',
  'photo-1476224203421-9ac39bcb3327', 'photo-1512621776951-a57141f2eefd', 'photo-1547592180-85f173990554',
]

export const recipes = [
  recipe(1, 'Vegetable Pulao', 'North Indian', 'vegetarian', 'Lunch', 30, 'Easy', 320, 8, 55, 7, 5, 58, ['Balanced Diet', 'Budget Friendly'], [['rice', 150], ['potato', 100], ['tomato', 100], ['onion', 80], ['peas', 50], ['oil', 15], ['spices', 5]]),
  recipe(2, 'Dal Khichdi', 'North Indian', 'vegetarian', 'Dinner', 35, 'Easy', 345, 13, 58, 7, 9, 48, ['High Protein', 'Budget Friendly'], [['rice', 100], ['dal', 100], ['tomato', 80], ['onion', 50], ['ginger', 10], ['oil', 10], ['cumin', 4]]),
  recipe(3, 'Paneer Bhurji', 'North Indian', 'vegetarian', 'Dinner', 25, 'Easy', 310, 21, 14, 19, 3, 92, ['High Protein', 'Low Carb'], [['paneer', 200], ['tomato', 100], ['onion', 80], ['capsicum', 70], ['oil', 10], ['spices', 5]], ['Dairy']),
  recipe(4, 'Masala Dosa', 'South Indian', 'vegan', 'Breakfast', 35, 'Medium', 290, 7, 48, 8, 4, 42, ['Vegetarian', 'Budget Friendly'], [['rice', 150], ['potato', 150], ['onion', 60], ['oil', 10], ['spices', 5]]),
  recipe(5, 'Chole', 'North Indian', 'vegan', 'Dinner', 40, 'Medium', 360, 16, 54, 9, 12, 72, ['High Protein', 'High Fibre'], [['chickpeas', 180], ['tomato', 140], ['onion', 100], ['ginger', 10], ['garlic', 8], ['oil', 12], ['spices', 6]]),
  recipe(6, 'Rajma Rice', 'North Indian', 'vegan', 'Lunch', 45, 'Medium', 420, 17, 72, 8, 13, 76, ['High Protein', 'High Fibre'], [['kidney-beans', 160], ['rice', 140], ['tomato', 120], ['onion', 80], ['garlic', 8], ['oil', 10], ['spices', 5]]),
  recipe(7, 'Vegetable Upma', 'South Indian', 'vegan', 'Breakfast', 20, 'Easy', 280, 8, 47, 7, 6, 34, ['Quick', 'Budget Friendly'], [['wheat-flour', 140], ['carrot', 60], ['peas', 50], ['onion', 60], ['oil', 10], ['cumin', 4]], ['Gluten']),
  recipe(8, 'Egg Curry', 'North Indian', 'eggetarian', 'Dinner', 35, 'Easy', 330, 19, 18, 20, 4, 66, ['High Protein'], [['eggs', 4, 'piece'], ['tomato', 140], ['onion', 100], ['ginger', 10], ['oil', 12], ['spices', 6]], ['Eggs']),
  recipe(9, 'Chicken Biryani', 'North Indian', 'non-vegetarian', 'Dinner', 55, 'Medium', 510, 32, 63, 14, 5, 148, ['High Protein'], [['chicken', 250], ['rice', 160], ['onion', 100], ['curd', 60], ['ginger', 10], ['garlic', 8], ['oil', 15], ['spices', 8]], ['Dairy']),
  recipe(10, 'Oats Porridge', 'Continental', 'vegetarian', 'Breakfast', 12, 'Easy', 290, 11, 45, 8, 7, 36, ['Quick', 'Low Calorie'], [['oats', 100], ['milk', 250, 'ml'], ['banana', 1, 'piece'], ['sugar', 8]], ['Dairy']),
  recipe(11, 'Besan Chilla', 'North Indian', 'vegan', 'Breakfast', 20, 'Easy', 265, 13, 34, 8, 6, 30, ['High Protein', 'Quick'], [['chickpeas', 120], ['onion', 50], ['tomato', 50], ['oil', 8], ['spices', 4]]),
  recipe(12, 'Aloo Paratha', 'North Indian', 'vegetarian', 'Breakfast', 35, 'Medium', 390, 9, 58, 12, 7, 38, ['Budget Friendly'], [['wheat-flour', 160], ['potato', 180], ['curd', 50], ['oil', 12], ['spices', 5]], ['Dairy', 'Gluten']),
  recipe(13, 'Fish Curry', 'South Indian', 'pescatarian', 'Dinner', 35, 'Medium', 340, 29, 18, 15, 4, 132, ['High Protein', 'Low Carb'], [['fish', 250], ['tomato', 120], ['onion', 80], ['coconut-milk', 100, 'ml'], ['ginger', 8], ['oil', 10], ['spices', 5]], ['Fish']),
  recipe(14, 'Tofu Stir Fry', 'Chinese', 'vegan', 'Lunch', 20, 'Easy', 305, 22, 24, 13, 7, 108, ['High Protein', 'Low Carb', 'Quick'], [['tofu', 180], ['capsicum', 100], ['carrot', 70], ['cabbage', 80], ['garlic', 8], ['oil', 8], ['soy-chunks', 15]], ['Soy']),
  recipe(15, 'Spinach Dal', 'North Indian', 'vegan', 'Dinner', 30, 'Easy', 310, 17, 47, 6, 11, 50, ['High Protein', 'High Fibre'], [['dal', 130], ['spinach', 100], ['tomato', 80], ['onion', 50], ['garlic', 8], ['oil', 8], ['cumin', 4]]),
  recipe(16, 'Tomato Pasta', 'Italian', 'vegetarian', 'Lunch', 25, 'Easy', 395, 13, 62, 10, 6, 62, ['Quick'], [['pasta', 180], ['tomato', 180], ['onion', 60], ['garlic', 8], ['cheese', 25], ['oil', 8]], ['Dairy', 'Gluten']),
  recipe(17, 'Vegetable Fried Rice', 'Chinese', 'vegan', 'Lunch', 20, 'Easy', 330, 9, 57, 8, 5, 44, ['Quick', 'Budget Friendly'], [['rice', 160], ['carrot', 70], ['peas', 50], ['capsicum', 60], ['onion', 50], ['oil', 10], ['soy-chunks', 10]], ['Soy']),
  recipe(18, 'Chana Salad', 'Mediterranean', 'vegan', 'Lunch', 15, 'Easy', 280, 14, 42, 7, 11, 54, ['High Protein', 'Low Calorie', 'Quick'], [['chickpeas', 140], ['tomato', 100], ['onion', 50], ['lemon', 1, 'piece'], ['coriander', 10], ['cumin', 3]]),
  recipe(19, 'Egg Bhurji Toast', 'Continental', 'eggetarian', 'Breakfast', 15, 'Easy', 345, 21, 34, 13, 4, 48, ['High Protein', 'Quick'], [['eggs', 3, 'piece'], ['bread', 2, 'piece'], ['tomato', 50], ['onion', 40], ['butter', 8]], ['Eggs', 'Dairy', 'Gluten']),
  recipe(20, 'Lemon Rice', 'South Indian', 'vegan', 'Lunch', 20, 'Easy', 305, 6, 56, 7, 3, 32, ['Quick', 'Budget Friendly'], [['rice', 160], ['lemon', 1, 'piece'], ['oil', 8], ['cumin', 4], ['peanuts', 15]]),
  recipe(21, 'Mango Oats Bowl', 'Continental', 'vegetarian', 'Breakfast', 10, 'Easy', 310, 10, 51, 8, 7, 52, ['Quick'], [['oats', 80], ['milk', 160, 'ml'], ['mango', 100], ['curd', 40]], ['Dairy']),
  recipe(22, 'Vegetable Soup', 'Continental', 'vegan', 'Dinner', 25, 'Easy', 190, 7, 34, 4, 8, 40, ['Low Calorie', 'Low Carb'], [['carrot', 100], ['cabbage', 100], ['tomato', 100], ['onion', 50], ['peas', 40], ['oil', 5]]),
  recipe(23, 'Paneer Tikka', 'North Indian', 'vegetarian', 'Snacks', 30, 'Medium', 350, 24, 18, 21, 4, 128, ['High Protein', 'Low Carb'], [['paneer', 200], ['curd', 60], ['capsicum', 80], ['onion', 60], ['spices', 8]], ['Dairy']),
  recipe(24, 'Chicken Stir Fry', 'Chinese', 'non-vegetarian', 'Dinner', 25, 'Easy', 360, 36, 24, 13, 6, 142, ['High Protein', 'Low Carb', 'Quick'], [['chicken', 220], ['capsicum', 80], ['carrot', 60], ['cabbage', 80], ['garlic', 8], ['oil', 8], ['soy-chunks', 10]], ['Soy']),
  recipe(25, 'Moong Dal Chilla', 'North Indian', 'vegan', 'Breakfast', 25, 'Easy', 270, 18, 39, 5, 8, 38, ['High Protein', 'Low Calorie'], [['green-gram', 140], ['onion', 50], ['ginger', 8], ['oil', 8], ['cumin', 4]]),
  recipe(26, 'Curd Rice', 'South Indian', 'vegetarian', 'Lunch', 15, 'Easy', 295, 9, 50, 6, 2, 35, ['Balanced Diet', 'Budget Friendly'], [['rice', 150], ['curd', 160], ['cumin', 3]], ['Dairy']),
  recipe(27, 'Stuffed Capsicum', 'Continental', 'vegetarian', 'Dinner', 40, 'Medium', 315, 12, 44, 10, 7, 68, ['Balanced Diet'], [['capsicum', 2, 'piece'], ['rice', 100], ['tomato', 80], ['onion', 50], ['cheese', 25], ['oil', 8]], ['Dairy']),
  recipe(28, 'Banana Pancakes', 'Continental', 'vegetarian', 'Breakfast', 20, 'Easy', 340, 12, 53, 9, 5, 42, ['Quick'], [['banana', 2, 'piece'], ['wheat-flour', 90], ['eggs', 1, 'piece'], ['milk', 100, 'ml'], ['butter', 5]], ['Eggs', 'Dairy', 'Gluten']),
  recipe(29, 'Coconut Lentil Curry', 'Thai', 'vegan', 'Dinner', 35, 'Easy', 370, 18, 48, 12, 10, 78, ['High Protein', 'High Fibre'], [['lentils', 140], ['coconut-milk', 120, 'ml'], ['tomato', 80], ['onion', 50], ['ginger', 8], ['spices', 5]]),
  recipe(30, 'Fish Rice Bowl', 'Japanese', 'pescatarian', 'Lunch', 25, 'Easy', 410, 31, 52, 9, 4, 155, ['High Protein'], [['fish', 180], ['rice', 150], ['cabbage', 60], ['carrot', 50], ['lemon', 1, 'piece'], ['oil', 5]], ['Fish']),
]

export const recipeById = Object.fromEntries(recipes.map((item) => [String(item.id), item]))
