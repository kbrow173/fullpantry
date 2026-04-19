import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MealSlot } from "@/lib/types";

export async function GET(req: NextRequest) {
  const week = new URL(req.url).searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week param required" }, { status: 400 });

  const weekEnd = new Date(week + "T00:00:00");
  weekEnd.setDate(weekEnd.getDate() + 6);
  const endDate = weekEnd.toISOString().split("T")[0];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*, recipe:recipes(id, title, image_url, category, prep_time, cook_time, servings)")
    .gte("date", week)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      date: string;
      meal_slot: MealSlot;
      recipe_id?: string | null;
      custom_meal_name?: string | null;
      servings?: number;
    };

    if (!body.date || !body.meal_slot) {
      return NextResponse.json({ error: "date and meal_slot required" }, { status: 400 });
    }
    if (!body.recipe_id && !body.custom_meal_name?.trim()) {
      return NextResponse.json({ error: "recipe_id or custom_meal_name required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("meal_plans")
      .upsert({
        date: body.date,
        meal_slot: body.meal_slot,
        recipe_id: body.recipe_id ?? null,
        custom_meal_name: body.custom_meal_name?.trim() ?? null,
        servings: body.servings ?? 1,
      }, { onConflict: "date,meal_slot" })
      .select("*, recipe:recipes(id, title, image_url, category, prep_time, cook_time, servings)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
