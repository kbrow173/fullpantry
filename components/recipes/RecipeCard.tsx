import Link from "next/link";
import Image from "next/image";
import { Clock, Heart } from "lucide-react";
import { type Recipe, RECIPE_CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteToggle?: (id: string, current: boolean) => void;
}

export function RecipeCard({ recipe, onFavoriteToggle }: RecipeCardProps) {
  const time =
    recipe.total_time ??
    (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0);

  return (
    <Link href={`/recipes/${recipe.id}`} className="group block">
      <article className="card-hover bg-fp-surface rounded-xl overflow-hidden border border-fp-border hover:border-fp-border-strong transition-colors duration-150">
        {/* Image area */}
        <div className="relative aspect-[4/3] bg-fp-surface-2 overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-20">🍳</span>
            </div>
          )}

          {/* Favorite button */}
          {onFavoriteToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavoriteToggle(recipe.id, recipe.is_favorite);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
              aria-label={recipe.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={13}
                className={cn(
                  recipe.is_favorite
                    ? "fill-fp-accent text-fp-accent"
                    : "text-fp-text-muted"
                )}
              />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-fp-text-muted mb-1">
            {RECIPE_CATEGORIES.find(c => c.value === recipe.category)?.label ?? recipe.category}
          </p>
          <h3 className="font-display font-bold text-fp-text text-[14px] leading-snug line-clamp-2 mb-2">
            {recipe.title}
          </h3>
          {time > 0 && (
            <div className="flex items-center gap-1 text-fp-text-muted text-xs">
              <Clock size={11} strokeWidth={1.5} />
              <span>{time} min</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
