"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroceryListHeader } from "@/components/groceries/GroceryListHeader";
import { GrocerySection } from "@/components/groceries/GrocerySection";
import { AddToPantrySheet } from "@/components/groceries/AddToPantrySheet";
import { AddGroceryItemSheet } from "@/components/groceries/AddGroceryItemSheet";
import { ShoppingCart } from "lucide-react";
import { GROCERY_CATEGORIES, type GroceryList, type GroceryItem, type GroceryCategory } from "@/lib/types";

export default function GroceriesPage() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingItem, setCheckingItem] = useState<GroceryItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);

  const fetchLists = useCallback(async () => {
    const res = await fetch("/api/groceries");
    const data: unknown = await res.json();
    if (Array.isArray(data)) {
      setLists(data as GroceryList[]);
      if (data.length > 0 && !activeId) {
        setActiveId((data as GroceryList[])[0].id);
      }
    }
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
    fetchLists();
  }, []);

  const activeList = lists.find((l) => l.id === activeId) ?? null;
  const items: GroceryItem[] = (activeList?.items ?? []) as GroceryItem[];

  // Group items by category in GROCERY_CATEGORIES order
  const grouped = GROCERY_CATEGORIES
    .map((cat) => ({
      category: cat.value as GroceryCategory,
      items: items.filter((i) => i.category === cat.value),
    }))
    .filter((g) => g.items.length > 0);

  // Uncategorized items that don't match any known category
  const knownCats = new Set(GROCERY_CATEGORIES.map((c) => c.value));
  const otherItems = items.filter((i) => !knownCats.has(i.category as GroceryCategory));
  if (otherItems.length > 0) {
    const otherGroup = grouped.find((g) => g.category === "other");
    if (otherGroup) otherGroup.items.push(...otherItems);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(false);
    try {
      const res = await fetch("/api/groceries/generate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate");
      const newList = await res.json() as GroceryList;
      setLists((prev) => {
        // Remove old list with same week_start_date (server replaced it) and avoid ID dupes
        const filtered = prev.filter((l) => l.id !== newList.id && l.week_start_date !== newList.week_start_date);
        return [newList, ...filtered].slice(0, 3);
      });
      setActiveId(newList.id);
    } catch {
      setGenerateError(true);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteList(id: string) {
    await fetch(`/api/groceries/${id}`, { method: "DELETE" });
    setLists((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }

  function handleCheck(item: GroceryItem) {
    if (item.is_checked) {
      // Uncheck — no pantry sheet
      updateItem(item.id, { is_checked: false });
    } else {
      setCheckingItem(item);
    }
  }

  async function handleAddToPantry(item: GroceryItem, quantity: number) {
    try {
      const pantryRes = await fetch("/api/pantry");
      if (!pantryRes.ok) throw new Error("pantry fetch failed");
      const pantryData: unknown = await pantryRes.json();

      if (Array.isArray(pantryData)) {
        const existing = (pantryData as { id: string; name: string; quantity: number }[])
          .find((p) => p.name.toLowerCase().trim() === item.name.toLowerCase().trim());

        if (existing) {
          await fetch(`/api/pantry/${existing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: Number(existing.quantity) + quantity }),
          });
        } else {
          await fetch("/api/pantry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              quantity,
              unit: item.unit ?? "",
              category: "other",
            }),
          });
        }
      }
    } catch {
      // pantry add failed — still mark checked so user can continue shopping
    }

    await updateItem(item.id, { is_checked: true });
    setCheckingItem(null);
  }

  async function updateItem(itemId: string, patch: Partial<GroceryItem>) {
    const res = await fetch(`/api/groceries/${activeId}/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json() as GroceryItem;
      setLists((prev) => prev.map((l) => l.id !== activeId ? l : {
        ...l,
        items: (l.items ?? []).map((i) => i.id === itemId ? updated : i),
      }));
    }
  }

  async function handleDeleteItem(itemId: string) {
    const snapshot = lists;
    setLists((prev) => prev.map((l) => l.id !== activeId ? l : {
      ...l,
      items: (l.items ?? []).filter((i) => i.id !== itemId),
    }));
    const res = await fetch(`/api/groceries/${activeId}/items/${itemId}`, { method: "DELETE" });
    if (!res.ok) setLists(snapshot);
  }

  async function handleAddItem(item: { name: string; quantity: number | null; unit: string | null; category: GroceryCategory }) {
    const res = await fetch(`/api/groceries/${activeId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const newItem = await res.json() as GroceryItem;
      setLists((prev) => prev.map((l) => l.id !== activeId ? l : {
        ...l,
        items: [...(l.items ?? []), newItem],
      }));
    }
    setAddingItem(false);
  }

  const checkedCount = items.filter((i) => i.is_checked).length;

  return (
    <div className="min-h-screen bg-fp-bg pb-32">
      <PageHeader title="Groceries" />

      <div className="px-4 pt-4">
        <GroceryListHeader
          lists={lists}
          activeId={activeId}
          generating={generating}
          onSelect={setActiveId}
          onGenerate={handleGenerate}
          onDelete={handleDeleteList}
        />
        {generateError && (
          <p className="text-xs text-fp-error text-center mb-3 -mt-1">
            Failed to generate. Check your connection and try again.
          </p>
        )}

        {loading ? (
          <div className="space-y-3 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-fp-surface-2 animate-pulse" />
            ))}
          </div>
        ) : !activeList ? (
          <EmptyState
            icon={ShoppingCart}
            title="No grocery lists yet."
            description="Hit Generate to build a list from your next 7 days of planned meals, with pantry items already subtracted."
          />
        ) : items.length === 0 ? (
          <div className="text-center py-12 space-y-1">
            <p className="text-sm font-semibold text-fp-text">Nothing to buy.</p>
            <p className="text-xs text-fp-text-muted">Either your pantry covers everything, or no meals are planned for the next 7 days.</p>
          </div>
        ) : (
          <>
            {checkedCount > 0 && (
              <p className="text-xs text-fp-text-muted mb-3">
                {checkedCount} of {items.length} items checked off
              </p>
            )}
            {grouped.map(({ category, items: catItems }) => (
              <GrocerySection
                key={category}
                category={category}
                items={catItems}
                onCheck={handleCheck}
                onDelete={handleDeleteItem}
              />
            ))}
          </>
        )}
      </div>

      {/* FAB — add item manually */}
      {activeList && (
        <button
          onClick={() => setAddingItem(true)}
          className="fab-pulse fixed bottom-20 right-4 lg:bottom-6 w-14 h-14 rounded-full bg-fp-accent text-white shadow-lg flex items-center justify-center hover:bg-fp-accent/90 active:scale-95 transition-all z-30"
          aria-label="Add item"
        >
          <Plus size={24} />
        </button>
      )}

      {checkingItem && (
        <AddToPantrySheet
          item={checkingItem}
          onConfirm={handleAddToPantry}
          onClose={() => setCheckingItem(null)}
        />
      )}

      {addingItem && activeId && (
        <AddGroceryItemSheet
          listId={activeId}
          onAdd={handleAddItem}
          onClose={() => setAddingItem(false)}
        />
      )}
    </div>
  );
}
