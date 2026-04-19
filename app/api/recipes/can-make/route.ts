import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Recipe, RecipeIngredient, PantryItem } from "@/lib/types";

function normalizeName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/,.*$/, "")
    .replace(/^[\d\s½¼¾⅓⅔⅛⅜⅝⅞.,()–-]+\s*(teaspoons?|tablespoons?|tsps?|tbsps?|cups?|ounces?|oz|pounds?|lbs?|grams?|kg|ml|liters?|litres?|l|cans?|slices?|pieces?)\s+/i, "")
    .replace(/\b(table|sea|kosher|fine|coarse|freshly|dried|ground|whole|crushed|raw|salted|unsalted|packed|large|medium|small|grated|sliced|diced|minced|chopped|peeled|seeded)\b\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const supabase = createAdminClient();

  const [{ data: recipesData }, { data: pantryData }] = await Promise.all([
    supabase.from("recipes").select("*, ingredients:recipe_ingredients(*)").order("created_at", { ascending: false }),
    supabase.from("pantry_items").select("*"),
  ]);

  const recipes = (recipesData ?? []) as (Recipe & { ingredients: RecipeIngredient[] })[];
  const pantry = (pantryData ?? []) as PantryItem[];

  const pantryKeys = new Set(pantry.map((p) => normalizeName(p.name)));

  const results: {
    id: string; title: string; description: string | null; category: string;
    image_url: string | null; tags: string[]; is_favorite: boolean;
    created_at: string; updated_at: string; servings: number;
    status: "can-make" | "missing-few"; missing: string[];
  }[] = [];

  for (const recipe of recipes) {
    const ingredients = recipe.ingredients ?? [];
    if (ingredients.length === 0) continue;

    const missing: string[] = [];
    for (const ing of ingredients) {
      const key = normalizeName(ing.name);
      if (!pantryKeys.has(key)) {
        missing.push(ing.name);
      }
    }

    if (missing.length === 0) {
      results.push({ id: recipe.id, title: recipe.title, description: recipe.description, category: recipe.category, image_url: recipe.image_url, tags: recipe.tags, is_favorite: recipe.is_favorite, created_at: recipe.created_at, updated_at: recipe.updated_at, servings: recipe.servings, status: "can-make", missing: [] });
    } else if (missing.length <= 2) {
      results.push({ id: recipe.id, title: recipe.title, description: recipe.description, category: recipe.category, image_url: recipe.image_url, tags: recipe.tags, is_favorite: recipe.is_favorite, created_at: recipe.created_at, updated_at: recipe.updated_at, servings: recipe.servings, status: "missing-few", missing });
    }
    // 3+ missing — skip
  }

  return NextResponse.json(results);
}
