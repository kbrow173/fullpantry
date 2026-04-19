import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RecipeCategory } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("recipes")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data ? `Edit — ${data.title}` : "Edit Recipe" };
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !recipe) notFound();

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

  const initialData = {
    id: recipe.id as string,
    title: recipe.title as string,
    description: recipe.description as string | null,
    category: recipe.category as RecipeCategory,
    servings: recipe.servings as number,
    prep_time: recipe.prep_time as number | null,
    cook_time: recipe.cook_time as number | null,
    source_url: recipe.source_url as string | null,
    image_url: recipe.image_url as string | null,
    tags: (recipe.tags as string[]) ?? [],
    ingredients: (ingredients ?? []).map((i: Record<string, unknown>) => ({
      id: i.id as string,
      name: i.name as string,
      quantity: i.quantity as number | null,
      unit: i.unit as string | null,
      notes: i.notes as string | null,
    })),
    instructions: (instructions ?? []).map((i: Record<string, unknown>) => ({
      id: i.id as string,
      step_number: i.step_number as number,
      instruction: i.instruction as string,
    })),
  };

  return (
    <PageShell>
      <PageHeader
        title="Edit Recipe"
        subtitle={recipe.title as string}
      />
      <RecipeForm initialData={initialData} />
    </PageShell>
  );
}
