import { type RecipeIngredient } from "@/lib/types";
import { formatIngredientQuantity } from "@/lib/serving";

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  originalServings: number;
  desiredServings: number;
}

export function IngredientList({
  ingredients,
  originalServings,
  desiredServings,
}: IngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <p className="text-fp-text-muted text-sm italic">No ingredients listed.</p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {ingredients.map((ing) => {
        const qty = formatIngredientQuantity(
          ing.quantity,
          ing.unit,
          originalServings,
          desiredServings
        );
        const qtyUnit = [qty, ing.unit].filter(Boolean).join(" ");

        return (
          <li key={ing.id} className="flex items-baseline gap-3 text-sm">
            {/* Quantity + unit — fixed width, right-aligned, terracotta */}
            <span className="min-w-[4.5rem] text-right font-semibold text-fp-accent tabular-nums flex-shrink-0 text-[13px]">
              {qtyUnit || "—"}
            </span>
            {/* Ingredient name */}
            <span className="text-fp-text">{ing.name}</span>
            {/* Optional notes */}
            {ing.notes && (
              <span className="text-fp-text-muted text-xs">({ing.notes})</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
