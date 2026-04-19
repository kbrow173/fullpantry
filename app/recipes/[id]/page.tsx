import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { RecipeDetail } from "@/components/recipes/RecipeDetail";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Recipe, RecipeIngredient, RecipeInstruction } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("recipes")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data?.title ?? "Recipe" };
}

export default async function RecipePage({ params }: Props) {
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

  return (
    <PageShell>
      {/* Back link */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fp-text-secondary hover:text-fp-accent mb-6 transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        All Recipes
      </Link>

      <RecipeDetail
        recipe={recipe as Recipe}
        ingredients={(ingredients ?? []) as RecipeIngredient[]}
        instructions={(instructions ?? []) as RecipeInstruction[]}
      />
    </PageShell>
  );
}
