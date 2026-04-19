# FullPantry — Claude Instructions

## The Commandments
**READ FIRST**: `C:\Users\keega\.claude\projects\C--Users-keega-Projects\memory\COMMANDMENTS.md`
These 33 rules govern ALL work on this project. Consult at the START and END of every session.

## Source of Truth
**CONSULT BEFORE READING ANY CODE**: `SOURCE_OF_TRUTH.md` (project root)
This maps every file, its purpose, and its relationships. Check it FIRST before exploring.

## Project
- **Name**: FullPantry
- **What**: Recipe tracker, meal planner, pantry manager, smart grocery list PWA
- **Location**: `C:\Users\keega\Projects\fullpantry`

## Tech Stack
- Next.js 16.2.3 (App Router)
- Tailwind CSS 4.2.2 (CSS-based config, `@theme` directive)
- Supabase (PostgreSQL, auth, storage) — `@supabase/supabase-js` 2.103.0, `@supabase/ssr` 0.10.2
- Serwist 9.5.7 + @serwist/next 9.5.7 (PWA)
- Cheerio 1.2.0 (recipe URL scraping)
- Google Gemini 2.5 Flash (AI features, free tier)
- Lucide Icons
- TypeScript

## Deployment
- Vercel (hosting)
- Supabase free tier (database, storage, auth)
- Google Gemini free tier (AI)

## Architecture Notes
- No `src/` directory — all code at root. `@/` alias = `./*` in tsconfig.json
- Tailwind v4: NO `tailwind.config.ts` — use CSS `@theme` in globals.css
- Use `--color-*` naming for custom colors in `:root`, register in `@theme inline`

## Design System
- **Aesthetic**: NYT Cooking / Flipboard editorial
- **Accent**: Terracotta/Rust
- **Backgrounds**: Warm cream, off-white
- **Text**: Charcoal, warm grays
- **Headings**: Serif font (Playfair Display, Lora, or similar)
- **Body**: Clean sans-serif (Inter, Source Sans, or similar)
- **Mobile-first always**. Desktop usable but phone is priority.
- **Animations**: Smooth, purposeful. Loading skeletons not spinners.

## Key Decisions
- 4 bottom nav tabs: Recipes, Planner, Pantry, Groceries
- Recipe categories: Breakfast, Lunch, Dinner, Snack, Dessert, Appetizer, Side Dish, Drink, Sauce/Dressing
- AI suggests B/L/D only — healthy, protein-rich, realistic, practical weeknight cooking
- Week starts Sunday
- Serving adjustment: smart rounding (fractions, round up discrete items like eggs)

## Key Docs
- `discovery.md` — Feature spec, schema, design direction
- `plan.md` — 8-phase implementation plan with deliverables
- `SOURCE_OF_TRUTH.md` — File map (update religiously)
- `progress.md` — Phase completion tracking (create when Phase 0 starts)
- `LESSONS_LEARNED.md` — Bug learnings, gotchas (create when first lesson occurs)

## Workflow (Every Phase)
```
1. Consult Commandments
2. Consult Source of Truth
3. Plan with user (ask questions, get agreement)
4. Implement
5. Edge Case Destroyer → fix breaks → document lessons
6. Generate test checklist (.txt) for user
7. User tests and confirms
8. Documentation Agent → verify Source of Truth
9. Final Commandments check
10. Phase complete
```
