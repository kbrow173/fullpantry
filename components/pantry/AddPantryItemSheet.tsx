"use client";

import { useState, useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PANTRY_CATEGORIES, type PantryCategory, type PantryItem } from "@/lib/types";
import { suggestUnits } from "@/lib/units";
import { cn } from "@/lib/utils";

interface AddPantryItemSheetProps {
  /** If provided, the sheet opens in edit mode pre-filled with this item */
  editItem?: PantryItem | null;
  onClose: () => void;
  onSave: (item: PantryItem) => void;
  onDelete?: (id: string) => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// Days until typical expiry by category (fridge/freezer/cabinet context)
const EXPIRY_DAYS: Record<PantryCategory, number> = {
  produce: 7,           // fridge
  "dairy-eggs": 14,     // fridge
  "meat-seafood": 3,    // fridge (fresh); user knows if frozen
  "grains-pasta": 365,  // cabinet
  "canned-jarred": 730, // cabinet
  "spices-condiments": 365, // cabinet
  frozen: 180,          // freezer
  beverages: 30,        // varies, conservative
  bakery: 7,            // counter/fridge
  snacks: 60,           // cabinet
  other: 30,
};

function suggestExpiry(cat: PantryCategory): string {
  const d = new Date();
  d.setDate(d.getDate() + EXPIRY_DAYS[cat]);
  return d.toISOString().split("T")[0];
}

export function AddPantryItemSheet({
  editItem,
  onClose,
  onSave,
  onDelete,
}: AddPantryItemSheetProps) {
  const isEditing = !!editItem;
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(editItem?.name ?? "");
  const [quantity, setQuantity] = useState(editItem?.quantity?.toString() ?? "1");
  const [unit, setUnit] = useState(editItem?.unit ?? "");
  const [category, setCategory] = useState<PantryCategory>(editItem?.category ?? "other");
  const [purchasedDate, setPurchasedDate] = useState(editItem?.purchased_date ?? today());
  const [expiryDate, setExpiryDate] = useState(editItem?.expiry_date ?? "");
  // true when expiry was set by the user manually (not auto-suggested)
  const expiryUserSet = useRef(!!editItem?.expiry_date);
  const [notes, setNotes] = useState(editItem?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const unitSuggestions = suggestUnits(name);

  // Focus name input on open
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Item name is required.");
      nameRef.current?.focus();
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: trimmedName,
        quantity: qty,
        unit: unit.trim(),
        category,
        purchased_date: purchasedDate || null,
        expiry_date: expiryDate.trim() || null,
        notes: notes.trim() || null,
      };

      const url = isEditing ? `/api/pantry/${editItem!.id}` : "/api/pantry";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to save item.");
      }

      const saved = await res.json() as PantryItem;
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editItem || !onDelete) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pantry/${editItem.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete.");
      onDelete(editItem.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 bg-fp-surface-2 border border-fp-border rounded-xl text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Edit pantry item" : "Add pantry item"}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-fp-surface shadow-2xl ring-1 ring-fp-border"
        style={{ maxHeight: "92dvh", overflowY: "auto" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-fp-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-fp-border">
          <h2 className="font-serif text-xl font-semibold text-fp-text">
            {isEditing ? "Edit item" : "Add to pantry"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Item name <span className="text-fp-accent">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Chicken breast, Oat milk, Garlic…"
              className={cn(inputCls, error && !name.trim() && "border-fp-error")}
            />
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <div>
              <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
                Qty <span className="text-fp-accent">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setError(""); }}
                className={cn(inputCls, "text-center tabular-nums")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="cups, oz, lb…"
                className={inputCls}
                list="unit-suggestions"
              />
              <datalist id="unit-suggestions">
                {unitSuggestions.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Unit suggestion chips */}
          {unitSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 -mt-2">
              {unitSuggestions.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                    unit === u
                      ? "bg-fp-accent text-white border-fp-accent"
                      : "bg-fp-surface-2 text-fp-text-secondary border-fp-border hover:border-fp-accent hover:text-fp-accent"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PANTRY_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setCategory(cat.value);
                    if (!expiryUserSet.current) {
                      setExpiryDate(suggestExpiry(cat.value));
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors text-left",
                    category === cat.value
                      ? "bg-fp-accent-bg border-fp-accent-border text-fp-accent"
                      : "bg-fp-surface-2 border-fp-border text-fp-text-secondary hover:border-fp-accent/40"
                  )}
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span className="text-xs font-medium truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
                Purchased
              </label>
              <input
                type="date"
                value={purchasedDate}
                onChange={(e) => setPurchasedDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
                Expires{" "}
                <span className="text-fp-text-muted font-normal">(auto-suggested)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  expiryUserSet.current = true;
                }}
                className={inputCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Notes <span className="text-fp-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. opened, store-brand, organic…"
              className={inputCls}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-fp-error bg-fp-error-bg rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1 pb-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              loading={saving}
            >
              {isEditing ? "Save changes" : "Add to pantry"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-fp-text-secondary hover:text-fp-text transition-colors"
            >
              Cancel
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="ml-auto flex items-center gap-1.5 text-sm text-fp-text-muted hover:text-fp-error transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
