import { PantryItem } from "@/components/pantry/PantryItem";
import type { PantryItem as PantryItemType, PantryCategory } from "@/lib/types";
import { PANTRY_CATEGORIES } from "@/lib/types";

interface PantryGroupProps {
  category: PantryCategory;
  items: PantryItemType[];
  onEdit: (item: PantryItemType) => void;
  onDelete: (id: string) => void;
  onDecrement: (id: string) => void;
}

export function PantryGroup({ category, items, onEdit, onDelete, onDecrement }: PantryGroupProps) {
  const meta = PANTRY_CATEGORIES.find((c) => c.value === category);
  if (!meta || items.length === 0) return null;

  return (
    <section>
      {/* Category header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-base leading-none">{meta.icon}</span>
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-fp-text-muted">
          {meta.label}
        </h3>
        <span className="text-[11px] text-fp-text-muted/60">
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <PantryItem
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onDecrement={onDecrement}
          />
        ))}
      </div>
    </section>
  );
}
