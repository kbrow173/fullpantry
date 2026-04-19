import type { GroceryCategory, RecipeIngredient, PantryItem } from "@/lib/types";

// ─── Unit Conversion ────────────────────────────────────

type UnitSystem = "volume" | "weight" | "count";

const VOLUME_TO_ML: Record<string, number> = {
  tsp: 4.93, teaspoon: 4.93, teaspoons: 4.93,
  tbsp: 14.79, tablespoon: 14.79, tablespoons: 14.79,
  "fl oz": 29.57, "fluid oz": 29.57, "fluid ounce": 29.57,
  cup: 240, cups: 240,
  pint: 473, pints: 473, pt: 473,
  quart: 946, quarts: 946, qt: 946,
  gallon: 3785, gallons: 3785, gal: 3785,
  ml: 1, milliliter: 1, milliliters: 1, millilitre: 1,
  l: 1000, liter: 1000, liters: 1000, litre: 1000,
};

const WEIGHT_TO_G: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  oz: 28.35, ounce: 28.35, ounces: 28.35,
  lb: 453.59, lbs: 453.59, pound: 453.59, pounds: 453.59,
};

function unitSystem(unit: string): UnitSystem {
  const u = unit.toLowerCase().trim();
  if (VOLUME_TO_ML[u] !== undefined) return "volume";
  if (WEIGHT_TO_G[u] !== undefined) return "weight";
  return "count";
}

function toBase(qty: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  if (VOLUME_TO_ML[u]) return qty * VOLUME_TO_ML[u];
  if (WEIGHT_TO_G[u]) return qty * WEIGHT_TO_G[u];
  return qty;
}

function fromBase(base: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  if (VOLUME_TO_ML[u]) return base / VOLUME_TO_ML[u];
  if (WEIGHT_TO_G[u]) return base / WEIGHT_TO_G[u];
  return base;
}

// ─── Store Section Lookup ────────────────────────────────────

const SECTION_KEYWORDS: { section: GroceryCategory; keywords: string[] }[] = [
  { section: "produce", keywords: [
    "apple", "banana", "orange", "lemon", "lime", "grape", "berry", "berries",
    "strawberry", "strawberries", "blueberry", "blueberries", "raspberry", "raspberries",
    "blackberry", "blackberries", "mango", "pineapple", "watermelon", "peach", "pear",
    "plum", "cherry", "cherries", "avocado", "tomato", "tomatoes", "lettuce", "spinach",
    "kale", "arugula", "cabbage", "broccoli", "cauliflower", "carrot", "carrots", "celery",
    "cucumber", "zucchini", "squash", "bell pepper", "red pepper", "green pepper",
    "yellow pepper", "onion", "onions", "shallot", "shallots", "garlic", "ginger",
    "potato", "potatoes", "sweet potato", "yam", "beet", "beets", "radish", "turnip",
    "leek", "scallion", "green onion", "mushroom", "mushrooms", "asparagus", "eggplant",
    "artichoke", "corn", "peas", "snap peas", "snow peas", "green peas", "green beans",
    "edamame", "cilantro", "parsley", "basil", "mint", "thyme", "rosemary", "sage",
    "dill", "chives", "herbs", "jalapeño", "serrano", "habanero", "bok choy", "fennel",
  ]},
  { section: "meat-seafood", keywords: [
    "chicken", "beef", "pork", "lamb", "turkey", "duck", "veal", "bison",
    "ground beef", "ground pork", "ground turkey", "steak", "ribs", "chop", "loin",
    "thigh", "breast", "wing", "sausage", "bacon", "ham", "prosciutto", "pancetta",
    "salami", "pepperoni", "hot dog", "bratwurst", "chorizo", "salmon", "tuna",
    "shrimp", "prawns", "cod", "tilapia", "halibut", "mahi", "snapper", "bass",
    "trout", "sardine", "anchovy", "crab", "lobster", "scallop", "oyster", "clam",
    "mussel", "squid", "octopus", "fish", "seafood",
  ]},
  { section: "pantry-staples", keywords: [
    "flour", "sugar", "salt", "pepper", "oil", "olive oil", "vegetable oil",
    "canola oil", "sesame oil", "vinegar", "soy sauce", "sauce", "paste",
    "tomato sauce", "tomato paste", "canned", "beans", "lentils",
    "chickpeas", "rice", "pasta", "noodle", "noodles", "spaghetti", "linguine",
    "fettuccine", "penne", "rigatoni", "farfalle", "orzo", "vermicelli",
    "oats", "quinoa", "couscous", "barley", "breadcrumbs", "panko", "crackers", "cereal",
    "baking powder", "baking soda", "yeast", "vanilla", "cocoa", "chocolate",
    "honey", "maple syrup", "molasses", "jam", "jelly", "peanut butter",
    "peanuts", "nut butter", "almond butter", "cashew butter", "sunflower butter",
    "mayonnaise", "mustard", "ketchup", "hot sauce",
    "sriracha", "worcestershire", "fish sauce", "oyster sauce", "hoisin", "tahini",
    "miso", "curry", "cumin", "paprika", "turmeric", "cinnamon", "nutmeg",
    "oregano", "bay leaf", "chili flakes", "cayenne", "coriander", "cardamom",
    "allspice", "spice", "seasoning", "almonds", "walnuts", "pecans", "cashews",
    "pistachios", "pine nuts", "seeds", "sesame", "chia", "flax",
    "raisins", "dried fruit", "coconut flakes", "shredded coconut", "broth", "stock", "bouillon",
  ]},
  { section: "dairy-eggs", keywords: [
    "milk", "cream", "half-and-half", "half and half", "butter", "ghee",
    "cheese", "cheddar", "mozzarella", "parmesan", "parmigiano", "feta",
    "ricotta", "brie", "gouda", "gruyere", "swiss", "goat cheese",
    "yogurt", "sour cream", "cream cheese", "cottage cheese", "eggs",
    "heavy cream", "whipping cream", "buttermilk", "kefir", "oat milk",
    "almond milk", "soy milk", "coconut milk",
  ]},
  { section: "bakery", keywords: [
    "bread", "baguette", "sourdough", "roll", "bun", "bagel", "muffin",
    "croissant", "pita", "naan", "tortilla", "wrap", "brioche", "ciabatta",
    "focaccia", "pumpernickel", "english muffin",
  ]},
  { section: "frozen", keywords: [
    "frozen", "ice cream", "gelato", "sorbet", "popsicle",
  ]},
  { section: "beverages", keywords: [
    "juice", "soda", "sparkling water", "coffee", "green tea", "black tea",
    "herbal tea", "iced tea", "chai", "wine", "beer",
    "kombucha", "lemonade", "coconut water", "sports drink",
  ]},
];

export function categorizeIngredient(name: string): GroceryCategory {
  const lower = name.toLowerCase();
  for (const { section, keywords } of SECTION_KEYWORDS) {
    // Word-left-boundary only: keyword must not follow a letter.
    // Allows plural forms (e.g. "lime" matches "limes") while preventing
    // mid-word matches (e.g. "pea" won't match "peanuts" because "n" follows).
    // Multi-word keywords use a simple includes check via the leading-boundary rule.
    if (keywords.some((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // For multi-word keywords: require leading boundary only
      // For single-word keywords: require the next char after keyword is not an alpha
      // This prevents "pea" matching "peanut" but allows "lime" matching "limes"
      if (kw.includes(" ")) {
        return new RegExp(`(?<![a-z])${escaped}`, "i").test(lower);
      }
      // Single word: boundary on left, allow only s/es/ed plurals after (not arbitrary letters)
      return new RegExp(`(?<![a-z])${escaped}(?![a-df-rt-z])`, "i").test(lower);
    })) {
      return section;
    }
  }
  return "other";
}

// ─── Aggregation ────────────────────────────────────

export interface AggregatedItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: GroceryCategory;
  sourceRecipeId: string | null;
}

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/,.*$/, "")   // strip prep notes after comma
    // Strip leading quantity+unit prefixes like "½ teaspoon", "2 tablespoons", "1 (14-ounce) can"
    .replace(/^[\d\s½¼¾⅓⅔⅛⅜⅝⅞.,()–-]+\s*(teaspoons?|tablespoons?|tsps?|tbsps?|cups?|fluid\s+oz|fl\.?\s*oz|ounces?|oz|pounds?|lbs?|grams?|kg|ml|liters?|litres?|l|cans?|packages?|pkgs?|slices?|pieces?)\s+/i, "")
    // Strip common descriptors that don't distinguish the ingredient
    .replace(/\b(table|sea|kosher|fine|coarse|freshly|dried|ground|whole|crushed|raw|salted|unsalted|packed|large|medium|small|grated|sliced|diced|minced|chopped|peeled|seeded)\b\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip preparation notes from display name — keep ingredient, drop ", chopped", "plus X for serving", etc.
function cleanDisplayName(name: string): string {
  return name.trim()
    .replace(/,.*$/, "")               // strip ", chopped", ", divided", etc.
    .replace(/\s+plus\s+.*$/i, "")     // strip "plus 3 tablespoons juice...", "plus lime wedges..."
    .replace(/\s+\(.*?\)\s*$/, "")     // strip trailing parentheticals like "(2 limes)"
    .trim();
}

export function aggregateIngredients(
  ingredients: (RecipeIngredient & { recipe_id: string; plan_servings: number; recipe_servings: number })[]
): AggregatedItem[] {
  const map = new Map<string, AggregatedItem & { baseQty: number | null; system: UnitSystem }>();

  for (const ing of ingredients) {
    const key = normalizeIngredientName(ing.name);
    const scale = ing.recipe_servings > 0 ? ing.plan_servings / ing.recipe_servings : 1;
    const scaledQty = ing.quantity != null ? ing.quantity * scale : null;
    const unit = ing.unit?.trim() || null;
    const sys = unit ? unitSystem(unit) : "count";

    if (!map.has(key)) {
      map.set(key, {
        name: cleanDisplayName(ing.name),
        quantity: scaledQty,
        unit,
        category: categorizeIngredient(ing.name),
        sourceRecipeId: ing.recipe_id,
        baseQty: scaledQty != null && unit ? toBase(scaledQty, unit) : scaledQty,
        system: sys,
      });
      continue;
    }

    const existing = map.get(key)!;
    // Only aggregate if same unit system and both have quantities
    if (
      scaledQty != null &&
      existing.baseQty != null &&
      unit &&
      existing.unit &&
      existing.system === sys &&
      sys !== "count"
    ) {
      existing.baseQty += toBase(scaledQty, unit);
      existing.quantity = fromBase(existing.baseQty, existing.unit);
    } else if (scaledQty != null && existing.quantity != null && !unit && !existing.unit) {
      existing.quantity += scaledQty;
      existing.baseQty = (existing.baseQty ?? 0) + scaledQty;
    }
    // If units are incompatible, keep the first entry — edge case, acceptable
  }

  return Array.from(map.values()).map(({ baseQty: _b, system: _s, ...item }) => item);
}

// ─── Pantry Subtraction ────────────────────────────────────

export function subtractPantry(
  items: AggregatedItem[],
  pantry: PantryItem[]
): AggregatedItem[] {
  const result: AggregatedItem[] = [];

  for (const item of items) {
    const key = normalizeIngredientName(item.name);
    const match = pantry.find((p) => normalizeIngredientName(p.name) === key);

    if (!match || item.quantity == null) {
      result.push(item);
      continue;
    }

    const needUnit = item.unit?.toLowerCase().trim() ?? "";
    const haveUnit = match.unit?.toLowerCase().trim() ?? "";
    const needSys = needUnit ? unitSystem(needUnit) : "count";
    const haveSys = haveUnit ? unitSystem(haveUnit) : "count";

    if (needSys !== haveSys) {
      // For pantry-staples (spices, condiments), presence in pantry = covered.
      // For other categories, incompatible units means we can't subtract safely.
      if (item.category !== "pantry-staples") result.push(item);
      continue;
    }

    const needBase = needUnit ? toBase(item.quantity, needUnit) : item.quantity;
    const haveBase = haveUnit ? toBase(match.quantity, haveUnit) : match.quantity;
    const remaining = needBase - haveBase;

    if (remaining <= 0) continue; // have enough in pantry

    result.push({
      ...item,
      quantity: needUnit ? fromBase(remaining, needUnit) : remaining,
    });
  }

  return result;
}

// ─── Display Helpers ────────────────────────────────────

export function formatGroceryQty(quantity: number | null, unit: string | null): string {
  if (quantity == null) return unit ?? "";
  const rounded = Math.round(quantity * 100) / 100;
  const qty = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "");
  return unit ? `${qty} ${unit}` : qty;
}
