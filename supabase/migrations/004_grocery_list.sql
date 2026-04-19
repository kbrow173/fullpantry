-- FullPantry Phase 5: Grocery Lists
-- Run manually in Supabase SQL Editor

create table if not exists grocery_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  week_start_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists grocery_lists_created_at_idx on grocery_lists (created_at desc);

create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references grocery_lists(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  category text not null default 'other',
  is_checked boolean not null default false,
  source_recipe_id uuid references recipes(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists grocery_items_list_idx on grocery_items (grocery_list_id);

alter table grocery_lists disable row level security;
alter table grocery_items disable row level security;
