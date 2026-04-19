-- FullPantry Phase 1: Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ─── recipes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT          NOT NULL,
  description   TEXT,
  servings      INTEGER       NOT NULL DEFAULT 4,
  prep_time     INTEGER,
  cook_time     INTEGER,
  total_time    INTEGER,
  source_url    TEXT,
  image_url     TEXT,
  category      TEXT          NOT NULL DEFAULT 'dinner',
  tags          TEXT[]        DEFAULT '{}',
  is_favorite   BOOLEAN       DEFAULT FALSE,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── recipe_ingredients ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id          UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id   UUID      NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name        TEXT      NOT NULL,
  quantity    DECIMAL(10, 3),
  unit        TEXT,
  notes       TEXT,
  category    TEXT,
  order_index INTEGER   NOT NULL DEFAULT 0
);

-- ─── recipe_instructions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_instructions (
  id           UUID     DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id    UUID     NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number  INTEGER  NOT NULL,
  instruction  TEXT     NOT NULL
);

-- ─── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_instructions_recipe_id ON recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(is_favorite);

-- ─── updated_at trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS disabled for Phase 1 (single user, no auth yet) ──────────────────

ALTER TABLE recipes              DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients   DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_instructions  DISABLE ROW LEVEL SECURITY;
