"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { GroceryItem } from "@/components/groceries/GroceryItem";
import type { GroceryItem as GroceryItemType, GroceryCategory } from "@/lib/types";
import { GROCERY_CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GrocerySectionProps {
  category: GroceryCategory;
  items: GroceryItemType[];
  onCheck: (item: GroceryItemType) => void;
  onDelete: (id: string) => void;
}

export function GrocerySection({ category, items, onCheck, onDelete }: GrocerySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = GROCERY_CATEGORIES.find((c) => c.value === category);
  const checkedCount = items.filter((i) => i.is_checked).length;

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 py-2 group"
      >
        <span className="text-base leading-none">{meta?.icon ?? "🛒"}</span>
        <span className="flex-1 text-left text-xs font-bold tracking-[0.1em] uppercase text-fp-text-secondary">
          {meta?.label ?? category}
        </span>
        <span className="text-xs text-fp-text-muted">
          {checkedCount}/{items.length}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-fp-text-muted transition-transform",
            collapsed && "-rotate-90"
          )}
        />
      </button>

      {!collapsed && (
        <div className="bg-fp-surface rounded-xl border border-fp-border px-4">
          {items.map((item) => (
            <GroceryItem
              key={item.id}
              item={item}
              onCheck={onCheck}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
