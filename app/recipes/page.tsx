import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ChefHat } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { ImportButton } from "@/components/recipes/ImportButton";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Recipe } from "@/lib/types";

export const metadata: Metadata = {
  title: "Recipes",
};

export default async function RecipesPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  const recipes = (data ?? []) as Recipe[];

  return (
    <PageShell>
      <PageHeader
        title="Recipes"
        subtitle="Your kitchen collection"
        action={
          recipes.length > 0 ? (
            <div className="flex items-center gap-2">
              <ImportButton variant="button" />
              <Link href="/recipes/new">
                <Button size="sm" variant="primary">
                  <Plus size={15} />
                  Add Recipe
                </Button>
              </Link>
            </div>
          ) : undefined
        }
      />

      {recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Nothing cooking yet."
          description="Add your first recipe to start building your collection."
          action={
            <div className="flex items-center gap-4">
              <Link href="/recipes/new">
                <Button variant="primary" size="md">
                  <Plus size={15} />
                  Add Recipe
                </Button>
              </Link>
              <span className="text-fp-text-muted text-sm">or</span>
              <ImportButton variant="link" />
            </div>
          }
        />
      ) : (
        <RecipeGrid initialRecipes={recipes} />
      )}
    </PageShell>
  );
}
