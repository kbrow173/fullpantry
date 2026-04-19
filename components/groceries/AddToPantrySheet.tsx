"use client";

import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { GroceryItem } from "@/lib/types";

interface AddToPantrySheetProps {
  item: GroceryItem;
  onConfirm: (item: GroceryItem, quantity: number) => Promise<void>;
  onClose: () => void;
}

export function AddToPantrySheet({ item, onConfirm, onClose }: AddToPantrySheetProps) {
  const [quantity, setQuantity] = useState<number>(item.quantity ?? 1);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    await onConfirm(item, quantity);
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[55]" onClick={onClose} />
      <div className="animate-slide-up fixed inset-x-0 bottom-0 z-[60] bg-fp-surface rounded-t-3xl shadow-2xl ring-1 ring-fp-border px-5 pt-6 pb-20">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-fp-border" />
        </div>

        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-fp-text-muted mb-0.5">
              Add to pantry
            </p>
            <p className="font-serif text-lg font-semibold text-fp-text">{item.name}</p>
            {item.unit && (
              <p className="text-xs text-fp-text-muted mt-0.5">{item.unit}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-fp-text-secondary">Quantity</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity((q) => Math.max(0.25, parseFloat((q - (q >= 1 ? 1 : 0.25)).toFixed(2))))}
              className="w-9 h-9 rounded-full border border-fp-border flex items-center justify-center text-fp-text hover:bg-fp-surface-2 transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="text-xl font-bold text-fp-text tabular-nums w-10 text-center">
              {quantity % 1 === 0 ? quantity : quantity.toFixed(2).replace(/\.?0+$/, "")}
            </span>
            <button
              onClick={() => setQuantity((q) => parseFloat((q + (q >= 1 ? 1 : 0.25)).toFixed(2)))}
              className="w-9 h-9 rounded-full border border-fp-border flex items-center justify-center text-fp-text hover:bg-fp-surface-2 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <Button variant="primary" size="md" onClick={handleConfirm} loading={saving}>
          Add to pantry
        </Button>
      </div>
    </>
  );
}
