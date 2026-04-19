import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const [{ data: ingredients }, { data: instructions }] = await Promise.all([
    supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", id)
      .order("order_index"),
    supabase
      .from("recipe_instructions")
      .select("*")
      .eq("recipe_id", id)
      .order("step_number"),
  ]);

  return NextResponse.json({
    ...recipe,
    ingredients: ingredients ?? [],
    instructions: instructions ?? [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Params }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { ingredients, instructions, ...recipeData } = body;

  // Update recipe metadata
  if (Object.keys(recipeData).length > 0) {
    const { error } = await supabase
      .from("recipes")
      .update(recipeData)
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Replace ingredients only when explicitly provided
  if ("ingredients" in body) {
    // Fetch existing rows as backup (no transactions in supabase-js)
    const { data: existingIngredients } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", id)
      .order("order_index");

    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const rows = ingredients.map(
        (ing: Record<string, unknown>, i: number) => ({
          ...ing,
          recipe_id: id,
          order_index: i,
        })
      );
      const { error } = await supabase.from("recipe_ingredients").insert(rows);
      if (error) {
        // Attempt to restore backup on failure
        if (existingIngredients && existingIngredients.length > 0) {
          await supabase.from("recipe_ingredients").insert(existingIngredients);
        }
        return NextResponse.json(
          { error: `Failed to save ingredients: ${error.message}` },
          { status: 500 }
        );
      }
    }
  }

  // Replace instructions only when explicitly provided
  if ("instructions" in body) {
    // Fetch existing rows as backup
    const { data: existingInstructions } = await supabase
      .from("recipe_instructions")
      .select("*")
      .eq("recipe_id", id)
      .order("step_number");

    await supabase.from("recipe_instructions").delete().eq("recipe_id", id);

    if (Array.isArray(instructions) && instructions.length > 0) {
      const rows = instructions.map(
        (inst: Record<string, unknown>, i: number) => ({
          ...inst,
          recipe_id: id,
          step_number: i + 1,
        })
      );
      const { error } = await supabase
        .from("recipe_instructions")
        .insert(rows);
      if (error) {
        // Attempt to restore backup on failure
        if (existingInstructions && existingInstructions.length > 0) {
          await supabase.from("recipe_instructions").insert(existingInstructions);
        }
        return NextResponse.json(
          { error: `Failed to save instructions: ${error.message}` },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/recipes");
  return NextResponse.json({ success: true });
}
