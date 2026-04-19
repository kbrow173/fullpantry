"use client";

import { useState, useEffect, useMemo } from "react";
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

  // Load pantry items on mount
  useEffect(() => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data: unknown) => setItems(Array.isArray(data) ? (data as PantryItem[]) : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
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
    // Optimistically remove, then confirm with API
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/pantry/${id}`, { method: "DELETE" });
    } catch {
      // Silently ignore — item already removed from UI
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
    </PageShell>
  );
}
