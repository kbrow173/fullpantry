"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { MEAL_SLOTS, type MealSlot, type MealPlan } from "@/lib/types";
import { toISODate, formatWeekRange, getWeekStart } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WeekGridProps {
  weekDates: string[];
  weekStart: Date;
  selectedDay: string;
  mealsByDate: Record<string, Partial<Record<MealSlot, MealPlan>>>;
  onSelectDay: (date: string) => void;
  onNavigate: (dir: 1 | -1) => void;
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function WeekGrid({ weekDates, weekStart, selectedDay, mealsByDate, onSelectDay, onNavigate }: WeekGridProps) {
  const today = toISODate(new Date());
  return (
    <div className="mb-4">
      {/* Week nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onNavigate(-1)}
          className="p-1.5 rounded-lg text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs font-semibold tracking-wide text-fp-text-secondary">
          {formatWeekRange(weekStart)}
        </span>
        <button
          onClick={() => onNavigate(1)}
          className="p-1.5 rounded-lg text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors"
          aria-label="Next week"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-0.5 bg-fp-surface rounded-2xl border border-fp-border p-2">
        {weekDates.map((date, i) => {
          const isSelected = date === selectedDay;
          const isToday = date === today;
          const dayMeals = mealsByDate[date] ?? {};
          const filledSlots = MEAL_SLOTS.filter(s => dayMeals[s.value]);

          return (
            <button
              key={date}
              onClick={() => onSelectDay(date)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-xl transition-colors",
                isSelected ? "bg-fp-accent" : "hover:bg-fp-surface-2"
              )}
            >
              {/* Day letter */}
              <span className={cn(
                "text-[9px] font-bold tracking-widest uppercase",
                isSelected ? "text-white/70" : "text-fp-text-muted"
              )}>
                {DAY_LETTERS[i]}
              </span>

              {/* Date number */}
              <span className={cn(
                "text-sm font-bold leading-none w-7 h-7 flex items-center justify-center rounded-full",
                isSelected
                  ? "text-white"
                  : isToday
                  ? "text-fp-accent"
                  : "text-fp-text"
              )}>
                {new Date(date + "T00:00:00").getDate()}
              </span>

              {/* Slot dots */}
              <div className="flex gap-0.5">
                {MEAL_SLOTS.map((s) => {
                  const filled = !!dayMeals[s.value];
                  return (
                    <div
                      key={s.value}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        filled
                          ? isSelected ? "bg-white/80" : "bg-fp-accent"
                          : isSelected ? "bg-white/20" : "bg-fp-border"
                      )}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
