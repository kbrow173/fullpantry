"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { type Recipe, type RecipeCategory, RECIPE_CATEGORIES } from "@/lib/types";
import { RecipeCard } from "./RecipeCard";
import { cn } from "@/lib/utils";

interface RecipeGridProps {
  initialRecipes: Recipe[];
}

type Filter = RecipeCategory | "all";

export function RecipeGrid({ initialRecipes }: RecipeGridProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [canMakeActive, setCanMakeActive] = useState(false);
  const [canMakeData, setCanMakeData] = useState<{ id: string; status: "can-make" | "missing-few"; missing: string[] }[] | null>(null);
  const [canMakeLoading, setCanMakeLoading] = useState(false);

  async function handleCanMakeToggle() {
    const next = !canMakeActive;
    setCanMakeActive(next);
    if (next && canMakeData === null) {
      setCanMakeLoading(true);
      try {
        const res = await fetch("/api/recipes/can-make");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json() as { id: string; status: "can-make" | "missing-few"; missing: string[] }[];
        setCanMakeData(data);
      } catch {
        setCanMakeData([]);
      } finally {
        setCanMakeLoading(false);
      }
    }
  }

  const filtered = useMemo(() => {
    let base = recipes.filter((r) => {
      const matchesSearch =
        search === "" ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter =
        activeFilter === "all" || r.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
    if (canMakeActive && canMakeData !== null) {
      const canMakeIds = new Set(canMakeData.map((c) => c.id));
      base = base.filter((r) => canMakeIds.has(r.id));
    }
    return base;
  }, [recipes, search, activeFilter, canMakeActive, canMakeData]);

  async function handleFavoriteToggle(id: string, current: boolean) {
    // Optimistic update
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_favorite: !current } : r))
    );
    try {
      await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !current }),
      });
    } catch {
      // Revert on failure
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_favorite: current } : r))
      );
    }
  }

  const noResults = filtered.length === 0;
  const isFiltering = search !== "" || activeFilter !== "all";

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-fp-text-muted pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 bg-fp-surface border border-fp-border rounded-lg text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fp-text-muted hover:text-fp-text"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none -mx-1 px-1">
        <button
          onClick={handleCanMakeToggle}
          className={cn(
            "flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors",
            canMakeActive
              ? "bg-fp-accent text-white"
              : "bg-fp-surface border border-fp-border text-fp-text-secondary hover:border-fp-border-strong"
          )}
        >
          {canMakeLoading ? (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>✨</span>
          )}
          Can Make
        </button>
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors",
            activeFilter === "all"
              ? "bg-fp-accent text-white"
              : "bg-fp-surface border border-fp-border text-fp-text-secondary hover:border-fp-border-strong"
          )}
        >
          All
        </button>
        {RECIPE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveFilter(cat.value)}
            className={cn(
              "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors",
              activeFilter === cat.value
                ? "bg-fp-accent text-white"
                : "bg-fp-surface border border-fp-border text-fp-text-secondary hover:border-fp-border-strong"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {canMakeActive && !canMakeLoading && (
        <p className="text-xs text-fp-text-muted mb-4 -mt-2">
          Showing recipes you can cook with your pantry
        </p>
      )}

      {/* Grid or empty state */}
      {noResults ? (
        <div className="py-12 text-center">
          <p className="text-fp-text-muted text-sm">
            {isFiltering
              ? "No recipes match your search."
              : "No recipes yet."}
          </p>
          {isFiltering && (
            <button
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
              className="mt-2 text-xs text-fp-accent hover:underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 stagger">
          {filtered.map((recipe) => (
            <div key={recipe.id} className="relative">
              {canMakeActive && (() => {
                const info = canMakeData?.find((c) => c.id === recipe.id);
                if (!info) return null;
                return (
                  <span className={cn(
                    "absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none",
                    info.status === "can-make"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  )}>
                    {info.status === "can-make" ? "✓ Ready" : `Missing ${info.missing.length}`}
                  </span>
                );
              })()}
              <RecipeCard recipe={recipe} onFavoriteToggle={handleFavoriteToggle} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
