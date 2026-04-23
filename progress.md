# FullPantry — Progress Tracker

## Phase 0 — Foundation ✅ COMPLETE
**Completed**: 2026-04-14

### What was built
- Next.js 16.2.3 project initialized (TypeScript, Tailwind v4, App Router, Turbopack)
- Full design system in `globals.css` (terracotta/rust palette, warm cream backgrounds, editorial typography tokens)
- Playfair Display (serif) + Inter (sans) Google Fonts loaded
- Supabase client utilities: `lib/supabase/client.ts` (browser) + `lib/supabase/server.ts` (server)
- Next.js 16 proxy (`proxy.ts`) for Supabase session refresh on every request
- Basic service worker (`public/sw.js`) for PWA installability
- PWA manifest (`public/manifest.json`) with terracotta theme color
- Root layout with fonts, metadata, viewport, PWA tags, service worker registration
- Bottom navigation (4 tabs: Recipes, Planner, Pantry, Groceries) with active indicator
- PageShell + PageHeader layout components
- Full UI component library: Button, Card, Input, Textarea, Select, Badge, LoadingSkeleton, EmptyState
- Core types: `lib/types.ts` (Recipe, Ingredient, PantryItem, MealPlan, GroceryList, etc.)
- Utilities: `lib/utils.ts` (cn, date helpers, formatQuantity, formatTime, etc.)
- All 4 page shells: /recipes, /planner, /pantry, /groceries
- Root / redirects to /recipes
- `.env.local`, `.env.example`, `.gitignore`

### Lessons learned
- Lesson 1: Next.js 16 breaking changes (Turbopack default, middleware→proxy, multiple lockfiles)
- Lesson 2: React.ReactNode && "class" in cn() — use !!reactNode instead

### Build status
✅ `next build` passes — all 6 routes compiled clean (static)

---

## Phases 1–7 — See completed sections below

### Design polish (2026-04-15)
User feedback after Phase 0 test: "looks INSANELY AI Vibe coded." Full anti-vibe-code redesign pass:
- **PageHeader**: Left terracotta accent bar, serif 4xl heading, small-caps tracked subtitle (no decorative rule)
- **BottomNav**: Frosted glass (`bg-fp-surface/90` + blur), active dot indicator, uppercase 9px tracked labels
- **EmptyState**: Horizontal rule + icon section divider, large italic serif headline (left-aligned), no icon box
- **All 4 page shells**: Editorial copy + inline button+text-link CTAs (not stacked buttons)
- Build verified: `next build` ✅ all 6 routes static, TypeScript clean

**Phase 0 is fully complete.** Design passes editorial quality bar.

---

## Phase 1 — Recipes Core ✅ COMPLETE
**Started**: 2026-04-15
**Build status**: ✅ `next build` passes — 11 routes, TypeScript clean

### What was built
- `lib/supabase/admin.ts` — service role client (bypasses RLS, server-only)
- `lib/serving.ts` — serving scale logic: scaleQuantity, toFractionString, formatIngredientQuantity, formatServingLabel. Handles discrete items (eggs, cans → ceil), unicode fractions (⅛ ¼ ⅓ ½ ¾ etc), snap threshold 0.07
- `app/api/recipes/route.ts` — GET list (newest first), POST create (recipe + ingredients + instructions in one call)
- `app/api/recipes/[id]/route.ts` — GET single (with ingredients + instructions), PUT update (partial-safe: only replaces ingredients/instructions if key present in body), DELETE
- `app/api/upload/route.ts` — POST image upload to Supabase Storage bucket `recipe-images` (auto-creates bucket if missing, admin client)
- `components/recipes/RecipeCard.tsx` — grid card: image (4:3 aspect, placeholder emoji), category small-caps, serif title, time, favorite heart button (optimistic)
- `components/recipes/RecipeGrid.tsx` — client component: search input, scrollable category filter pills, 2-col grid (3-col sm), optimistic favorite toggle via PUT, no-results state
- `components/recipes/ServingAdjuster.tsx` — client: +/- buttons, clamped 1–99, calls onChange
- `components/recipes/IngredientList.tsx` — scaled quantities right-aligned in terracotta, name, optional notes
- `components/recipes/InstructionSteps.tsx` — numbered steps with terracotta circle badges
- `components/recipes/RecipeForm.tsx` — client: full create/edit form. Sections: Photo (upload+preview), About (title/category/description), Times & Servings, Ingredients (dynamic rows: qty/name/unit/notes/delete), Instructions (numbered textarea rows with up/down/delete), Optional (tags comma-sep, source URL). Validation. Image upload to /api/upload on submit.
- `components/recipes/RecipeDetail.tsx` — client: hero image, title+category, favorite/edit/delete action buttons, stats bar (prep/cook/total + ServingAdjuster right-aligned), Ingredients section, Instructions section, tag pills, source link
- `app/recipes/page.tsx` — server component: fetches all recipes, shows RecipeGrid or EmptyState
- `app/recipes/[id]/page.tsx` — server component: fetches recipe + ingredients + instructions, passes to RecipeDetail, back link
- `app/recipes/new/page.tsx` — static page wrapping RecipeForm (no initialData)
- `app/recipes/[id]/edit/page.tsx` — server component: fetches full recipe data, hydrates RecipeForm
- `supabase/migrations/001_initial_schema.sql` — DDL for recipes, recipe_ingredients, recipe_instructions tables + indexes + updated_at trigger + RLS disabled

### ⚠️ PENDING — User must complete before testing
1. **Run SQL migration** in Supabase Dashboard → SQL Editor → paste contents of `supabase/migrations/001_initial_schema.sql` → Run
2. **Verify Supabase tables exist** in Table Editor: recipes, recipe_ingredients, recipe_instructions
3. **Start dev server**: `node node_modules/next/dist/bin/next dev --port 3001`
4. **Test recipe CRUD** (see phase-1-tests.txt when generated)

### Known issues / notes
- Agent file path bug: agents wrote to Windows paths (C:/...) instead of Linux paths (/root/...). Files written to /root/Projects/fullpantry/ directly via Bash. **Lesson: always use Bash `cat >` for file creation when working in WSL.**
- `params` in Next.js 16 dynamic routes are Promises — all pages/routes use `await params` pattern correctly
- PUT handler is partial-update safe: only replaces ingredients/instructions if those keys are present in request body (enables favorite toggle without destroying ingredients)
- Gemini key format `AQ.` is valid — Google AI Studio changed format recently from `AIza`

### Phase 1 testing (2026-04-16)

- ✅ Dev server running on port 3001
- ✅ Recipes page loads from Supabase (empty state → grid after first recipe)
- ✅ Add Recipe form: all sections render correctly (Photo, About, Times & Servings, Ingredients, Instructions, Optional Details)
- ✅ Recipe saved to Supabase and redirected to detail page
- ✅ Recipe detail page: category label, serif title, stats bar, ingredients, instructions
- ✅ Serving adjuster: 4→6 live-scales 200g spaghetti → 300g
- ✅ Recipe grid: card with placeholder emoji, category small-caps, serif title, time, heart button
- ✅ Category filter pills scrollable, "All" active by default
- ✅ Search bar present

**Phase 1 is COMPLETE. ✅**

---

## Phase 2 — Recipe Import ✅ COMPLETE
**Completed**: 2026-04-17
**Build status**: ✅ `next build` passes — 12 routes, TypeScript clean

### What was built
- `@google/generative-ai` installed
- `lib/gemini.ts` — Gemini 2.5 Flash client. Strips HTML noise, structured JSON extraction prompt, sanitizes category + image_url in response
- `lib/scraper.ts` — Two-pass extraction: Cheerio JSON-LD first, Gemini fallback. Handles HowToSection nesting, number-array recipeYield, plain-string recipeIngredient, array keywords
- `app/api/import/route.ts` — POST /api/import with SSRF protection (blocks all private IP ranges)
- `components/recipes/ImportModal.tsx` — 4-state modal with AbortController, preview card, error messages
- `components/recipes/ImportButton.tsx` — "button" and "link" variants for header + empty state
- `lib/types.ts` — Added `ImportedRecipe` type
- `app/recipes/new/page.tsx` — Client component, reads sessionStorage import draft on `?from=import`
- `components/recipes/RecipeForm.tsx` — `importDraft` prop pre-populates all form fields

### Edge case fixes applied
- SSRF protection, HowToSection nesting, AbortController on close, `new URL()` crash guard, double-submit prevention, category validation, relative image filtering, plain-string ingredients, number-array servings, keywords array support, sessionStorage try/catch, title line-clamp
- Lesson 7 (found during testing): `next.config.ts` needed `{ protocol: "https", hostname: "**" }` wildcard for imported recipe images (Cloudinary, Imgix, etc.)

### User testing result (2026-04-17)
✅ Sections 1–9 all passed
- AllRecipes/Simply/Serious Eats block bots (expected — error message works correctly)
- America's Test Kitchen imported successfully end-to-end
- Section 10 (optional): Chicago Tribune fails due to JS rendering — correct behavior, "recipe not found" shown

**Phase 2 is COMPLETE and USER CONFIRMED. ✅**

### Final test results (2026-04-17)
- ✅ All Sections 1–9 passed
- ✅ Section 10 (Gemini fallback): smittenkitchen.com/2007/10/pumpkin-butter-and-pepita-granola/ — extracted correctly, no image (expected — custom WP theme doesn't expose image URLs)
- ✅ Ingredient parser (3h): qty/unit auto-populated from JSON-LD raw strings
- Known limitation: JS-rendered sites (Chicago Tribune) and bot-blocking sites (AllRecipes) return graceful errors

---

## Phase 3 — Pantry 🔄 AWAITING USER TESTING
**Started**: 2026-04-17
**Build status**: ✅ `next build` passes — 14 routes, TypeScript clean

### What was built
- `supabase/migrations/002_pantry.sql` — `pantry_items` table (name, qty, unit, category, purchased_date, expiry_date, notes, timestamps). Reuses `update_updated_at_column` trigger from migration 001.
- `lib/units.ts` — `suggestUnits(itemName)` keyword lookup table (~60 entries). Suggests ordered units per ingredient type. `ALL_UNITS` list for datalist autocomplete.
- `app/api/pantry/route.ts` — GET (all items, order by name) + POST (create, defaults: qty=1, unit="", category="other")
- `app/api/pantry/[id]/route.ts` — PUT (partial update, only keys present in body) + DELETE (204 no content)
- `components/pantry/PantryItem.tsx` — Item row: freshness dot (green/amber/red based on days since purchased), name, qty+unit, "Used it" quick-delete button, pencil edit button. Freshness: <7d=green, 7–14d=amber/"Use soon", >14d=red/"Check this"
- `components/pantry/PantryGroup.tsx` — Category section: icon + label + count header, list of PantryItems
- `components/pantry/AddPantryItemSheet.tsx` — Bottom sheet add/edit: unit suggestion chips (tap to select), 2-col category grid, purchased/expiry date fields, notes. Edit mode shows delete button (right-aligned). Escape + backdrop click close.
- `app/pantry/page.tsx` — Full client component. Loads from API, optimistic upserts. Search bar with clear button. Items grouped by PANTRY_CATEGORIES order. Header shows "X items · Y need attention". Floating FAB (bottom-24) when items exist. Extra pb-32 to scroll clear of FAB.

### Edge case fixes
- "Used it" quick-delete was only removing from local state — now calls DELETE API optimistically before removing from UI

### Additional features added during testing
- **Auto-expiry suggestion**: selecting a category auto-fills the expiry date (produce=7d, dairy=14d, meat=3d, frozen=180d, canned=2yr, etc.). Tracks `expiryUserSet` ref so switching categories won't overwrite a manually entered date.
- **Safe-area-inset-top**: added `env(safe-area-inset-top, 0px)` to `<main>` in layout.tsx — prevents content from rendering behind Dynamic Island / notch on modern iPhones. Bottom nav already had bottom safe area.

### User testing result (2026-04-17)
✅ All core flows verified in Chrome:
- Empty state → add item → category grouping → freshness indicators
- Search filters correctly, X clears
- Edit sheet pre-fills all fields, unit chips highlight, save updates list
- "Used it" removes from UI and DB (confirmed fix worked)
- Validation shows error for empty name and bad quantity
- Auto-expiry: Produce → 04/24, Frozen → 10/14 (correct)

**Phase 3 is COMPLETE. ✅**

## Phase 4 — Meal Planner ✅ COMPLETE
**Completed**: 2026-04-17

### What was built
- `supabase/migrations/003_meal_planner.sql` — `meal_plans` table (date, meal_slot, recipe_id FK, custom_meal_name, servings, notes). Unique constraint on (date, meal_slot). updated_at trigger. RLS disabled.
- `app/api/planner/route.ts` — GET (7-day fetch by week param, recipe join) + POST (upsert by date+slot)
- `app/api/planner/[id]/route.ts` — DELETE (204)
- `components/planner/WeekGrid.tsx` — 7-day compact grid, week nav arrows, slot dots, today + selected day highlights
- `components/planner/MealSlotCard.tsx` — empty (dashed) and filled (accent bg, recipe name, servings) states
- `components/planner/DayMeals.tsx` — day header + 4 MealSlotCards
- `components/planner/RecipePickerScreen.tsx` — full-screen picker: search, category filters, 2-col recipe grid, custom meal input, confirm bottom sheet with servings stepper
- `app/planner/page.tsx` — client component, manages weekStart/selectedDay/mealsByDate/pickerTarget state

### Edge cases fixed
- `toISODate()` rewritten to use local date components (was UTC — wrong date in negative-offset timezones)
- `today` const moved inside WeekGrid component (was module-level, stale after midnight)
- DELETE now awaited with optimistic rollback on failure
- API rejects saves with neither recipe_id nor custom_meal_name
- Servings preserved from existing plan when editing same recipe
- Error feedback shown in confirm panel on save failure

### User testing (2026-04-17)
✅ All flows verified — week nav, recipe picker, custom meal, delete, persistence after hard refresh.

**Phase 4 is COMPLETE. ✅**

## Phase 5 — Grocery List ✅ COMPLETE
**Completed**: 2026-04-17

### What was built

**Database**
- `supabase/migrations/004_grocery_list.sql` — `grocery_lists` (name, week_start, created_at) and `grocery_items` (list_id FK, name, qty, unit, section/category, checked, recipe_id) tables. Items cascade-delete with their list. RLS disabled.

**Core library**
- `lib/grocery.ts` — unit conversion to ml/g base units, `aggregateIngredients` (sums quantities across all meal plan recipes for the week, handles different units for the same ingredient), `subtractPantry` (fuzzy name match + base-unit math to deduct what's already stocked), `categorizeIngredient` (word-boundary regex keyword lookup → GroceryCategory, prevents false positives like "chicken breast" matching "breast" alone), `formatGroceryQty` (smart display rounding), `cleanDisplayName` (strips prep notes like "finely chopped", "at room temperature" from display names)
- `lib/types.ts` — added `GroceryList`, `GroceryItem` types, `GROCERY_CATEGORIES` constant, `GroceryCategory` union type

**API routes**
- `app/api/groceries/route.ts` — GET all grocery lists (up to 3) with items joined
- `app/api/groceries/generate/route.ts` — POST: fetches next 7 days of meal plans, aggregates all recipe ingredients, subtracts pantry stock, writes grocery_items grouped by category. Enforces 3-list cap: deletes oldest list if at cap, or replaces existing same-week list on regenerate.
- `app/api/groceries/[id]/route.ts` — DELETE a grocery list (cascades to all items)
- `app/api/groceries/[id]/items/route.ts` — POST manually add item; auto-categorizes via `categorizeIngredient`
- `app/api/groceries/[id]/items/[itemId]/route.ts` — PUT update item (check/uncheck, qty, name, unit); DELETE remove item

**Page & components**
- `app/groceries/page.tsx` — client component: lists/activeId state, generate button triggers API then refreshes, list tabs for switching between saved lists, items grouped into collapsible sections, check→AddToPantrySheet flow, floating FAB for manual add
- `components/groceries/GroceryListHeader.tsx` — tab switcher (up to 3 tabs) with generate button and delete-active-list button
- `components/groceries/GrocerySection.tsx` — collapsible category section with item count badge in header
- `components/groceries/GroceryItem.tsx` — checkbox row: check circle triggers AddToPantrySheet, swipe/button deletes item, strikethrough on checked state
- `components/groceries/AddToPantrySheet.tsx` — bottom sheet shown on item check: pre-fills qty from grocery item, adjustable stepper, submits to pantry API (increments existing pantry item if name matches)
- `components/groceries/AddGroceryItemSheet.tsx` — bottom sheet for manual add: name, qty, unit, auto-categorized section shown with override category pills

### Key decisions
- **7-day window**: generate always uses the next 7 calendar days of meal plans (starting today)
- **3-list cap**: maximum 3 saved grocery lists; oldest is deleted when cap is hit; regenerating for the same week replaces that list rather than creating a duplicate
- **Pantry subtraction**: pantry items matched by name (case-insensitive, trimmed) and deducted in base units (ml for volume, g for weight) before writing grocery items; items fully covered by pantry are omitted
- **Per-item check→pantry flow**: checking an item opens AddToPantrySheet for quantity confirmation before adding to pantry — no bulk "mark all as bought" shortcut
- **Word-boundary categorization**: `categorizeIngredient` uses `\b` regex word boundaries to prevent false positives (e.g. "chicken breast" would not be miscategorized by a partial match on "breast")

### Bugs fixed during testing
1. **Categorization false positives**: short keywords were matching inside longer ingredient names (e.g. "extra virgin olive oil" → wrong category). Fixed by wrapping all keyword patterns in `\bkeyword\b` word-boundary regex.
2. **Duplicate list on regenerate**: clicking Generate twice for the same week created two lists instead of replacing the existing one. Fixed by checking for an existing list with the same `week_start` date and deleting it before inserting the new one.
3. **Bottom sheet hidden behind nav**: AddToPantrySheet and AddGroceryItemSheet were partially obscured by the fixed bottom navigation bar. Fixed by increasing sheet z-index and adding `pb-20` (nav height) padding to sheet content.
4. **Prep notes in item names**: ingredient names like "garlic, minced" or "butter, softened" were displayed verbatim. Fixed in `cleanDisplayName` by stripping comma-separated prep notes and common adjective phrases.
5. **Categorization with parenthetical notes**: items with parenthetical notes (e.g. "flour (all-purpose)") were not matching any category. Fixed by stripping parenthetical content before keyword lookup in `categorizeIngredient`.

### User testing result (2026-04-17)
✅ All core flows verified:
- Generate list from meal plans → correct items, quantities, pantry subtraction working
- Collapsible sections, item counts, category grouping correct
- Check item → AddToPantrySheet opens, qty pre-filled, save adds to pantry
- Delete item and delete entire list both work
- Manual add FAB → AddGroceryItemSheet → item appears in correct section
- 3-list cap enforced: generating a 4th deletes oldest
- Regenerate same week replaces existing list (no duplicate)

**Phase 5 is COMPLETE. ✅**

---

## Phase 8 — Friction Reduction Pass 🔄 IN PROGRESS
**Started**: 2026-04-22

Six sub-phases targeting the friction that keeps the app from being used daily. See `plan.md` for full detail.

- **8.1** Seed recipe library (25 recipes: Weissman / Babish / Hazan / staples) — `lib/seed-recipes/` JSON + `/recipes/library` browser
- **8.2** Pantry quick-decrement ✅ — "Use 1" button on discrete items, "Used it" on continuous, 4s undo toast on auto-delete. All 18 tests passed. Functional updater pattern fixes rapid-tap stale closure.
- **8.3** "Cook this" flow — `CookConfirmSheet` pre-fills from pantry, atomic decrement, `meal_plans.cooked_at` schema add
- **8.4** Paste-a-recipe tab inside `ImportModal` → Gemini free-form parse → existing hydration path
- **8.5** Leftover-aware banner on Planner — expiring pantry items → filtered recipe search
- **8.6** Gentle planning nudge — Fri/Sat/Sun banner when current week has <3 dinners planned

**Implementation order**: 8.2 → 8.3 → 8.1 → 8.4 → 8.5 → 8.6

**Deferred to Phase 9**: AI "Plan my week" one-tap draft, rolling daily planner, easy-weeknight tags.

## Phase 9 — AI Plan My Week ⏳ NOT STARTED
## Phase 10 — Polish & Deploy (v2) ⏳ NOT STARTED
