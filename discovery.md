# FullPantry — Discovery Document

## Project Vision
A mobile-first PWA for recipe management, meal planning, pantry tracking, and smart grocery list generation. Designed to be the single app that answers: "What should I cook, what do I have, and what do I need to buy?"

## Target User
Single user (expandable to multi-user later). Someone who cooks regularly, wants to reduce food waste, and hates the mental load of meal planning and grocery shopping.

## Core Features (MVP)

### 1. Recipe Management
- Manual recipe creation (title, ingredients, instructions, times, servings, image, tags)
- URL import — paste a link, app extracts the recipe automatically
- Hybrid extraction: Cheerio JSON-LD first (free), Gemini AI fallback
- Adjustable serving sizes — scale all ingredient quantities up/down
- Browse, search, filter, favorite recipes

### 2. Pantry Tracker
- Full inventory: item name, quantity, unit, purchase date
- Category-based organization (Produce, Dairy, Meat, Grains, etc.)
- Manual add/edit/remove
- Auto-deduct when meals are "cooked" from the planner
- Visual indicators for items that may be running low or expiring

### 3. Meal Planner
- Weekly calendar view (Mon-Sun)
- Four slots per day: Breakfast, Lunch, Dinner, Snack (optional)
- Manual: pick from your recipe collection and assign to slots
- AI-assisted: "Plan my week" generates suggestions based on your recipes, pantry, and preferences
- Adjustable servings per planned meal
- Ability to add ad-hoc meals (not from recipe collection)

### 4. Smart Grocery List
- Auto-generated from meal plan ingredients minus pantry stock
- Grouped by store section (Produce, Dairy, Meat & Seafood, Bakery, Pantry Staples, Frozen, Beverages, Other)
- Checkable items for in-store use
- Manual add/edit for non-recipe items
- Quantity aggregation (if two recipes need chicken, combine into one line item)

### 5. AI Smart Features
- Recipe extraction from URLs (Gemini Flash fallback)
- "Plan my week" — generates a full meal plan considering pantry, preferences, variety
- Recipe suggestions based on pantry contents ("What can I make with what I have?")
- Grocery item categorization by store section

## Future Features (Post-MVP)
- Photo import: snap a cookbook page, AI extracts the recipe
- Receipt/label scanning: snap a grocery label to add to pantry
- Expiry date tracking and "use it soon" alerts
- Nutrition information per recipe/meal plan
- Multi-user support (shared household pantry/lists)
- Recipe sharing and collections
- Cooking mode (step-by-step instructions with timers)

## Design Direction
- **Inspiration**: NYT Cooking, Flipboard
- **Aesthetic**: Editorial, typographic, confident white space
- **Feel**: Warm, inviting, sophisticated but not cold
- **Typography**: Serif headings, clean sans-serif body
- **Color**: Warm neutrals with deliberate accent color
- **Cards**: Clean layouts with subtle shadows
- **Photography**: Food images as hero elements where present
- **Mobile-first**: Always. Desktop usable but phone is priority.
- **Animations**: Smooth, purposeful. Page transitions, card interactions, micro-interactions.
- **NOT**: Dark themes, neon accents, generic AI aesthetics, flat/sterile design

## Tech Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.3 | App framework (App Router) |
| Tailwind CSS | 4.2.2 | Styling (CSS-based config) |
| @tailwindcss/postcss | 4.2.2 | PostCSS integration |
| Supabase | 2.103.0 | Database, auth, storage |
| @supabase/ssr | 0.10.2 | Server-side Supabase |
| Serwist + @serwist/next | 9.5.7 | PWA support |
| Cheerio | 1.2.0 | HTML parsing / recipe JSON-LD extraction |
| Google Gemini Flash | 2.5 | AI features (free tier) |
| Lucide Icons | latest | Icon system |
| TypeScript | latest | Type safety |

## Deployment
- **Hosting**: Vercel (no SQLite = no issues)
- **Database**: Supabase (free tier — 500 MB, more than enough)
- **AI**: Google Gemini Flash (free tier — 1,500 req/day)
- **Cost**: $0/month at MVP scale

## Database Schema (High-Level)

### recipes
- id, title, description, servings, prep_time, cook_time, total_time
- source_url, image_url, cuisine, category, tags (JSON)
- is_favorite, created_at, updated_at

### recipe_ingredients
- id, recipe_id (FK), name, quantity, unit, category, order_index

### recipe_instructions
- id, recipe_id (FK), step_number, instruction_text

### pantry_items
- id, name, quantity, unit, category
- purchased_date, expiry_date (nullable)
- created_at, updated_at

### meal_plans
- id, date, meal_type (breakfast/lunch/dinner/snack)
- recipe_id (FK, nullable), custom_meal_name (nullable)
- servings, notes, created_at

### grocery_lists
- id, name, week_start_date, is_active, created_at

### grocery_items
- id, grocery_list_id (FK), name, quantity, unit
- category (store section), is_checked
- source_recipe_id (FK, nullable)

## Navigation Structure (Bottom Nav — Mobile)
1. **Recipes** — Browse/search collection
2. **Planner** — Weekly meal calendar (Sunday start)
3. **Pantry** — Kitchen inventory
4. **Groceries** — Shopping list

## Recipe Categories
Breakfast, Lunch, Dinner, Snack, Dessert, Appetizer, Side Dish, Drink, Sauce/Dressing

## AI Personality
- Only suggests Breakfast, Lunch, Dinner meals
- Healthy-leaning, protein-rich
- Realistic — matches real-world eating patterns, not aspirational wellness
- Practical weeknight cooking (scrambled eggs on toast is a valid breakfast)
- Not preachy about vegetables — they're good but not mandatory every meal

## Design Tokens
- **Accent**: Terracotta/Rust
- **Backgrounds**: Warm cream, off-white
- **Text**: Charcoal, warm grays
- **Headings**: Serif font (Playfair Display, Lora, or similar)
- **Body**: Clean sans-serif (Inter, Source Sans, or similar)
- **Week start**: Sunday
