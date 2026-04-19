-- FullPantry Phase 3: Pantry
-- Run in Supabase Dashboard → SQL Editor

create table if not exists pantry_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  quantity      numeric not null default 1,
  unit          text not null default '',
  category      text not null default 'other',
  purchased_date date,
  expiry_date   date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast category grouping
create index if not exists pantry_items_category_idx on pantry_items (category);

-- Reuse updated_at trigger function from migration 001
create trigger pantry_items_updated_at
  before update on pantry_items
  for each row execute function update_updated_at_column();

-- Disable RLS for single-user MVP (same as recipes)
alter table pantry_items disable row level security;
