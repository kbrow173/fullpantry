import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const body = await request.json();

  const { ingredients, instructions, ...recipeData } = body;

  // Insert recipe row
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert(recipeData)
    .select()
    .single();

  if (recipeError || !recipe) {
    return NextResponse.json(
      { error: recipeError?.message ?? "Failed to create recipe" },
      { status: 500 }
    );
  }

  // Insert ingredients — rollback (delete recipe) on failure
  if (Array.isArray(ingredients) && ingredients.length > 0) {
    const rows = ingredients.map(
      (ing: Record<string, unknown>, i: number) => ({
        ...ing,
        recipe_id: recipe.id,
        order_index: i,
      })
    );
    const { error: ingError } = await supabase
      .from("recipe_ingredients")
      .insert(rows);
    if (ingError) {
      await supabase.from("recipes").delete().eq("id", recipe.id);
      return NextResponse.json(
        { error: `Failed to save ingredients: ${ingError.message}` },
        { status: 500 }
      );
    }
  }

  // Insert instructions — rollback on failure
  if (Array.isArray(instructions) && instructions.length > 0) {
    const rows = instructions.map(
      (inst: Record<string, unknown>, i: number) => ({
        ...inst,
        recipe_id: recipe.id,
        step_number: i + 1,
      })
    );
    const { error: instError } = await supabase
      .from("recipe_instructions")
      .insert(rows);
    if (instError) {
      await supabase.from("recipes").delete().eq("id", recipe.id);
      return NextResponse.json(
        { error: `Failed to save instructions: ${instError.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(recipe, { status: 201 });
}
