"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MealPlan, MealSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Suggestion {
  date: string;
  slot: string;
  recipe_id: string;
  servings: number;
  recipe: { id: string; title: string; category: string };
}

interface Props {
  weekStart: string;
  onSave: (plans: MealPlan[]) => void;
  onClose: () => void;
}

const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAY_NAMES[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

export function SuggestedMealsSheet({ weekStart, onSave, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  async function fetchSuggestions() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/planner/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as Suggestion[];
      setSuggestions(data);
      setAccepted(new Set(data.map((_, i) => i)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSuggestions(); }, [weekStart]);

  function toggle(i: number) {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleSave() {
    const toSave = suggestions.filter((_, i) => accepted.has(i));
    if (toSave.length === 0) return;
    setSaving(true);
    setSaveError(false);
    try {
      const results = await Promise.all(
        toSave.map((s) =>
          fetch("/api/planner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: s.date,
              meal_slot: s.slot as MealSlot,
              recipe_id: s.recipe_id,
              servings: s.servings ?? 2,
            }),
          }).then((r) => r.json() as Promise<MealPlan>)
        )
      );
      onSave(results);
    } catch {
      setSaving(false);
      setSaveError(true);
    }
  }

  const acceptedCount = accepted.size;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[55]" onClick={onClose} />
      <div className="animate-slide-up fixed inset-x-0 bottom-0 z-[60] bg-fp-surface rounded-t-3xl shadow-2xl ring-1 ring-fp-border px-5 pt-6 pb-20 max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-fp-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-fp-accent" />
            <p className="font-serif text-lg font-semibold text-fp-text">Suggested Meals</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-fp-surface-2 animate-pulse" />
              ))}
              <p className="text-xs text-fp-text-muted text-center pt-2">Asking AI for suggestions…</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-fp-text-muted mb-3">Couldn&apos;t generate suggestions.</p>
              <button onClick={fetchSuggestions} className="text-xs text-fp-accent hover:underline">Try again</button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-fp-text">Your week is fully planned!</p>
              <p className="text-xs text-fp-text-muted mt-1">No empty slots to fill.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                    accepted.has(i)
                      ? "bg-fp-accent/5 border-fp-accent/30"
                      : "bg-fp-surface-2 border-fp-border opacity-50"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    accepted.has(i)
                      ? "bg-fp-accent border-fp-accent"
                      : "border-fp-border"
                  )}>
                    {accepted.has(i) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-fp-text-muted">
                      {formatDate(s.date)} · {SLOT_LABELS[s.slot] ?? s.slot}
                    </p>
                    <p className="text-sm font-semibold text-fp-text truncate">{s.recipe.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer button */}
        {!loading && !error && suggestions.length > 0 && (
          <div className="pt-4">
            {saveError && (
              <p className="text-xs text-red-500 text-center mb-3">Failed to save. Try again.</p>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              loading={saving}
              disabled={acceptedCount === 0}
            >
              Add {acceptedCount} meal{acceptedCount !== 1 ? "s" : ""} to planner
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
