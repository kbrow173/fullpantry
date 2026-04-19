import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ImportedRecipe, RecipeCategory, GroceryCategory } from "@/lib/types";

const VALID_CATEGORIES = new Set<RecipeCategory>([
  "breakfast", "lunch", "dinner", "snack", "dessert",
  "appetizer", "side-dish", "drink", "sauce-dressing",
]);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EXTRACTION_PROMPT = `You are a recipe data extractor. Extract the recipe from the following HTML and return ONLY valid JSON with this exact structure — no markdown, no explanation, just the JSON object:

{
  "title": "Recipe title",
  "description": "Brief 1-2 sentence description or null",
  "category": "dinner",
  "servings": 4,
  "prep_time": 15,
  "cook_time": 30,
  "image_url": null,
  "tags": ["tag1", "tag2"],
  "ingredients": [
    { "name": "all-purpose flour", "quantity": 2, "unit": "cups", "notes": "sifted" }
  ],
  "instructions": [
    { "instruction": "Full text of step 1." }
  ]
}

Rules:
- category must be exactly one of: breakfast, lunch, dinner, snack, dessert, appetizer, side-dish, drink, sauce-dressing
- servings must be a number or null. Parse "serves 4", "4 servings", "makes 12 cookies" etc.
- prep_time and cook_time are integers in MINUTES or null. Parse ISO durations (PT30M = 30) or plain text ("30 minutes" = 30, "1 hour" = 60, "1.5 hours" = 90)
- quantity must be a number or null. Convert: "1/2" → 0.5, "1½" → 1.5, "¼" → 0.25, "one" → 1
- unit is the unit of measure string or null (e.g. "cup", "tbsp", "tsp", "oz", "lb", "g", "ml", "clove", "can")
- notes is preparation details like "finely chopped", "at room temperature", "divided" — or null
- tags should be 3-6 relevant keywords: cuisine type, diet type, main ingredient, cooking method
- image_url: extract the main recipe image URL if present in HTML, otherwise null
- Return ONLY the JSON object. Do not wrap in markdown code blocks.

HTML content:`;

export async function extractRecipeWithGemini(
  html: string
): Promise<ImportedRecipe | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    // Strip down to relevant content — remove noise, keep body
    const stripped = stripHtml(html);
    const prompt = `${EXTRACTION_PROMPT}\n\n${stripped}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip any accidental markdown fences
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const data = JSON.parse(clean) as ImportedRecipe;

    if (!data.title || !Array.isArray(data.ingredients) || !Array.isArray(data.instructions)) {
      return null;
    }

    // Sanitize category — reject any value Gemini invented that's not in our set
    if (data.category && !VALID_CATEGORIES.has(data.category)) {
      data.category = null;
    }

    // Reject relative image URLs — they can't be used by Next.js <Image>
    if (data.image_url && !data.image_url.startsWith("http")) {
      data.image_url = null;
    }

    return data;
  } catch {
    return null;
  }
}

// ─── Grocery Categorization ────────────────────────────────────

const VALID_GROCERY_CATS = new Set<GroceryCategory>([
  "produce", "dairy-eggs", "meat-seafood", "bakery",
  "pantry-staples", "frozen", "beverages", "other",
]);

export async function categorizeGroceryItems(
  names: string[]
): Promise<Record<string, GroceryCategory>> {
  if (names.length === 0) return {};
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    });
    const prompt = `For each grocery item listed below, return the best grocery store section.
Valid sections only: produce, dairy-eggs, meat-seafood, bakery, pantry-staples, frozen, beverages, other
Return ONLY a JSON object mapping each item name exactly to its section. No markdown, no explanation.

Items:
${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const raw = JSON.parse(text) as Record<string, string>;
    const out: Record<string, GroceryCategory> = {};
    for (const [name, cat] of Object.entries(raw)) {
      out[name] = VALID_GROCERY_CATS.has(cat as GroceryCategory)
        ? (cat as GroceryCategory)
        : "other";
    }
    return out;
  } catch {
    return {};
  }
}

// ─── Meal Plan Suggestions ────────────────────────────────────

export async function suggestMealPlan(
  emptySlots: { date: string; dayName: string; slot: string }[],
  recipes: { id: string; title: string; category: string; tags: string[]; description: string | null }[],
  pantryItemNames: string[]
): Promise<{ date: string; slot: string; recipe_id: string }[]> {
  if (emptySlots.length === 0 || recipes.length === 0) return [];
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    });

    const recipeList = recipes
      .map((r) => `- ID:${r.id} | "${r.title}" | category:${r.category} | tags:${r.tags.join(",")}`)
      .join("\n");
    const pantryStr = pantryItemNames.length > 0 ? pantryItemNames.join(", ") : "none";
    const slotList = emptySlots.map((s) => `- ${s.dayName} ${s.date}: ${s.slot}`).join("\n");

    const prompt = `You are a meal planning assistant. Suggest meals for the empty slots using ONLY the recipe IDs provided.

Rules:
- Use ONLY recipe IDs from the list below — never invent IDs
- Match category: breakfast recipes for breakfast slots; lunch/dinner recipes for lunch or dinner slots
- No duplicate recipes across the week
- Prefer recipes that use pantry items
- Fill every empty slot if possible
- Return ONLY a JSON array, no markdown

Return format: [{"date":"YYYY-MM-DD","slot":"breakfast","recipe_id":"exact-uuid"}]

Available recipes:
${recipeList}

Pantry items: ${pantryStr}

Empty slots to fill:
${slotList}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const data = JSON.parse(text) as { date: string; slot: string; recipe_id: string }[];

    const validIds = new Set(recipes.map((r) => r.id));
    const validSlotKeys = new Set(emptySlots.map((s) => `${s.date}:${s.slot}`));
    const validSlots = new Set(["breakfast", "lunch", "dinner", "snack"]);

    return data.filter(
      (s) =>
        validIds.has(s.recipe_id) &&
        validSlotKeys.has(`${s.date}:${s.slot}`) &&
        validSlots.has(s.slot)
    );
  } catch {
    return [];
  }
}

function stripHtml(html: string): string {
  // Remove script/style content, collapse whitespace
  const noScripts = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Gemini 2.5 Flash has a huge context window — 60K chars is safe and fast
  return noScripts.slice(0, 60000);
}
