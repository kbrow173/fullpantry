/**
 * FullPantry — Core TypeScript Types
 * All shared types and interfaces for the application.
 * Source of Truth: SOURCE_OF_TRUTH.md
 */

// ─── Recipe Types ────────────────────────────────────

export type RecipeCategory =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "dessert"
  | "appetizer"
  | "side-dish"
  | "drink"
  | "sauce-dressing";

export const RECIPE_CATEGORIES: { value: RecipeCategory; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "dessert", label: "Dessert" },
  { value: "appetizer", label: "Appetizer" },
  { value: "side-dish", label: "Side Dish" },
  { value: "drink", label: "Drink" },
  { value: "sauce-dressing", label: "Sauce / Dressing" },
];

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  servings: number;
  prep_time: number | null; // minutes
  cook_time: number | null; // minutes
  total_time: number | null; // minutes
  source_url: string | null;
  image_url: string | null;
  category: RecipeCategory;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations (optional, loaded on demand)
  ingredients?: RecipeIngredient[];
  instructions?: RecipeInstruction[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: GroceryCategory | null; // for grocery list grouping
  order_index: number;
  notes: string | null; // e.g. "finely chopped", "at room temperature"
}

export interface RecipeInstruction {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
}

// For recipe forms (creating/editing)
export type RecipeIngredientDraft = Omit<RecipeIngredient, "id" | "recipe_id">;
export type RecipeInstructionDraft = Omit<RecipeInstruction, "id" | "recipe_id">;

export interface RecipeDraft {
  title: string;
  description: string;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
  category: RecipeCategory;
  tags: string[];
  source_url: string;
  image_url: string;
  ingredients: RecipeIngredientDraft[];
  instructions: RecipeInstructionDraft[];
}

// ─── Pantry Types ────────────────────────────────────

export type PantryCategory =
  | "produce"
  | "dairy-eggs"
  | "meat-seafood"
  | "grains-pasta"
  | "canned-jarred"
  | "spices-condiments"
  | "frozen"
  | "beverages"
  | "bakery"
  | "snacks"
  | "other";

export const PANTRY_CATEGORIES: { value: PantryCategory; label: string; icon: string }[] = [
  { value: "produce", label: "Produce", icon: "🥦" },
  { value: "dairy-eggs", label: "Dairy & Eggs", icon: "🥛" },
  { value: "meat-seafood", label: "Meat & Seafood", icon: "🥩" },
  { value: "grains-pasta", label: "Grains & Pasta", icon: "🌾" },
  { value: "canned-jarred", label: "Canned & Jarred", icon: "🥫" },
  { value: "spices-condiments", label: "Spices & Condiments", icon: "🧂" },
  { value: "frozen", label: "Frozen", icon: "🧊" },
  { value: "beverages", label: "Beverages", icon: "🥤" },
  { value: "bakery", label: "Bakery", icon: "🍞" },
  { value: "snacks", label: "Snacks", icon: "🍿" },
  { value: "other", label: "Other", icon: "📦" },
];

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: PantryCategory;
  purchased_date: string | null; // ISO date string
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Grocery Types ────────────────────────────────────

export type GroceryCategory =
  | "produce"
  | "dairy-eggs"
  | "meat-seafood"
  | "bakery"
  | "pantry-staples"
  | "frozen"
  | "beverages"
  | "other";

export const GROCERY_CATEGORIES: { value: GroceryCategory; label: string; icon: string }[] = [
  { value: "produce", label: "Produce", icon: "🥦" },
  { value: "dairy-eggs", label: "Dairy & Eggs", icon: "🥛" },
  { value: "meat-seafood", label: "Meat & Seafood", icon: "🥩" },
  { value: "bakery", label: "Bakery", icon: "🍞" },
  { value: "pantry-staples", label: "Pantry Staples", icon: "🫙" },
  { value: "frozen", label: "Frozen", icon: "🧊" },
  { value: "beverages", label: "Beverages", icon: "🥤" },
  { value: "other", label: "Other", icon: "🛒" },
];

export interface GroceryList {
  id: string;
  name: string;
  week_start_date: string; // ISO date string (Sunday)
  is_active: boolean;
  created_at: string;
  items?: GroceryItem[];
}

export interface GroceryItem {
  id: string;
  grocery_list_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: GroceryCategory;
  is_checked: boolean;
  source_recipe_id: string | null;
  notes: string | null;
}

// ─── Meal Plan Types ────────────────────────────────────

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_SLOTS: { value: MealSlot; label: string; icon: string }[] = [
  { value: "breakfast", label: "Breakfast", icon: "☀️" },
  { value: "lunch", label: "Lunch", icon: "🌤️" },
  { value: "dinner", label: "Dinner", icon: "🌙" },
  { value: "snack", label: "Snack", icon: "🍎" },
];

export interface MealPlan {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  meal_slot: MealSlot;
  recipe_id: string | null;
  custom_meal_name: string | null;
  servings: number;
  notes: string | null;
  created_at: string;
  // Joined
  recipe?: Recipe | null;
}

// Week structure for the planner
export interface WeekPlan {
  weekStart: string; // ISO date string of the Sunday
  days: DayPlan[];
}

export interface DayPlan {
  date: string;
  dayName: string; // "Sunday", "Monday", etc.
  meals: {
    breakfast: MealPlan | null;
    lunch: MealPlan | null;
    dinner: MealPlan | null;
    snack: MealPlan | null;
  };
}

// ─── API Response Types ────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string;
}

export interface ApiSuccess<T> {
  data: T;
}

// ─── Recipe Import Types ────────────────────────────────────────────

export interface ImportedRecipe {
  title: string;
  description?: string | null;
  category?: RecipeCategory | null;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  source_url?: string | null;
  image_url?: string | null;
  tags?: string[];
  ingredients: Array<{
    name: string;
    quantity?: number | null;
    unit?: string | null;
    notes?: string | null;
  }>;
  instructions: Array<{
    instruction: string;
  }>;
}

// ─── Serving Calculation Types ────────────────────────────────────

export interface ScaledIngredient extends RecipeIngredient {
  scaledQuantity: number | null;
  scaledDisplay: string; // e.g. "1½ cups", "3 eggs", "¼ tsp"
}
