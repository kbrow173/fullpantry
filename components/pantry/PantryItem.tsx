"use client";

import { CheckCircle2, Pencil } from "lucide-react";
import type { PantryItem as PantryItemType } from "@/lib/types";

interface PantryItemProps {
  item: PantryItemType;
  onEdit: (item: PantryItemType) => void;
  onDelete: (id: string) => void;
}

function getFreshnessInfo(purchasedDate: string | null): {
  label: string | null;
  color: "green" | "amber" | "red" | null;
} {
  if (!purchasedDate) return { label: null, color: null };
  const days = Math.floor(
    (Date.now() - new Date(purchasedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 7) return { label: null, color: "green" };
  if (days < 14) return { label: "Use soon", color: "amber" };
  return { label: "Check this", color: "red" };
}

export function PantryItem({ item, onEdit, onDelete }: PantryItemProps) {
  const freshness = getFreshnessInfo(item.purchased_date);

  const qtyDisplay = [
    item.quantity !== 1 || item.unit ? item.quantity : null,
    item.unit || null,
  ]
    .filter(Boolean)
    .join(" ") || String(item.quantity);

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-fp-surface rounded-xl border border-fp-border group">
      {/* Freshness dot */}
      <div className="flex-shrink-0 w-2 h-2 rounded-full mt-0.5">
        {freshness.color === "amber" && (
          <div className="w-2 h-2 rounded-full bg-fp-warning" title="Use soon" />
        )}
        {freshness.color === "red" && (
          <div className="w-2 h-2 rounded-full bg-fp-error" title="Check this" />
        )}
        {(freshness.color === "green" || !freshness.color) && (
          <div className="w-2 h-2 rounded-full bg-transparent" />
        )}
      </div>

      {/* Name + freshness label */}
      <button
        onClick={() => onEdit(item)}
        className="flex-1 text-left min-w-0"
      >
        <p className="text-sm font-medium text-fp-text truncate">{item.name}</p>
        {freshness.label && (
          <p
            className={
              "text-[11px] font-medium mt-0.5 " +
              (freshness.color === "amber" ? "text-fp-warning" : "text-fp-error")
            }
          >
            {freshness.label}
          </p>
        )}
      </button>

      {/* Quantity */}
      <span className="text-sm tabular-nums text-fp-accent font-semibold flex-shrink-0">
        {qtyDisplay}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors"
          aria-label="Edit item"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-fp-text-muted hover:text-fp-success hover:bg-fp-success-bg transition-colors"
          aria-label="Mark as used"
          title="Used it all"
        >
          <CheckCircle2 size={13} />
          <span className="hidden sm:inline">Used it</span>
        </button>
      </div>
    </div>
  );
}
