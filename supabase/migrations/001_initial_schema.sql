-- 001_initial_schema.sql
-- KhaanaKya? initial database schema migration

-- =============================================================================
-- 1. Shared Recipe & Ingredient Catalog Tables
-- =============================================================================

create table if not exists public.regions (
  id text primary key,
  name text not null unique
);

create table if not exists public.cuisines (
  id text primary key,
  name text not null unique,
  region_id text not null references public.regions (id)
);

create table if not exists public.ingredients (
  id text primary key,
  name text not null unique,
  category text not null,
  price_per_kg_inr numeric(10, 2) not null check (price_per_kg_inr >= 0),
  grams_per_piece numeric(10, 2) not null default 1 check (grams_per_piece > 0),
  grams_per_ml numeric(8, 4) not null default 1 check (grams_per_ml > 0),
  gluten boolean not null default false,
  dairy boolean not null default false,
  nuts boolean not null default false,
  peanuts boolean not null default false,
  soy boolean not null default false,
  egg boolean not null default false,
  fish boolean not null default false,
  shellfish boolean not null default false,
  sesame boolean not null default false,
  is_onion_garlic boolean not null default false
);

create table if not exists public.nutrition_per_ingredient (
  ingredient_id text primary key references public.ingredients (id) on delete cascade,
  kcal_per_100g numeric(8, 2) not null check (kcal_per_100g between 0 and 950),
  protein_g_per_100g numeric(7, 2) not null check (protein_g_per_100g between 0 and 100),
  carbs_g_per_100g numeric(7, 2) not null check (carbs_g_per_100g between 0 and 100),
  fat_g_per_100g numeric(7, 2) not null check (fat_g_per_100g between 0 and 100),
  fiber_g_per_100g numeric(7, 2) not null check (fiber_g_per_100g between 0 and 100),
  sugar_g_per_100g numeric(7, 2) not null check (sugar_g_per_100g between 0 and 100),
  sodium_mg_per_100g numeric(9, 2) not null check (sodium_mg_per_100g between 0 and 100000),
  source text not null,
  source_note text not null,
  check (fiber_g_per_100g <= carbs_g_per_100g),
  check (sugar_g_per_100g <= carbs_g_per_100g)
);

create table if not exists public.recipes (
  id text primary key,
  name text not null,
  description text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snacks', 'sweets')),
  cuisine_id text not null references public.cuisines (id),
  prep_minutes integer not null check (prep_minutes between 1 and 1440),
  cook_minutes integer not null check (cook_minutes between 0 and 1440),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Advanced')),
  servings integer not null check (servings between 1 and 20),
  diet_type text not null check (diet_type in ('veg', 'vegan', 'eggetarian', 'non-veg', 'jain-friendly')),
  spice_level integer not null check (spice_level between 0 and 5),
  cost_per_serving_inr numeric(10, 2) not null check (cost_per_serving_inr >= 0),
  image_url text
);

create table if not exists public.recipe_ingredients (
  recipe_id text not null references public.recipes (id) on delete cascade,
  ingredient_id text not null references public.ingredients (id),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit text not null check (unit in ('g', 'kg', 'ml', 'l', 'piece')),
  is_optional boolean not null default false,
  primary key (recipe_id, ingredient_id)
);

create table if not exists public.recipe_steps (
  recipe_id text not null references public.recipes (id) on delete cascade,
  step_number smallint not null check (step_number between 1 and 10),
  instruction text not null,
  primary key (recipe_id, step_number)
);

create table if not exists public.tags (
  id text primary key,
  name text not null unique
);

create table if not exists public.recipe_tags (
  recipe_id text not null references public.recipes (id) on delete cascade,
  tag_id text not null references public.tags (id) on delete cascade,
  primary key (recipe_id, tag_id)
);

create index if not exists recipes_meal_cuisine_idx on public.recipes (meal_type, cuisine_id);
create index if not exists recipes_diet_type_idx on public.recipes (diet_type);
create index if not exists recipes_difficulty_idx on public.recipes (difficulty);
create index if not exists recipes_cost_per_serving_idx on public.recipes (cost_per_serving_inr);
create index if not exists recipes_total_time_idx on public.recipes ((prep_minutes + cook_minutes));
create index if not exists recipe_ingredients_ingredient_idx on public.recipe_ingredients (ingredient_id);
create index if not exists recipe_tags_tag_idx on public.recipe_tags (tag_id);
create index if not exists ingredients_category_name_idx on public.ingredients (category, name);

-- =============================================================================
-- 2. Computed Recipe Nutrition View
-- =============================================================================

create or replace view public.recipe_nutrition
with (security_invoker = true)
as
select
  r.id as recipe_id,
  round(sum(n.kcal_per_100g * grams.amount_g) / 100 / r.servings, 1) as kcal_per_serving,
  round(sum(n.protein_g_per_100g * grams.amount_g) / 100 / r.servings, 1) as protein_g_per_serving,
  round(sum(n.carbs_g_per_100g * grams.amount_g) / 100 / r.servings, 1) as carbs_g_per_serving,
  round(sum(n.fat_g_per_100g * grams.amount_g) / 100 / r.servings, 1) as fat_g_per_serving,
  round(sum(n.fiber_g_per_100g * grams.amount_g) / 100 / r.servings, 1) as fiber_g_per_serving,
  round(sum(n.sugar_g_per_100g * grams.amount_g) / 100 / r.servings, 1) as sugar_g_per_serving,
  round(sum(n.sodium_mg_per_100g * grams.amount_g) / 100 / r.servings, 1) as sodium_mg_per_serving
from public.recipes r
join public.recipe_ingredients ri on ri.recipe_id = r.id and not ri.is_optional
join public.ingredients i on i.id = ri.ingredient_id
join public.nutrition_per_ingredient n on n.ingredient_id = i.id
cross join lateral (
  select case ri.unit
    when 'g' then ri.quantity
    when 'kg' then ri.quantity * 1000
    when 'ml' then ri.quantity * i.grams_per_ml
    when 'l' then ri.quantity * 1000 * i.grams_per_ml
    when 'piece' then ri.quantity * i.grams_per_piece
  end as amount_g
) grams
group by r.id, r.servings;

-- =============================================================================
-- 3. User Data & User-Specific Relational Tables
-- =============================================================================

-- user_data: stores the user's complete planner state as JSONB (used by accountDataService)
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- profiles: per-user profile details
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  city text not null default '',
  address text not null default '',
  pin_code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- preferences: per-user diet and meal planner preferences
create table if not exists public.preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  food_type text not null default 'No preference',
  cuisines text[] not null default '{}',
  health_goals text[] not null default '{}',
  allergies text[] not null default '{}',
  budget numeric(10, 2) not null default 400,
  budget_scope text not null default 'per person',
  max_time integer not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- saved_recipes: per-user favorited / saved recipes
create table if not exists public.saved_recipes (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
create index if not exists saved_recipes_user_idx on public.saved_recipes (user_id);

-- shopping_list: per-user shopping list items
create table if not exists public.shopping_list (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  ingredient_id text,
  recipe_id text,
  name text not null,
  quantity numeric(10, 2) not null default 1,
  unit text not null default 'piece',
  cost numeric(10, 2) not null default 0,
  recipe_name text,
  purchased boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists shopping_list_user_idx on public.shopping_list (user_id);

-- user_ingredients: per-user pantry ingredients
create table if not exists public.user_ingredients (
  user_id uuid not null references auth.users (id) on delete cascade,
  ingredient_id text not null references public.ingredients (id) on delete cascade,
  quantity numeric(10, 2) not null default 0,
  unit text not null default 'g',
  created_at timestamptz not null default now(),
  primary key (user_id, ingredient_id)
);
create index if not exists user_ingredients_user_idx on public.user_ingredients (user_id);

-- =============================================================================
-- 4. Row Level Security & Policies
-- =============================================================================

-- Catalog tables: readable by everyone (anon and authenticated)
do $$
declare
  t text;
begin
  foreach t in array array[
    'regions',
    'cuisines',
    'ingredients',
    'nutrition_per_ingredient',
    'recipes',
    'recipe_ingredients',
    'recipe_steps',
    'tags',
    'recipe_tags'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists catalog_read on public.%I', t);
    execute format('create policy catalog_read on public.%I for select to anon, authenticated using (true)', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end;
$$;

grant select on public.recipe_nutrition to anon, authenticated;

-- User-specific tables: accessible ONLY by the owning user (auth.uid() = user_id or auth.uid() = id)

-- public.user_data
alter table public.user_data enable row level security;
drop policy if exists "Users can read their own planner data" on public.user_data;
create policy "Users can read their own planner data"
  on public.user_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own planner data" on public.user_data;
create policy "Users can create their own planner data"
  on public.user_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own planner data" on public.user_data;
create policy "Users can update their own planner data"
  on public.user_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own planner data" on public.user_data;
create policy "Users can delete their own planner data"
  on public.user_data for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;

-- public.profiles
alter table public.profiles enable row level security;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

revoke all on public.profiles from anon;
grant select, insert, update, delete on public.profiles to authenticated;

-- public.preferences
alter table public.preferences enable row level security;
drop policy if exists "Users can read their own preferences" on public.preferences;
create policy "Users can read their own preferences"
  on public.preferences for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own preferences" on public.preferences;
create policy "Users can create their own preferences"
  on public.preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own preferences" on public.preferences;
create policy "Users can update their own preferences"
  on public.preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own preferences" on public.preferences;
create policy "Users can delete their own preferences"
  on public.preferences for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.preferences from anon;
grant select, insert, update, delete on public.preferences to authenticated;

-- public.saved_recipes
alter table public.saved_recipes enable row level security;
drop policy if exists "Users can read their own saved recipes" on public.saved_recipes;
create policy "Users can read their own saved recipes"
  on public.saved_recipes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own saved recipes" on public.saved_recipes;
create policy "Users can create their own saved recipes"
  on public.saved_recipes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own saved recipes" on public.saved_recipes;
create policy "Users can update their own saved recipes"
  on public.saved_recipes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own saved recipes" on public.saved_recipes;
create policy "Users can delete their own saved recipes"
  on public.saved_recipes for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.saved_recipes from anon;
grant select, insert, update, delete on public.saved_recipes to authenticated;

-- public.shopping_list
alter table public.shopping_list enable row level security;
drop policy if exists "Users can read their own shopping list" on public.shopping_list;
create policy "Users can read their own shopping list"
  on public.shopping_list for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own shopping list" on public.shopping_list;
create policy "Users can create their own shopping list"
  on public.shopping_list for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own shopping list" on public.shopping_list;
create policy "Users can update their own shopping list"
  on public.shopping_list for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own shopping list" on public.shopping_list;
create policy "Users can delete their own shopping list"
  on public.shopping_list for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.shopping_list from anon;
grant select, insert, update, delete on public.shopping_list to authenticated;

-- public.user_ingredients
alter table public.user_ingredients enable row level security;
drop policy if exists "Users can read their own ingredients" on public.user_ingredients;
create policy "Users can read their own ingredients"
  on public.user_ingredients for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own ingredients" on public.user_ingredients;
create policy "Users can create their own ingredients"
  on public.user_ingredients for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own ingredients" on public.user_ingredients;
create policy "Users can update their own ingredients"
  on public.user_ingredients for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own ingredients" on public.user_ingredients;
create policy "Users can delete their own ingredients"
  on public.user_ingredients for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_ingredients from anon;
grant select, insert, update, delete on public.user_ingredients to authenticated;

-- =============================================================================
-- 5. Notify PostgREST to Reload Schema Cache
-- =============================================================================

notify pgrst, 'reload schema';

