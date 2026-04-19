"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, ChevronLeft, Search, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { MEAL_SLOTS, RECIPE_CATEGORIES, type MealSlot, type Recipe, type MealPlan, type RecipeCategory } from "@/lib/types";
import { formatFullDay, formatMonthDay } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RecipePickerScreenProps {
  date: string;
  slot: MealSlot;
  recipes: Recipe[];
  existingPlan?: MealPlan;
  onSave: (plan: MealPlan) => void;
  onClose: () => void;
}

const CATEGORY_EMOJI: Record<RecipeCategory, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🍎",
  dessert: "🍰",
  appetizer: "🧆",
  "side-dish": "🥦",
  drink: "🥤",
  "sauce-dressing": "🫙",
};

export function RecipePickerScreen({ date, slot, recipes, existingPlan, onSave, onClose }: RecipePickerScreenProps) {
  const slotMeta = MEAL_SLOTS.find((s) => s.value === slot)!;
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<RecipeCategory | "all">("all");
  const [confirming, setConfirming] = useState<Recipe | null>(null);
  const [customMeal, setCustomMeal] = useState("");
  const [servings, setServings] = useState(existingPlan?.servings ?? 1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!confirming) return;
    // Preserve existing plan servings if editing the same recipe
    const preserved = existingPlan?.recipe_id === confirming.id ? existingPlan.servings : null;
    setServings(preserved ?? confirming.servings ?? 1);
  }, [confirming]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r) => {
      const matchesSearch = !q || r.title.toLowerCase().includes(q);
      const matchesCat = categoryFilter === "all" || r.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [recipes, search, categoryFilter]);

  async function save(recipe: Recipe | null, customName: string | null, srv: number) {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          meal_slot: slot,
          recipe_id: recipe?.id ?? null,
          custom_meal_name: customName,
          servings: srv,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const saved = await res.json() as MealPlan;
      onSave(saved);
      onClose();
    } catch {
      setSaving(false);
      setSaveError(true);
    }
  }

  async function handleCustomSave() {
    const name = customMeal.trim();
    if (!name) return;
    await save(null, name, 1);
  }

  return (
    <div className="fixed inset-0 z-50 bg-fp-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-fp-border flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors"
          aria-label="Close"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-fp-text-muted">
            {slotMeta.icon} {slotMeta.label} · {formatFullDay(date)}, {formatMonthDay(date)}
          </p>
          <h2 className="font-serif text-xl font-semibold text-fp-text leading-tight">
            Choose a recipe
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fp-text-muted pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your recipes…"
            className="w-full pl-9 pr-4 py-2.5 bg-fp-surface-2 border border-fp-border rounded-xl text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto flex-shrink-0">
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
            categoryFilter === "all"
              ? "bg-fp-accent text-white border-fp-accent"
              : "bg-fp-surface-2 text-fp-text-secondary border-fp-border hover:border-fp-accent/40"
          )}
        >
          All
        </button>
        {RECIPE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
              categoryFilter === cat.value
                ? "bg-fp-accent text-white border-fp-accent"
                : "bg-fp-surface-2 text-fp-text-secondary border-fp-border hover:border-fp-accent/40"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-fp-text-muted text-center py-12">No recipes found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => setConfirming(recipe)}
                className="text-left rounded-2xl border border-fp-border bg-fp-surface overflow-hidden hover:border-fp-accent/40 hover:shadow-sm transition-all active:scale-[0.98]"
              >
                <div className="h-24 bg-fp-surface-2 flex items-center justify-center relative">
                  {recipe.image_url ? (
                    <Image
                      src={recipe.image_url}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  ) : (
                    <span className="text-4xl">{CATEGORY_EMOJI[recipe.category] ?? "🍽️"}</span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-fp-text line-clamp-2 leading-snug">{recipe.title}</p>
                  <p className="text-[10px] text-fp-text-muted mt-1 capitalize">{recipe.category.replace("-", " ")}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Custom meal */}
        <div className="mt-4 pt-4 border-t border-fp-border">
          <p className="text-xs font-semibold text-fp-text-secondary mb-2">Or add a custom meal</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customMeal}
              onChange={(e) => setCustomMeal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSave()}
              placeholder="Takeout, Leftovers, Meal prep…"
              className="flex-1 px-3 py-2.5 bg-fp-surface-2 border border-fp-border rounded-xl text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleCustomSave}
              loading={saving}
              disabled={!customMeal.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm panel (slide up when recipe selected) */}
      {confirming && (
        <>
          <div
            className="absolute inset-0 bg-black/30 z-10"
            onClick={() => setConfirming(null)}
          />
          <div className="absolute inset-x-0 bottom-0 z-20 bg-fp-surface rounded-t-3xl shadow-2xl ring-1 ring-fp-border px-5 py-6">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-fp-border" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-fp-text-muted mb-1">
              {slotMeta.icon} {slotMeta.label} · {formatMonthDay(date)}
            </p>
            <p className="font-serif text-lg font-semibold text-fp-text mb-5 line-clamp-2">
              {confirming.title}
            </p>

            {/* Servings stepper */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-fp-text-secondary">Servings</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-full border border-fp-border flex items-center justify-center text-fp-text hover:bg-fp-surface-2 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xl font-bold text-fp-text tabular-nums w-6 text-center">{servings}</span>
                <button
                  onClick={() => setServings((s) => Math.min(99, s + 1))}
                  className="w-9 h-9 rounded-full border border-fp-border flex items-center justify-center text-fp-text hover:bg-fp-surface-2 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {saveError && (
              <p className="text-xs text-fp-error text-center mb-3">
                Failed to save. Check your connection and try again.
              </p>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={() => save(confirming, null, servings)}
              loading={saving}
            >
              Add to plan
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
