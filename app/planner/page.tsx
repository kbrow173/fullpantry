"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WeekGrid } from "@/components/planner/WeekGrid";
import { DayMeals } from "@/components/planner/DayMeals";
import { RecipePickerScreen } from "@/components/planner/RecipePickerScreen";
import { SuggestedMealsSheet } from "@/components/planner/SuggestedMealsSheet";
import { type MealSlot, type MealPlan, type Recipe } from "@/lib/types";
import { toISODate, getWeekStart } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type PickerTarget = { date: string; slot: MealSlot } | null;

function buildWeekDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

function buildMealsByDate(plans: MealPlan[]): Record<string, Partial<Record<MealSlot, MealPlan>>> {
  const map: Record<string, Partial<Record<MealSlot, MealPlan>>> = {};
  for (const plan of plans) {
    if (!map[plan.date]) map[plan.date] = {};
    map[plan.date][plan.meal_slot] = plan;
  }
  return map;
}

export default function PlannerPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedDay, setSelectedDay] = useState<string>(() => toISODate(new Date()));
  const [mealsByDate, setMealsByDate] = useState<Record<string, Partial<Record<MealSlot, MealPlan>>>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [loading, setLoading] = useState(true);
  const [showSuggest, setShowSuggest] = useState(false);

  const weekDates = buildWeekDates(weekStart);

  const existingMealIds = useMemo(() => {
    const ids: string[] = [];
    for (const day of Object.values(mealsByDate)) {
      for (const meal of Object.values(day)) {
        if (meal?.recipe_id) ids.push(meal.recipe_id);
      }
    }
    return new Set(ids);
  }, [mealsByDate]);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data: unknown) => setRecipes(Array.isArray(data) ? (data as Recipe[]) : []))
      .catch(() => {});
  }, []);

  const fetchPlans = useCallback(() => {
    setLoading(true);
    fetch(`/api/planner?week=${toISODate(weekStart)}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        setMealsByDate(buildMealsByDate(Array.isArray(data) ? (data as MealPlan[]) : []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  function navigateWeek(dir: 1 | -1) {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dir * 7);
      return next;
    });
  }

  function handleMealSaved(plan: MealPlan) {
    setMealsByDate((prev) => ({
      ...prev,
      [plan.date]: {
        ...(prev[plan.date] ?? {}),
        [plan.meal_slot]: plan,
      },
    }));
  }

  async function handleMealDeleted(id: string) {
    // Snapshot before optimistic removal so we can restore on failure
    const snapshot = mealsByDate;
    setMealsByDate((prev) => {
      const next = { ...prev };
      for (const date of Object.keys(next)) {
        const day = { ...next[date] };
        for (const slot of Object.keys(day) as MealSlot[]) {
          if (day[slot]?.id === id) {
            delete day[slot];
          }
        }
        next[date] = day;
      }
      return next;
    });
    try {
      const res = await fetch(`/api/planner/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setMealsByDate(snapshot);
    }
  }

  const dayMeals = mealsByDate[selectedDay] ?? {};

  const existingPlan = pickerTarget
    ? mealsByDate[pickerTarget.date]?.[pickerTarget.slot]
    : undefined;

  return (
    <div className="min-h-screen bg-fp-bg pb-32">
      <PageHeader title="Meal Planner" />

      <div className="px-4 pt-2 pb-1">
        <button
          onClick={() => setShowSuggest(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-fp-accent hover:text-fp-accent/80 transition-colors"
        >
          <Sparkles size={13} />
          Suggest meals for empty slots
        </button>
      </div>

      <div className="px-4 pt-4">
        <WeekGrid
          weekDates={weekDates}
          weekStart={weekStart}
          selectedDay={selectedDay}
          mealsByDate={mealsByDate}
          onSelectDay={setSelectedDay}
          onNavigate={navigateWeek}
        />

        {loading ? (
          <div className="space-y-2 mt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-fp-surface-2 animate-pulse" />
            ))}
          </div>
        ) : (
          <DayMeals
            date={selectedDay}
            meals={dayMeals}
            onAdd={(slot) => setPickerTarget({ date: selectedDay, slot })}
            onEdit={(slot) => setPickerTarget({ date: selectedDay, slot })}
            onDelete={handleMealDeleted}
          />
        )}
      </div>

      {pickerTarget && (
        <RecipePickerScreen
          date={pickerTarget.date}
          slot={pickerTarget.slot}
          recipes={recipes}
          existingPlan={existingPlan}
          onSave={handleMealSaved}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {showSuggest && (
        <SuggestedMealsSheet
          weekStart={toISODate(weekStart)}
          onSave={(plans) => {
            plans.forEach(handleMealSaved);
            setShowSuggest(false);
          }}
          onClose={() => setShowSuggest(false)}
        />
      )}
    </div>
  );
}
