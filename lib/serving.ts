/**
 * FullPantry — Serving Size Scaling Utilities
 */

const DISCRETE_UNITS = new Set([
  "", "whole", "piece", "pieces", "large", "medium", "small",
  "clove", "cloves", "slice", "slices", "strip", "strips",
  "fillet", "fillets", "breast", "breasts", "thigh", "thighs",
  "stalk", "stalks", "sprig", "sprigs", "head", "heads",
  "can", "cans", "package", "packages", "pkg", "sheet", "sheets",
]);

const FRACTIONS: Array<[number, number, string]> = [
  [1, 8, "⅛"], [1, 4, "¼"], [1, 3, "⅓"], [3, 8, "⅜"], [1, 2, "½"],
  [5, 8, "⅝"], [2, 3, "⅔"], [3, 4, "¾"], [7, 8, "⅞"],
];

const SNAP_THRESHOLD = 0.07;

export function scaleQuantity(quantity: number, originalServings: number, desiredServings: number): number {
  if (originalServings === 0) return quantity;
  return quantity * (desiredServings / originalServings);
}

export function toFractionString(value: number): string {
  if (value <= 0) return "0";
  const whole = Math.floor(value);
  const remainder = value - whole;
  if (remainder < SNAP_THRESHOLD) return whole > 0 ? whole.toString() : "0";
  if (1 - remainder < SNAP_THRESHOLD) return (whole + 1).toString();

  let bestFraction: [number, number, string] | null = null;
  let bestDiff = Infinity;
  for (const frac of FRACTIONS) {
    const diff = Math.abs(remainder - frac[0] / frac[1]);
    if (diff < bestDiff) { bestDiff = diff; bestFraction = frac; }
  }
  if (!bestFraction || bestDiff > SNAP_THRESHOLD) {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  }
  const [, , symbol] = bestFraction;
  return whole === 0 ? symbol : `${whole} ${symbol}`;
}

export function formatIngredientQuantity(
  originalQuantity: number | null,
  unit: string | null,
  originalServings: number,
  desiredServings: number
): string {
  if (originalQuantity === null || originalQuantity === 0) return "";
  const scaled = scaleQuantity(originalQuantity, originalServings, desiredServings);
  const unitLower = (unit ?? "").toLowerCase().trim();
  if (DISCRETE_UNITS.has(unitLower)) return Math.ceil(scaled).toString();
  return toFractionString(scaled);
}

export function formatServingLabel(servings: number): string {
  return servings === 1 ? "1 serving" : `${servings} servings`;
}
