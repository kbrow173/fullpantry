"use client";

import { Plus, X } from "lucide-react";
import type { MealPlan, MealSlot } from "@/lib/types";
import { MEAL_SLOTS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MealSlotCardProps {
  slot: MealSlot;
  plan: MealPlan | null;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MealSlotCard({ slot, plan, onAdd, onEdit, onDelete }: MealSlotCardProps) {
  const meta = MEAL_SLOTS.find((s) => s.value === slot)!;

  if (!plan) {
    return (
      <button
        onClick={onAdd}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-fp-border bg-fp-surface hover:border-fp-accent/40 hover:bg-fp-surface-2 transition-colors group"
      >
        <span className="text-xl leading-none">{meta.icon}</span>
        <div className="flex-1 text-left">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-fp-text-muted">
            {meta.label}
          </p>
          <p className="text-sm text-fp-accent font-semibold mt-0.5">+ Add meal</p>
        </div>
      </button>
    );
  }

  const name = plan.recipe?.title ?? plan.custom_meal_name ?? "Meal";
  const isRecipe = !!plan.recipe;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-fp-accent/20 bg-fp-accent-bg group">
      <span className="text-xl leading-none flex-shrink-0">{meta.icon}</span>
      <button onClick={onEdit} className="flex-1 text-left min-w-0">
        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-fp-accent/70">
          {meta.label}
        </p>
        <p className="text-sm font-semibold text-fp-text truncate mt-0.5">{name}</p>
        {plan.servings > 1 && (
          <p className="text-[11px] text-fp-text-muted mt-0.5">
            {plan.servings} servings
          </p>
        )}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 p-1.5 rounded-lg text-fp-text-muted hover:text-fp-error hover:bg-fp-error-bg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Remove meal"
      >
        <X size={14} />
      </button>
    </div>
  );
}
