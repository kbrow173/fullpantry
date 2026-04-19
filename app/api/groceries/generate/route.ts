import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aggregateIngredients, subtractPantry, categorizeIngredient } from "@/lib/grocery";
import { categorizeGroceryItems } from "@/lib/gemini";
import type { RecipeIngredient, PantryItem } from "@/lib/types";
import { toISODate } from "@/lib/utils";

export async function POST() {
  const supabase = createAdminClient();

  // Next 7 days
  const today = new Date();
  const weekStart = toISODate(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = toISODate(weekEnd);

  // Fetch meal plans for next 7 days with recipe ingredients
  const { data: plans, error: plansErr } = await supabase
    .from("meal_plans")
    .select("*, recipe:recipes(id, servings, ingredients:recipe_ingredients(*))")
    .gte("date", weekStart)
    .lte("date", weekEndStr)
    .not("recipe_id", "is", null);

  if (plansErr) return NextResponse.json({ error: plansErr.message }, { status: 500 });

  // Fetch pantry
  const { data: pantry, error: pantryErr } = await supabase
    .from("pantry_items")
    .select("*");

  if (pantryErr) return NextResponse.json({ error: pantryErr.message }, { status: 500 });

  // Build flat list of ingredients scaled to planned servings
  type IngWithMeta = RecipeIngredient & { recipe_id: string; plan_servings: number; recipe_servings: number };
  const allIngredients: IngWithMeta[] = [];

  for (const plan of plans ?? []) {
    const recipe = plan.recipe as { id: string; servings: number; ingredients: RecipeIngredient[] } | null;
    if (!recipe?.ingredients?.length) continue;
    for (const ing of recipe.ingredients) {
      allIngredients.push({
        ...ing,
        recipe_id: recipe.id,
        plan_servings: plan.servings,
        recipe_servings: recipe.servings,
      });
    }
  }

  // Aggregate and subtract pantry
  const aggregated = aggregateIngredients(allIngredients);
  const needed = subtractPantry(aggregated, (pantry ?? []) as PantryItem[]);

  // Use Gemini to re-categorize any items that fell to "other"
  const otherItems = needed.filter((i) => i.category === "other");
  if (otherItems.length > 0) {
    const remap = await categorizeGroceryItems(otherItems.map((i) => i.name));
    for (const item of needed) {
      if (item.category === "other" && remap[item.name]) {
        item.category = remap[item.name] as import("@/lib/types").GroceryCategory;
      }
    }
  }

  // Enforce 3-list cap — delete oldest if already at 3
  const { data: existingLists } = await supabase
    .from("grocery_lists")
    .select("id, week_start_date, created_at")
    .order("created_at", { ascending: true });

  if (existingLists && existingLists.length >= 3) {
    // Check if one matches this week — overwrite it
    const sameWeek = existingLists.find((l) => l.week_start_date === weekStart);
    if (sameWeek) {
      await supabase.from("grocery_lists").delete().eq("id", sameWeek.id);
    } else {
      // Delete oldest
      await supabase.from("grocery_lists").delete().eq("id", existingLists[0].id);
    }
  } else {
    // Still check if same-week list exists and overwrite it
    const sameWeek = existingLists?.find((l) => l.week_start_date === weekStart);
    if (sameWeek) {
      await supabase.from("grocery_lists").delete().eq("id", sameWeek.id);
    }
  }

  // Format week label
  const endDate = new Date(weekEnd);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const listName = `${fmt(today)} – ${fmt(endDate)}`;

  // Create new list
  const { data: newList, error: listErr } = await supabase
    .from("grocery_lists")
    .insert({ name: listName, week_start_date: weekStart, is_active: true })
    .select()
    .single();

  if (listErr || !newList) return NextResponse.json({ error: listErr?.message ?? "Failed to create list" }, { status: 500 });

  // Insert items
  if (needed.length > 0) {
    const rows = needed.map((item) => ({
      grocery_list_id: newList.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      is_checked: false,
      source_recipe_id: item.sourceRecipeId,
      notes: null,
    }));
    await supabase.from("grocery_items").insert(rows);
  }

  // Return full list with items
  const { data: full, error: fullErr } = await supabase
    .from("grocery_lists")
    .select("*, items:grocery_items(*)")
    .eq("id", newList.id)
    .single();

  if (fullErr) return NextResponse.json({ error: fullErr.message }, { status: 500 });
  return NextResponse.json(full, { status: 201 });
}
