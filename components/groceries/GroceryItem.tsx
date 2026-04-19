"use client";

import { Trash2 } from "lucide-react";
import type { GroceryItem as GroceryItemType } from "@/lib/types";
import { formatGroceryQty } from "@/lib/grocery";
import { cn } from "@/lib/utils";

interface GroceryItemProps {
  item: GroceryItemType;
  onCheck: (item: GroceryItemType) => void;
  onDelete: (id: string) => void;
}

export function GroceryItem({ item, onCheck, onDelete }: GroceryItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 py-3 border-b border-fp-border/50 group",
      item.is_checked && "opacity-50"
    )}>
      <button
        onClick={() => onCheck(item)}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors",
          item.is_checked
            ? "bg-fp-accent border-fp-accent"
            : "border-fp-border hover:border-fp-accent"
        )}
      >
        {item.is_checked && (
          <svg viewBox="0 0 10 10" className="w-full h-full p-0.5" fill="none">
            <path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm font-medium text-fp-text",
          item.is_checked && "line-through text-fp-text-muted"
        )}>
          {item.name}
        </span>
        {(item.quantity != null || item.unit) && (
          <span className="text-xs text-fp-text-muted ml-2">
            {formatGroceryQty(item.quantity, item.unit)}
          </span>
        )}
        {item.notes && (
          <p className="text-xs text-fp-text-muted mt-0.5">{item.notes}</p>
        )}
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 p-1.5 rounded-lg text-fp-text-muted hover:text-fp-error hover:bg-fp-error-bg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Remove item"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
