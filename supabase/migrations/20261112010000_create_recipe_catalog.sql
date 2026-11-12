create table public.regions (
  id text primary key,
  name text not null unique
);

create table public.cuisines (
  id text primary key,
  name text not null unique,
  region_id text not null references public.regions (id)
);

create table public.ingredients (
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

create table public.nutrition_per_ingredient (
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

create table public.recipes (
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

create table public.recipe_ingredients (
  recipe_id text not null references public.recipes (id) on delete cascade,
  ingredient_id text not null references public.ingredients (id),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit text not null check (unit in ('g', 'kg', 'ml', 'l', 'piece')),
  is_optional boolean not null default false,
  primary key (recipe_id, ingredient_id)
);

create table public.recipe_steps (
  recipe_id text not null references public.recipes (id) on delete cascade,
  step_number smallint not null check (step_number between 1 and 10),
  instruction text not null,
  primary key (recipe_id, step_number)
);

create table public.tags (
  id text primary key,
  name text not null unique
);

create table public.recipe_tags (
  recipe_id text not null references public.recipes (id) on delete cascade,
  tag_id text not null references public.tags (id) on delete cascade,
  primary key (recipe_id, tag_id)
);

create index recipes_meal_cuisine_idx on public.recipes (meal_type, cuisine_id);
create index recipes_diet_type_idx on public.recipes (diet_type);
create index recipes_difficulty_idx on public.recipes (difficulty);
create index recipes_cost_per_serving_idx on public.recipes (cost_per_serving_inr);
create index recipes_total_time_idx on public.recipes ((prep_minutes + cook_minutes));
create index recipe_ingredients_ingredient_idx on public.recipe_ingredients (ingredient_id);
create index recipe_tags_tag_idx on public.recipe_tags (tag_id);
create index ingredients_category_name_idx on public.ingredients (category, name);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy catalog_read on public.%I for select to anon, authenticated using (true)',
      table_name
    );
    execute format('grant select on public.%I to anon, authenticated', table_name);
  end loop;
end;
$$;

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

grant select on public.recipe_nutrition to anon, authenticated;

notify pgrst, 'reload schema';
