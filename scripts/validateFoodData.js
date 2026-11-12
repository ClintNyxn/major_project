import { Client } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

async function validate() {
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const counts = await client.query(`
      select
        (select count(*)::int from public.ingredients) as ingredients,
        (select count(*)::int from public.recipes) as recipes,
        (select count(*)::int from public.nutrition_per_ingredient) as nutrition_rows
    `)
    const totals = counts.rows[0]
    const failures = []
    if (totals.ingredients < 200) failures.push(`Expected at least 200 ingredients; found ${totals.ingredients}.`)
    if (totals.recipes < 120) failures.push(`Expected at least 120 recipes; found ${totals.recipes}.`)
    if (totals.ingredients !== totals.nutrition_rows) failures.push(`Nutrition rows (${totals.nutrition_rows}) do not cover all ingredients (${totals.ingredients}).`)

    const plannerTable = await client.query(`
      select c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'user_data' and c.relkind = 'r'
    `)
    if (!plannerTable.rowCount) {
      failures.push('Missing public.user_data planner table; apply the Supabase migrations.')
    } else {
      if (!plannerTable.rows[0].rls_enabled) failures.push('Row-level security is not enabled on public.user_data.')

      const plannerColumns = await client.query(`
        select column_name, data_type, is_nullable
        from information_schema.columns
        where table_schema = 'public' and table_name = 'user_data'
      `)
      const columnByName = new Map(plannerColumns.rows.map((column) => [column.column_name, column]))
      for (const [name, type] of [['user_id', 'uuid'], ['data', 'jsonb'], ['created_at', 'timestamp with time zone'], ['updated_at', 'timestamp with time zone']]) {
        if (columnByName.get(name)?.data_type !== type) failures.push(`public.user_data.${name} is missing or has an unexpected type (expected ${type}).`)
      }
      if (columnByName.get('data')?.is_nullable !== 'NO') failures.push('public.user_data.data must be non-null.')

      const plannerPolicies = await client.query(`
        select cmd, coalesce(qual, '') as using_expression, coalesce(with_check, '') as check_expression
        from pg_policies
        where schemaname = 'public' and tablename = 'user_data' and roles @> array['authenticated']::name[]
      `)
      for (const command of ['SELECT', 'INSERT', 'UPDATE']) {
        const policies = plannerPolicies.rows.filter((policy) => policy.cmd === command)
        const scoped = policies.some((policy) => {
          const expression = `${policy.using_expression} ${policy.check_expression}`.toLowerCase()
          return expression.includes('auth.uid') && expression.includes('user_id')
        })
        if (!scoped) failures.push(`public.user_data needs an authenticated ${command} policy scoped to auth.uid() = user_id.`)
      }
    }

    const invalidNutrition = await client.query(`
      select ingredient_id
      from public.nutrition_per_ingredient
      where kcal_per_100g not between 0 and 950
        or protein_g_per_100g not between 0 and 100
        or carbs_g_per_100g not between 0 and 100
        or fat_g_per_100g not between 0 and 100
        or fiber_g_per_100g not between 0 and carbs_g_per_100g
        or sugar_g_per_100g not between 0 and carbs_g_per_100g
        or sodium_mg_per_100g not between 0 and 100000
    `)
    if (invalidNutrition.rowCount) failures.push(`Impossible nutrient values for: ${invalidNutrition.rows.map((row) => row.ingredient_id).join(', ')}.`)

    const invalidRecipes = await client.query(`
      select r.id, count(distinct rs.step_number)::int as step_count,
             count(distinct ri.ingredient_id)::int as ingredient_count,
             n.recipe_id as has_nutrition
      from public.recipes r
      left join public.recipe_steps rs on rs.recipe_id = r.id
      left join public.recipe_ingredients ri on ri.recipe_id = r.id
      left join public.recipe_nutrition n on n.recipe_id = r.id
      group by r.id, n.recipe_id
      having count(distinct rs.step_number) not between 5 and 10
          or count(distinct ri.ingredient_id) = 0
          or n.recipe_id is null
    `)
    if (invalidRecipes.rowCount) failures.push(`Recipes missing nutrition, ingredients, or 5–10 steps: ${invalidRecipes.rows.map((row) => `${row.id} (steps ${row.step_count}, ingredients ${row.ingredient_count})`).join('; ')}.`)

    const invalidRecipeNutrition = await client.query(`
      select recipe_id
      from public.recipe_nutrition
      where kcal_per_serving not between 0 and 1500
        or protein_g_per_serving not between 0 and 100
        or carbs_g_per_serving not between 0 and 100
        or fat_g_per_serving not between 0 and 100
        or fiber_g_per_serving not between 0 and carbs_g_per_serving
        or sugar_g_per_serving not between 0 and carbs_g_per_serving
        or sodium_mg_per_serving not between 0 and 10000
    `)
    if (invalidRecipeNutrition.rowCount) failures.push(`Impossible per-serving nutrition values for recipes: ${invalidRecipeNutrition.rows.map((row) => row.recipe_id).join(', ')}.`)

    const invalidJainRecipes = await client.query(`
      select distinct r.id
      from public.recipes r
      join public.recipe_ingredients ri on ri.recipe_id = r.id
      join public.ingredients i on i.id = ri.ingredient_id
      where r.diet_type = 'jain-friendly' and i.is_onion_garlic
    `)
    if (invalidJainRecipes.rowCount) failures.push(`Jain-friendly recipes include onion or garlic: ${invalidJainRecipes.rows.map((row) => row.id).join(', ')}.`)

    const mealCounts = await client.query('select meal_type, count(*)::int as count from public.recipes group by meal_type order by meal_type')
    const mealTypes = new Set(mealCounts.rows.map((row) => row.meal_type))
    for (const mealType of ['breakfast', 'lunch', 'dinner', 'snacks', 'sweets']) {
      if (!mealTypes.has(mealType)) failures.push(`No recipes seeded for ${mealType}.`)
    }

    if (failures.length) {
      for (const failure of failures) console.error(`DATA VALIDATION: ${failure}`)
      process.exitCode = 1
      return
    }

    console.info(`Food data validation passed: ${totals.recipes} recipes, ${totals.ingredients} ingredients, ${totals.nutrition_rows} nutrition rows.`)
    console.info(`Meal coverage: ${mealCounts.rows.map((row) => `${row.meal_type} ${row.count}`).join(', ')}.`)
  } finally {
    await client.end()
  }
}

validate().catch((error) => {
  console.error('Food data validation could not run.', error)
  process.exitCode = 1
})
