import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { suggestMealPlan } from "@/lib/gemini";
import type { MealPlan, Recipe, MealSlot } from "@/lib/types";

const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

export async function POST(request: Request) {
  let body: { weekStart?: string };
  try { body = await request.json() as { weekStart?: string }; }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  if (!body.weekStart) {
    return NextResponse.json({ error: "weekStart required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const weekStart = body.weekStart;

  // Build 7 date strings for the week
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    weekDates.push(`${y}-${m}-${dd}`);
  }
  const weekEnd = weekDates[6];

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Fetch existing plans
  const { data: existingPlans } = await supabase
    .from("meal_plans")
    .select("date, meal_slot")
    .gte("date", weekStart)
    .lte("date", weekEnd);

  const filledSlots = new Set(
    (existingPlans ?? []).map((p) => `${p.date}:${p.meal_slot}`)
  );

  // Compute empty slots (B/L/D only)
  const emptySlots: { date: string; dayName: string; slot: string }[] = [];
  for (const date of weekDates) {
    const dayOfWeek = new Date(date + "T00:00:00").getDay();
    const dayName = dayNames[dayOfWeek];
    for (const slot of MEAL_SLOTS) {
      if (!filledSlots.has(`${date}:${slot}`)) {
        emptySlots.push({ date, dayName, slot });
      }
    }
  }

  if (emptySlots.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch all recipes
  const { data: recipesData } = await supabase
    .from("recipes")
    .select("id, title, category, tags, description, servings")
    .order("created_at", { ascending: false });

  const allRecipes = (recipesData ?? []) as (Recipe & { servings: number })[];
  if (allRecipes.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch pantry names
  const { data: pantryData } = await supabase.from("pantry_items").select("name");
  const pantryNames = (pantryData ?? []).map((p) => p.name as string);

  // Call Gemini
  const suggestions = await suggestMealPlan(emptySlots, allRecipes, pantryNames);

  // Enrich with full recipe objects
  const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));
  const result = suggestions
    .map((s) => {
      const recipe = recipeMap.get(s.recipe_id);
      if (!recipe) return null;
      return { date: s.date, slot: s.slot, recipe_id: s.recipe_id, recipe, servings: recipe.servings };
    })
    .filter(Boolean);

  return NextResponse.json(result);
}
