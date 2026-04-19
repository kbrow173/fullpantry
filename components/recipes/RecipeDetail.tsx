"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, ChefHat, ExternalLink, Edit2, Trash2, Heart } from "lucide-react";
import { type Recipe, type RecipeIngredient, type RecipeInstruction, RECIPE_CATEGORIES } from "@/lib/types";
import { ServingAdjuster } from "./ServingAdjuster";
import { IngredientList } from "./IngredientList";
import { InstructionSteps } from "./InstructionSteps";
import { cn } from "@/lib/utils";

interface RecipeDetailProps {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
}

export function RecipeDetail({
  recipe,
  ingredients,
  instructions,
}: RecipeDetailProps) {
  const router = useRouter();
  const [desiredServings, setDesiredServings] = useState(recipe.servings);
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const categoryLabel =
    RECIPE_CATEGORIES.find((c) => c.value === recipe.category)?.label ??
    recipe.category;

  const totalTime =
    recipe.total_time ??
    (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);

  // ─── Favorite toggle ────────────────────────────

  async function toggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next); // optimistic
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: next }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      setIsFavorite(!next); // revert on failure
    }
  }

  // ─── Delete ─────────────────────────────────────

  async function handleDelete() {
    if (!confirm("Delete this recipe? This cannot be undone.")) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/recipes");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError((data as { error?: string }).error ?? "Failed to delete recipe.");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article>
      {/* ── Delete error ── */}
      {deleteError && (
        <p className="mb-4 text-sm text-fp-error bg-fp-error-bg rounded-lg px-4 py-3">
          {deleteError}
        </p>
      )}

      {/* ── Hero image ── */}
      {recipe.image_url && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-fp-surface-2 -mx-4 md:mx-0">
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 672px) 100vw, 672px"
          />
        </div>
      )}

      {/* ── Title & meta row ── */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-fp-text-muted mb-1.5">
            {categoryLabel}
          </p>
          <h1 className="font-display font-bold text-3xl text-fp-text leading-tight tracking-tight">
            {recipe.title}
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          <button
            onClick={toggleFavorite}
            className={cn(
              "p-2 rounded-full border transition-colors",
              isFavorite
                ? "bg-fp-accent-bg border-fp-accent-border text-fp-accent"
                : "border-fp-border text-fp-text-muted hover:border-fp-border-strong"
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={15}
              className={cn(isFavorite && "fill-fp-accent")}
            />
          </button>
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="p-2 rounded-full border border-fp-border text-fp-text-muted hover:border-fp-border-strong transition-colors"
            aria-label="Edit recipe"
          >
            <Edit2 size={15} />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-full border border-fp-border text-fp-text-muted hover:border-fp-border-strong hover:text-fp-error disabled:opacity-50 transition-colors"
            aria-label="Delete recipe"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Description ── */}
      {recipe.description && (
        <p className="text-fp-text-secondary text-[15px] leading-relaxed mb-5">
          {recipe.description}
        </p>
      )}

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-6 py-4 border-y border-fp-border mb-6">
        {recipe.prep_time ? (
          <div className="text-center">
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-fp-text-muted mb-0.5">
              Prep
            </p>
            <p className="font-semibold text-fp-text text-sm">{recipe.prep_time} min</p>
          </div>
        ) : null}
        {recipe.cook_time ? (
          <div className="text-center">
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-fp-text-muted mb-0.5">
              Cook
            </p>
            <p className="font-semibold text-fp-text text-sm">{recipe.cook_time} min</p>
          </div>
        ) : null}
        {totalTime > 0 && (
          <div className="text-center flex items-center gap-1.5">
            <Clock size={13} className="text-fp-text-muted" strokeWidth={1.5} />
            <p className="font-semibold text-fp-text text-sm">{totalTime} min total</p>
          </div>
        )}
        <div className="ml-auto">
          <ServingAdjuster
            originalServings={recipe.servings}
            onChange={setDesiredServings}
          />
        </div>
      </div>

      {/* ── Ingredients ── */}
      {ingredients.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display font-bold text-xl text-fp-text italic">
              Ingredients
            </h2>
            <div className="flex-1 h-px bg-fp-border" />
          </div>
          <IngredientList
            ingredients={ingredients}
            originalServings={recipe.servings}
            desiredServings={desiredServings}
          />
        </section>
      )}

      {/* ── Instructions ── */}
      {instructions.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display font-bold text-xl text-fp-text italic">
              Instructions
            </h2>
            <div className="flex-1 h-px bg-fp-border" />
          </div>
          <InstructionSteps instructions={instructions} />
        </section>
      )}

      {/* ── Tags ── */}
      {recipe.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-fp-surface-2 text-fp-text-secondary text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Source link ── */}
      {recipe.source_url && (
        <a
          href={recipe.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-fp-text-muted hover:text-fp-accent transition-colors"
        >
          <ExternalLink size={12} />
          Original source
        </a>
      )}
    </article>
  );
}
