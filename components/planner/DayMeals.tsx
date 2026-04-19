"use client";

import { MealSlotCard } from "@/components/planner/MealSlotCard";
import { MEAL_SLOTS, type MealSlot, type MealPlan } from "@/lib/types";
import { formatFullDay, formatMonthDay } from "@/lib/utils";

interface DayMealsProps {
  date: string;
  meals: Partial<Record<MealSlot, MealPlan>>;
  onAdd: (slot: MealSlot) => void;
  onEdit: (slot: MealSlot) => void;
  onDelete: (id: string) => void;
}

export function DayMeals({ date, meals, onAdd, onEdit, onDelete }: DayMealsProps) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-xs font-bold tracking-[0.12em] uppercase text-fp-text-muted">
          {formatFullDay(date)}
        </h3>
        <span className="text-xs text-fp-text-muted/60">{formatMonthDay(date)}</span>
      </div>

      <div className="space-y-2">
        {MEAL_SLOTS.map(({ value }) => (
          <MealSlotCard
            key={value}
            slot={value}
            plan={meals[value] ?? null}
            onAdd={() => onAdd(value)}
            onEdit={() => onEdit(value)}
            onDelete={() => {
              const plan = meals[value];
              if (plan) onDelete(plan.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
