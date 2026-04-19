"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GROCERY_CATEGORIES, type GroceryCategory } from "@/lib/types";
import { categorizeIngredient } from "@/lib/grocery";
import { cn } from "@/lib/utils";

interface AddGroceryItemSheetProps {
  listId: string;
  onAdd: (item: { name: string; quantity: number | null; unit: string | null; category: GroceryCategory }) => Promise<void>;
  onClose: () => void;
}

export function AddGroceryItemSheet({ listId: _listId, onAdd, onClose }: AddGroceryItemSheetProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<GroceryCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const autoCategory = name.trim() ? categorizeIngredient(name) : null;
  const effectiveCategory = category ?? autoCategory ?? "other";

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsedQty = quantity ? parseFloat(quantity) : null;
    if (parsedQty !== null && isNaN(parsedQty)) return;
    setSaving(true);
    await onAdd({
      name: trimmed,
      quantity: parsedQty,
      unit: unit.trim() || null,
      category: effectiveCategory,
    });
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[55]" onClick={onClose} />
      <div className="animate-slide-up fixed inset-x-0 bottom-0 z-[60] bg-fp-surface rounded-t-3xl shadow-2xl ring-1 ring-fp-border px-5 pt-6 pb-20">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-fp-border" />
        </div>

        <div className="flex items-center justify-between mb-5">
          <p className="font-serif text-lg font-semibold text-fp-text">Add item</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Item name"
          autoFocus
          className="w-full px-3 py-2.5 bg-fp-surface-2 border border-fp-border rounded-xl text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors mb-3"
        />

        {/* Qty + Unit */}
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            className="w-24 px-3 py-2.5 bg-fp-surface-2 border border-fp-border rounded-xl text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
          />
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit (cup, lbs…)"
            className="flex-1 px-3 py-2.5 bg-fp-surface-2 border border-fp-border rounded-xl text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
          />
        </div>

        {/* Category */}
        <p className="text-xs font-semibold text-fp-text-secondary mb-2">
          Section
          {autoCategory && !category && (
            <span className="text-fp-text-muted font-normal ml-1">(auto-detected)</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {GROCERY_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(category === cat.value ? null : cat.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                effectiveCategory === cat.value
                  ? "bg-fp-accent text-white border-fp-accent"
                  : "bg-fp-surface-2 text-fp-text-secondary border-fp-border hover:border-fp-accent/40"
              )}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          loading={saving}
          disabled={!name.trim()}
        >
          Add to list
        </Button>
      </div>
    </>
  );
}
