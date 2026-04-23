"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Package, Search, X } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { PantryGroup } from "@/components/pantry/PantryGroup";
import { AddPantryItemSheet } from "@/components/pantry/AddPantryItemSheet";
import { PANTRY_CATEGORIES, type PantryItem, type PantryCategory } from "@/lib/types";

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [undoToast, setUndoToast] = useState<PantryItem | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always-current ref so rapid taps read the latest qty, not a stale closure
  const itemsRef = useRef<PantryItem[]>([]);
  itemsRef.current = items;

  // Load pantry items on mount
  useEffect(() => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data: unknown) => setItems(Array.isArray(data) ? (data as PantryItem[]) : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Commit any pending undo-delete when the page unmounts
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  // Group filtered items by category, preserving PANTRY_CATEGORIES order
  const grouped = useMemo(() => {
    const map = new Map<PantryCategory, PantryItem[]>();
    for (const cat of PANTRY_CATEGORIES) {
      const group = filteredItems.filter((i) => i.category === cat.value);
      if (group.length > 0) map.set(cat.value, group);
    }
    return map;
  }, [filteredItems]);

  function openAddSheet() {
    setEditItem(null);
    setSheetOpen(true);
  }

  function openEditSheet(item: PantryItem) {
    setEditItem(item);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditItem(null);
  }

  function handleSaved(saved: PantryItem) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === saved.id);
      if (exists) return prev.map((i) => (i.id === saved.id ? saved : i));
      return [...prev, saved];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleQuickDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/pantry/${id}`, { method: "DELETE" });
    } catch {
      // Silently ignore — item already removed from UI
    }
  }

  function showUndoToast(item: PantryItem) {
    // Clear any existing undo window — commit that pending delete immediately
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      if (undoToast) {
        fetch(`/api/pantry/${undoToast.id}`, { method: "DELETE" }).catch(() => {});
      }
    }
    setUndoToast(item);
    undoTimerRef.current = setTimeout(() => {
      fetch(`/api/pantry/${item.id}`, { method: "DELETE" }).catch(() => {});
      setUndoToast(null);
      undoTimerRef.current = null;
    }, 4000);
  }

  function handleUndo() {
    if (!undoToast) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setItems((prev) => [...prev, undoToast]);
    setUndoToast(null);
  }

  async function handleDecrement(id: string) {
    // Capture item + newQty from inside the functional updater so rapid taps
    // each see the already-decremented state, not a stale closure value.
    let capturedItem: PantryItem | undefined;
    let capturedNewQty = 0;

    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      const newQty = item.quantity - 1;
      capturedItem = item;
      capturedNewQty = newQty;
      if (newQty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i));
    });

    if (!capturedItem) return;

    if (capturedNewQty <= 0) {
      showUndoToast(capturedItem);
    } else {
      try {
        await fetch(`/api/pantry/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: capturedNewQty }),
        });
      } catch {
        const originalQty = capturedItem.quantity;
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, quantity: originalQty } : i))
        );
      }
    }
  }

  const totalItems = items.length;
  const freshItems = items.filter((i) => {
    if (!i.purchased_date) return true;
    const days = Math.floor(
      (Date.now() - new Date(i.purchased_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days < 7;
  }).length;
  const needsAttention = totalItems - freshItems;

  return (
    <PageShell>
      <PageHeader
        title="Pantry"
        subtitle={
          loading
            ? "What's in your kitchen"
            : totalItems === 0
            ? "What's in your kitchen"
            : needsAttention > 0
            ? `${totalItems} items · ${needsAttention} need attention`
            : `${totalItems} item${totalItems === 1 ? "" : "s"}`
        }
        action={
          totalItems > 0 ? (
            <Button size="sm" variant="primary" onClick={openAddSheet}>
              <Plus size={15} />
              Add Item
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <PageSkeleton />
      ) : totalItems === 0 ? (
        <EmptyState
          icon={Package}
          title="Your pantry is bare."
          description="Tell FullPantry what you have on hand and it'll subtract those items from your grocery list automatically."
          action={
            <Button variant="primary" size="md" onClick={openAddSheet}>
              <Plus size={15} />
              Add your first item
            </Button>
          }
        />
      ) : (
        <div className="space-y-6 pb-32">
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-fp-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your pantry…"
              className="w-full pl-9 pr-9 py-2.5 bg-fp-surface-2 border border-fp-border rounded-xl text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fp-text-muted hover:text-fp-text transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* No search results */}
          {search && grouped.size === 0 && (
            <p className="text-sm text-fp-text-muted text-center py-8">
              No items matching &ldquo;{search}&rdquo;
            </p>
          )}

          {/* Category groups */}
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([cat, catItems]) => (
              <PantryGroup
                key={cat}
                category={cat}
                items={catItems}
                onEdit={openEditSheet}
                onDelete={handleQuickDelete}
                onDecrement={handleDecrement}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit sheet */}
      {sheetOpen && (
        <AddPantryItemSheet
          editItem={editItem}
          onClose={closeSheet}
          onSave={handleSaved}
          onDelete={removeItem}
        />
      )}

      {/* Floating add button (visible when pantry has items) */}
      {!loading && totalItems > 0 && (
        <button
          onClick={openAddSheet}
          className="fixed bottom-24 right-5 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-fp-accent text-white shadow-lg hover:bg-fp-accent-hover active:scale-95 transition-all"
          aria-label="Add pantry item"
        >
          <Plus size={22} />
        </button>
      )}

      {/* Undo toast */}
      {undoToast && (
        <div className="fixed bottom-28 left-4 right-4 z-50 flex items-center justify-between bg-fp-text text-fp-text-inverse px-4 py-3 rounded-xl shadow-lg animate-slide-up">
          <span className="text-sm">
            Removed <span className="font-semibold">{undoToast.name}</span>
          </span>
          <button
            onClick={handleUndo}
            className="text-sm font-semibold text-fp-accent-light ml-4 hover:opacity-80 transition-opacity"
          >
            Undo
          </button>
        </div>
      )}
    </PageShell>
  );
}
