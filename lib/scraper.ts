import * as cheerio from "cheerio";
import { extractRecipeWithGemini } from "@/lib/gemini";
import type { ImportedRecipe } from "@/lib/types";
import type { RecipeCategory } from "@/lib/types";

const VALID_CATEGORIES = new Set<RecipeCategory>([
  "breakfast", "lunch", "dinner", "snack", "dessert",
  "appetizer", "side-dish", "drink", "sauce-dressing",
]);

// ─── Public API ──────────────────────────────────────────────────

export async function scrapeRecipeFromUrl(url: string): Promise<ImportedRecipe> {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  // Pass 1: JSON-LD structured data
  const fromLd = extractFromJsonLd($, url);
  if (fromLd) return fromLd;

  // Pass 2: Gemini AI extraction
  const fromAi = await extractRecipeWithGemini(html);
  if (fromAi) {
    // Ensure source_url is set
    return { ...fromAi, source_url: fromAi.source_url || url };
  }

  throw new Error("No recipe found at this URL.");
}

// ─── Page Fetch ──────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        throw new Error("This site blocks automated access. Try copying the recipe manually.");
      }
      throw new Error(`Could not reach that page (HTTP ${res.status}).`);
    }

    return await res.text();
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("The site took too long to respond. Try another URL.");
      }
      throw err;
    }
    throw new Error("Could not reach that URL.");
  } finally {
    clearTimeout(timeout);
  }
}

// ─── JSON-LD Extraction ──────────────────────────────────────────

function extractFromJsonLd(
  $: ReturnType<typeof cheerio.load>,
  sourceUrl: string
): ImportedRecipe | null {
  const scripts = $('script[type="application/ld+json"]');
  let recipe: Record<string, unknown> | null = null;

  scripts.each((_, el) => {
    if (recipe) return;
    const raw = $(el).html();
    if (!raw) return;
    try {
      const data: unknown = JSON.parse(raw);
      recipe = findRecipeNode(data);
    } catch {
      // malformed JSON-LD — skip
    }
  });

  if (!recipe) return null;
  return normalizeJsonLd(recipe, sourceUrl);
}

function findRecipeNode(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  // Array: search each item
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Direct Recipe type
  if (obj["@type"] === "Recipe") return obj;

  // Array @type
  if (Array.isArray(obj["@type"]) && (obj["@type"] as string[]).includes("Recipe")) return obj;

  // @graph array
  if (Array.isArray(obj["@graph"])) {
    return findRecipeNode(obj["@graph"]);
  }

  return null;
}

function normalizeJsonLd(
  ld: Record<string, unknown>,
  sourceUrl: string
): ImportedRecipe {
  return {
    title: str(ld.name) || "Untitled Recipe",
    description: str(ld.description) || null,
    category: mapCategory(str(ld.recipeCategory)),
    servings: parseServings(ld.recipeYield),
    prep_time: parseDuration(ld.prepTime),
    cook_time: parseDuration(ld.cookTime),
    source_url: sourceUrl,
    image_url: extractImage(ld.image),
    tags: parseKeywords(ld.keywords),
    ingredients: parseIngredients(ld.recipeIngredient),
    instructions: parseInstructions(ld.recipeInstructions),
  };
}

// ─── JSON-LD Field Parsers ───────────────────────────────────────

function str(val: unknown): string {
  if (typeof val === "string") return val.trim();
  if (Array.isArray(val) && typeof val[0] === "string") return val[0].trim();
  return "";
}

function mapCategory(raw: string): RecipeCategory | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();

  if (lower.includes("breakfast") || lower.includes("brunch")) return "breakfast";
  if (lower.includes("lunch")) return "lunch";
  if (lower.includes("dinner") || lower.includes("main") || lower.includes("entree")) return "dinner";
  if (lower.includes("snack")) return "snack";
  if (lower.includes("dessert") || lower.includes("sweet") || lower.includes("cake") || lower.includes("cookie")) return "dessert";
  if (lower.includes("appetizer") || lower.includes("starter")) return "appetizer";
  if (lower.includes("side")) return "side-dish";
  if (lower.includes("drink") || lower.includes("beverage") || lower.includes("cocktail") || lower.includes("smoothie")) return "drink";
  if (lower.includes("sauce") || lower.includes("dressing") || lower.includes("condiment")) return "sauce-dressing";

  // Check if the raw value is already one of our valid categories
  if (VALID_CATEGORIES.has(lower as RecipeCategory)) return lower as RecipeCategory;

  return "dinner"; // sensible default
}

function parseServings(val: unknown): number | null {
  if (typeof val === "number") return val > 0 ? val : null;
  // Handle number arrays like [4] or [4, 8]
  if (Array.isArray(val)) {
    const first = val[0];
    if (typeof first === "number") return first > 0 ? first : null;
    return parseServings(first);
  }
  const s = str(val as unknown);
  if (!s) return null;
  const match = s.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parseDuration(val: unknown): number | null {
  const s = str(val as unknown);
  if (!s) return null;

  // ISO 8601 duration: PT15M, PT1H30M, P0DT30M
  const iso = s.match(/^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (iso) {
    const hours = parseInt(iso[1] || "0");
    const mins = parseInt(iso[2] || "0");
    return hours * 60 + mins || null;
  }

  // Plain text: "30 minutes", "1 hour 30 minutes", "1.5 hours"
  let total = 0;
  const hourMatch = s.match(/(\d+(?:\.\d+)?)\s*h/i);
  const minMatch = s.match(/(\d+)\s*m/i);
  if (hourMatch) total += parseFloat(hourMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  return total > 0 ? Math.round(total) : null;
}

function extractImage(val: unknown): string | null {
  if (typeof val === "string") {
    // Reject relative URLs — they can't be used by Next.js <Image>
    return val && val.startsWith("http") ? val : null;
  }
  if (Array.isArray(val)) return extractImage(val[0]);
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    return extractImage(obj.url || obj.contentUrl);
  }
  return null;
}

function parseKeywords(val: unknown): string[] {
  // JSON-LD keywords can be a string OR a proper string array
  if (Array.isArray(val)) {
    return val
      .flatMap((item) =>
        typeof item === "string"
          ? item.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
          : []
      )
      .slice(0, 8);
  }
  const s = str(val as unknown);
  if (!s) return [];
  return s.split(/[,;]/).map((t) => t.trim()).filter(Boolean).slice(0, 8);
}

// ─── Ingredient String Parser ────────────────────────────────────

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "0.5", "⅓": "0.333", "⅔": "0.667", "¼": "0.25", "¾": "0.75",
  "⅛": "0.125", "⅜": "0.375", "⅝": "0.625", "⅞": "0.875",
  "⅙": "0.167", "⅚": "0.833",
};

const INGREDIENT_UNITS = new Set([
  "cup", "cups", "c",
  "tablespoon", "tablespoons", "tbsp", "tbs",
  "teaspoon", "teaspoons", "tsp",
  "fluid", // "fluid ounce" — handled below
  "pint", "pints", "pt",
  "quart", "quarts", "qt",
  "gallon", "gallons", "gal",
  "liter", "liters", "litre", "litres", "l",
  "milliliter", "milliliters", "ml",
  "pound", "pounds", "lb", "lbs",
  "ounce", "ounces", "oz",
  "gram", "grams", "g",
  "kilogram", "kilograms", "kg",
  "clove", "cloves",
  "can", "cans",
  "package", "packages", "pkg",
  "bunch", "bunches",
  "slice", "slices",
  "piece", "pieces",
  "sprig", "sprigs",
  "stalk", "stalks",
  "head", "heads",
  "stick", "sticks",
  "dash", "dashes",
  "pinch", "pinches",
  "handful", "handfuls",
  "scoop", "scoops",
  "sheet", "sheets",
]);

function normalizeQuantityStr(s: string): string {
  for (const [frac, dec] of Object.entries(UNICODE_FRACTIONS)) {
    s = s.replace(new RegExp(frac, "g"), dec);
  }
  // "1/2" → "0.500", "3/4" → "0.750"
  s = s.replace(/\b(\d+)\/(\d+)\b/g, (_, n, d) =>
    (parseInt(n) / parseInt(d)).toFixed(3)
  );
  return s;
}

function parseIngredientString(raw: string): ImportedRecipe["ingredients"][0] {
  const normalized = normalizeQuantityStr(raw.trim());
  const tokens = normalized.split(/\s+/);

  let qty: number | null = null;
  let unit: string | null = null;
  let nameStart = 0;

  // First token: leading number?
  const first = parseFloat(tokens[0]);
  if (!isNaN(first) && tokens.length > 1) {
    qty = first;
    nameStart = 1;

    // Second token: fraction part of a mixed number? e.g. "1 0.500 cups"
    if (tokens.length > 2) {
      const second = parseFloat(tokens[1]);
      if (!isNaN(second) && second < 1 && second > 0) {
        qty = first + second;
        nameStart = 2;
      }
    }

    // Next token after number(s): unit?
    if (nameStart < tokens.length) {
      const candidate = tokens[nameStart].toLowerCase().replace(/[.,]$/, "");
      if (INGREDIENT_UNITS.has(candidate)) {
        unit = candidate;
        nameStart++;
      }
    }
  }

  const namePart = tokens.slice(nameStart).join(" ").trim();
  if (!namePart) return { name: raw, quantity: null, unit: null, notes: null };

  // Split name / notes at first comma
  const commaIdx = namePart.indexOf(",");
  const name = commaIdx > -1 ? namePart.slice(0, commaIdx).trim() : namePart;
  const notes = commaIdx > -1 ? namePart.slice(commaIdx + 1).trim() || null : null;

  return { name, quantity: qty, unit, notes };
}

function parseIngredients(val: unknown): ImportedRecipe["ingredients"] {
  // Some older JSON-LD emits a single newline-separated string instead of an array
  if (typeof val === "string") {
    return val
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(parseIngredientString);
  }
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => {
      const raw = typeof item === "string" ? item.trim() : str(item as unknown);
      if (!raw) return null;
      return parseIngredientString(raw);
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);
}

function parseInstructions(val: unknown): ImportedRecipe["instructions"] {
  if (!val) return [];
  if (typeof val === "string") {
    return val.trim() ? [{ instruction: val.trim() }] : [];
  }
  if (!Array.isArray(val)) return [];

  const steps: ImportedRecipe["instructions"] = [];
  for (const item of val) {
    if (typeof item === "string") {
      if (item.trim()) steps.push({ instruction: item.trim() });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const type = str(obj["@type"] || "");

    // HowToSection — recurse into itemListElement to get the actual steps
    if (type === "HowToSection" || Array.isArray(obj.itemListElement)) {
      const nested = parseInstructions(obj.itemListElement);
      steps.push(...nested);
      continue;
    }

    // HowToStep or plain object
    const text = str(obj.text || obj.name || "");
    if (text) steps.push({ instruction: text });
  }
  return steps;
}
