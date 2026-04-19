"use client";

import { ShoppingCart, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { GroceryList } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GroceryListHeaderProps {
  lists: GroceryList[];
  activeId: string | null;
  generating: boolean;
  onSelect: (id: string) => void;
  onGenerate: () => void;
  onDelete: (id: string) => void;
}

export function GroceryListHeader({ lists, activeId, generating, onSelect, onGenerate, onDelete }: GroceryListHeaderProps) {
  return (
    <div className="mb-4">
      {/* Generate button */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold tracking-[0.1em] uppercase text-fp-text-muted">
          {lists.length > 0 ? `${lists.length} of 3 lists` : "No lists yet"}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={onGenerate}
          loading={generating}
        >
          <ShoppingCart size={14} className="mr-1.5" />
          Generate for next 7 days
        </Button>
      </div>

      {/* List tabs */}
      {lists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {lists.map((list) => (
            <div key={list.id} className="flex-shrink-0 flex items-center gap-1">
              <button
                onClick={() => onSelect(list.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap",
                  activeId === list.id
                    ? "bg-fp-accent text-white border-fp-accent"
                    : "bg-fp-surface-2 text-fp-text-secondary border-fp-border hover:border-fp-accent/40"
                )}
              >
                {list.name}
              </button>
              {activeId === list.id && (
                <button
                  onClick={() => onDelete(list.id)}
                  className="p-1 rounded-lg text-fp-text-muted hover:text-fp-error hover:bg-fp-error-bg transition-colors"
                  aria-label="Delete list"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
