# FullPantry — Implementation Plan

## Phase Overview

| Phase | Name | Description | Depends On |
|-------|------|-------------|------------|
| 0 | Foundation | Project setup, design system, PWA, base layout, Supabase | — |
| 1 | Recipes Core | Recipe data model, manual CRUD, detail view, serving adjustment | Phase 0 |
| 2 | Recipe Import | URL scraping (Cheerio + Gemini AI fallback), import flow | Phase 1 |
| 3 | Pantry | Pantry data model, CRUD, inventory view, categories | Phase 0 |
| 4 | Meal Planner | Weekly calendar, B/L/D/Snack slots, recipe assignment | Phases 1, 3 |
| 5 | Grocery List | Auto-generate from meal plan - pantry, store section grouping | Phases 3, 4 |
| 6 | AI Smart Features | "Plan my week", pantry-based suggestions, smart categorization | Phases 1-5 |
| 7 | Polish & Deploy | Animations, transitions, final PWA tuning, Vercel deploy | All |

---

## Phase 0 — Foundation
**Goal**: Bootable app with design system, navigation, Supabase connection, PWA ready.

### Tasks
1. Initialize Next.js 16 project with TypeScript
2. Configure Tailwind v4 (CSS-based config, custom design tokens)
3. Design system: typography, colors, spacing, shadows (NYT Cooking editorial feel)
   - Serif font for headings (e.g., Playfair Display, Lora, or similar)
   - Clean sans-serif for body (e.g., Inter, Source Sans)
   - Warm neutral palette with one accent color
   - Card component, button variants, input styles
4. Configure Serwist for PWA (manifest, service worker, icons)
5. Set up Supabase project + environment variables
6. Create Supabase client utilities (browser + server)
7. Base layout: mobile shell with bottom navigation (4 tabs)
8. Empty page shells for all routes (/recipes, /planner, /pantry, /groceries)
9. Set up Source of Truth (SOURCE_OF_TRUTH.md)
10. Responsive container that works on mobile + desktop

### Deliverables
- Running app with bottom nav, 4 empty pages, PWA installable
- Design system documented in code + Source of Truth
- Supabase connected and verified

---

## Phase 1 — Recipes Core
**Goal**: Full recipe CRUD with manual entry, browsable collection, serving adjustment.

### Database
- Create `recipes`, `recipe_ingredients`, `recipe_instructions` tables in Supabase
- Row-level security policies (single user for now, but structured for expansion)

### Features
1. **Recipe List Page** (`/recipes`)
   - Card grid/list view with recipe image, title, time, category
   - Search bar (search by title, ingredients, tags)
   - Filter by category (Breakfast, Lunch, Dinner, Snack, Dessert)
   - Favorite toggle
2. **Recipe Detail Page** (`/recipes/[id]`)
   - Hero image
   - Title, description, times, servings
   - Serving adjuster (slider or +/- buttons) that scales all ingredients live
   - Ingredient list with scaled quantities
   - Step-by-step instructions
   - Edit / Delete actions
3. **Add/Edit Recipe** (`/recipes/new`, `/recipes/[id]/edit`)
   - Form: title, description, servings, prep time, cook time
   - Dynamic ingredient list (add/remove/reorder)
   - Dynamic instruction steps (add/remove/reorder)
   - Category selector, tags input
   - Image upload (Supabase Storage)
   - Save/Cancel

### Serving Adjustment Logic
- Store original quantities in DB
- On display: multiply by (desired servings / original servings)
- Smart rounding (no "0.333 cups" — show "1/3 cup")
- Handle edge cases: "1 egg" at 1.5x = "2 eggs" (round up for discrete items)

### Deliverables
- Full recipe CRUD
- Beautiful recipe cards and detail view
- Working serving size adjustment
- Search and filter

---

## Phase 2 — Recipe Import
**Goal**: Paste a URL, get a fully structured recipe. Magic.

### Features
1. **Import Flow**
   - "Import from URL" button on recipes page
   - Paste/type URL input
   - Loading state with animation while extracting
   - Preview extracted recipe (user can edit before saving)
   - Save to collection

2. **Extraction Pipeline** (API Route)
   - Fetch target URL HTML (server-side)
   - **Pass 1 — JSON-LD**: Parse HTML with Cheerio, look for `<script type="application/ld+json">` with `@type: "Recipe"`. Extract structured fields. (~70% of major recipe sites have this)
   - **Pass 2 — AI Fallback**: If no JSON-LD found, send relevant HTML to Gemini Flash with structured extraction prompt. Returns JSON matching our recipe schema.
   - Normalize data: map extracted fields to our Recipe type
   - Return to client for preview

3. **Edge Cases**
   - Sites that block server-side fetching (handle gracefully with error message)
   - Recipes with non-standard formats
   - Multiple recipes on one page
   - Missing fields (times, servings) — provide defaults or let user fill in

### Deliverables
- URL import working for major recipe sites
- Preview + edit before save
- Graceful fallbacks for failures

---

## Phase 3 — Pantry
**Goal**: Full pantry inventory system with quantities, dates, and categories.

### Database
- Create `pantry_items` table in Supabase

### Features
1. **Pantry View** (`/pantry`)
   - Grouped by category (Produce, Dairy, Meat & Seafood, Grains & Pasta, Canned & Jarred, Spices, Frozen, Beverages, Other)
   - Each item shows: name, quantity + unit, purchase date
   - Visual indicator for items purchased > 7 days ago (may need using soon)
   - Search/filter within pantry
2. **Add/Edit Pantry Item**
   - Quick-add: name, quantity, unit, category
   - Optional: purchase date (defaults to today), expiry date
   - Smart unit suggestions based on item name
3. **Remove / Adjust**
   - Swipe to delete (mobile)
   - Quick quantity adjust (+/- buttons)
   - "Used it all" quick action
4. **Bulk Actions**
   - "Add from grocery list" — one-tap to transfer checked grocery items to pantry after shopping

### Deliverables
- Full pantry CRUD
- Category-grouped view
- Quick add/edit/remove interactions
- Freshness indicators

---

## Phase 4 — Meal Planner
**Goal**: Weekly calendar with B/L/D/Snack slots, recipe assignment.

### Database
- Create `meal_plans` table in Supabase

### Features
1. **Weekly View** (`/planner`)
   - 7-day calendar (Mon–Sun) with current week as default
   - Navigate between weeks (prev/next arrows)
   - Each day shows 4 slots: Breakfast, Lunch, Dinner, Snack
   - Compact cards showing recipe thumbnail + name in each slot
   - Empty slots show "+ Add Meal"
2. **Assign Recipe to Slot**
   - Tap empty slot → recipe picker (search your collection)
   - Select recipe → choose servings → confirm
   - Or: type a custom meal name (not from recipe collection)
3. **Edit/Remove Planned Meal**
   - Tap existing meal → options (change recipe, adjust servings, remove)
   - Long press to remove (mobile)
4. **Week Summary**
   - Quick stats: meals planned, meals remaining
   - "Generate Grocery List" button → feeds into Phase 5

### Deliverables
- Weekly planner view with all 4 meal slots
- Recipe picker for assigning meals
- Custom meal support
- Week navigation
- Smooth, intuitive mobile interactions

---

## Phase 5 — Grocery List
**Goal**: Auto-generated, pantry-aware grocery list grouped by store section.

### Database
- Create `grocery_lists` and `grocery_items` tables in Supabase

### Features
1. **Generate from Meal Plan**
   - "Generate Grocery List" from planner
   - Aggregates ALL ingredients from ALL planned meals for the week
   - Combines duplicates (2 recipes need onions → one "Onions: 3 total" line)
   - Subtracts pantry stock (you have 1 lb chicken, need 2 lbs → list shows 1 lb)
   - Smart unit conversion where possible (500ml + 1 cup → ~3 cups)
2. **Store Section Grouping**
   - Produce, Dairy & Eggs, Meat & Seafood, Bakery, Pantry Staples, Frozen, Beverages, Other
   - Each item categorized automatically (AI or lookup-based)
   - Collapsible sections
3. **Shopping Mode**
   - Clean checklist interface optimized for in-store use
   - Tap to check off items
   - Checked items move to bottom or gray out
   - Clear "Done Shopping" action
4. **Manual Additions**
   - Add non-recipe items to the list
   - Edit quantities
5. **Post-Shopping Integration**
   - "Add to Pantry" — transfers unchecked/remaining items to pantry
   - Prompts to update pantry quantities after shopping

### Deliverables
- Smart grocery list generation
- Pantry subtraction working
- Store section grouping
- In-store shopping checklist
- Pantry integration after shopping

---

## Phase 6 — AI Smart Features
**Goal**: The "smart" layer that makes FullPantry intelligent.

### Features
1. **"Plan My Week" AI**
   - Button in meal planner: "Suggest a meal plan"
   - Sends to Gemini: your recipe collection, pantry contents, preferences
   - AI generates a balanced week (variety, uses expiring pantry items first)
   - User reviews suggestions, can accept/reject/swap individual meals
   - Not all-or-nothing — granular control

2. **"What Can I Make?" (Pantry-Based Suggestions)**
   - Accessible from pantry or recipes page
   - Scans your pantry items against your recipe collection
   - Shows recipes you can make NOW with what you have
   - Shows recipes where you're only missing 1-2 items
   - Prioritizes recipes using items purchased longest ago

3. **Smart Grocery Categorization**
   - When ingredients are added (manual or imported), auto-suggest store section
   - Uses Gemini to categorize ambiguous items
   - Learns from user corrections over time (optional, stretch)

4. **Recipe Suggestions**
   - "Discover" — based on what you cook often, suggest new recipes to try
   - (Stretch goal — could use recipe embeddings in Supabase pgvector)

### Deliverables
- AI meal plan generation with review/edit flow
- Pantry-based recipe matching
- Intelligent grocery categorization

---

## Phase 7 — Polish & Deploy
**Goal**: Production-ready, beautiful, performant.

### Tasks
1. **Animations & Transitions**
   - Page transitions (smooth, not jarring)
   - Card enter/exit animations
   - Micro-interactions (button presses, toggle switches, check-offs)
   - Loading skeletons (not spinners)
   - Pull-to-refresh on mobile
2. **Performance**
   - Image optimization (next/image, Supabase image transforms)
   - Lazy loading for recipe cards
   - Offline support via service worker (view cached recipes/lists without internet)
3. **PWA Polish**
   - App icons at all sizes
   - Splash screens
   - Standalone mode testing on iOS and Android
   - Add to homescreen prompt
4. **Desktop Responsiveness**
   - Sidebar navigation on wider screens
   - Multi-column layouts where appropriate
   - Recipe detail page uses horizontal space well
5. **Error Handling**
   - Graceful errors for all API calls
   - Offline indicators
   - Empty states that are helpful, not sad
6. **Deploy to Vercel**
   - Environment variables configured
   - Supabase connection verified in production
   - PWA verified on real devices

### Deliverables
- Polished, production-ready app
- Deployed and accessible
- Works beautifully on phone and desktop
- Installable PWA

---

## Decisions (Locked In)
1. **Navigation**: 4 bottom tabs — Recipes, Planner, Pantry, Groceries (no dashboard)
2. **Recipe categories**: Expanded — Breakfast, Lunch, Dinner, Snack, Dessert, Appetizer, Side Dish, Drink, Sauce/Dressing
3. **Color accent**: Terracotta/Rust — warm, earthy, NYT Cooking editorial feel. Paired with cream backgrounds and charcoal text.
4. **Week start**: Sunday
5. **AI meal suggestions**: ONLY suggest Breakfast, Lunch, Dinner (not snacks/desserts/etc.). Suggestions should be healthy-leaning and protein-rich, but realistic — not every meal needs a vegetable. Match real-world eating patterns (scrambled eggs on toast is a valid breakfast, pesto pasta with chicken is a valid dinner). Practical weeknight cooking, not aspirational wellness content.
