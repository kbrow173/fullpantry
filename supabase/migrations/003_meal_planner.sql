-- FullPantry Phase 4: Meal Planner
-- Run in Supabase Dashboard → SQL Editor

create table if not exists meal_plans (
  id                uuid primary key default gen_random_uuid(),
  date              date not null,
  meal_slot         text not null check (meal_slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id         uuid references recipes(id) on delete set null,
  custom_meal_name  text,
  servings          integer not null default 1,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (date, meal_slot)
);

create index if not exists meal_plans_date_idx on meal_plans (date);

create trigger meal_plans_updated_at
  before update on meal_plans
  for each row execute function update_updated_at_column();

alter table meal_plans disable row level security;
