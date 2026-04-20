# FullPantry — Lessons Learned

This file documents bugs, gotchas, and mistakes so they are never repeated.

---

## Lesson 1 — Next.js 16 Breaking Changes (Phase 0)
**Date**: 2026-04-14
**What broke**: Build failed with Turbopack + Serwist conflict, plus deprecation warnings.

### Breaking Changes in Next.js 16 (vs 14/15)
1. **Turbopack is now the DEFAULT bundler** — Next.js 16 uses Turbopack by default. Webpack is no longer the default. Any plugin that uses a webpack plugin API will FAIL the build.
2. **`middleware.ts` is renamed to `proxy.ts`** — The routing middleware file convention changed. Old `middleware.ts` is deprecated and will eventually break.
3. **Multiple lockfile warning** — Next.js 16 infers workspace root from lockfiles. Set `turbopack: { root: __dirname }` in `next.config.ts` to avoid false root detection.

### What I did wrong
- Used `@serwist/next` which injects a webpack plugin — incompatible with Turbopack default in Next.js 16
- Named the auth refresh file `middleware.ts` — deprecated in Next.js 16

### What I fixed
- Removed `withSerwist` webpack wrapper from `next.config.ts`
- Implemented a simple manual service worker (`public/sw.js` as static file) — Serwist can be revisited in Phase 7
- Renamed `middleware.ts` → `proxy.ts` for Next.js 16 compatibility
- Added `turbopack: { root: __dirname }` to next.config.ts

### Remember for future projects
- **Next.js 16 = Turbopack default.** Any package that uses a webpack plugin will fail unless it explicitly supports Turbopack. Check package compatibility BEFORE using.
- **Next.js 16 middleware file is `proxy.ts`**, not `middleware.ts`. Export function must be named `proxy` not `middleware`.
- Serwist has `@serwist/turbopack` for experimental Turbopack support — evaluate in Phase 7

---

## Lesson 2 — React.ReactNode includes BigInt (0n) (Phase 0)
**Date**: 2026-04-14
**What broke**: TypeScript error in `Input.tsx` — `leadingIcon && "pl-9"` failed because `React.ReactNode` includes `bigint` (`0n`), which wasn't in the `ClassValue` type for `cn()`.

### What I did wrong
Used `leadingIcon && "pl-9"` as a cn() argument where `leadingIcon: React.ReactNode`. TypeScript correctly inferred the expression could be `false | "" | 0 | 0n | null | undefined | "pl-9"` — and `0n` (BigInt) is not in my ClassValue type.

### What I fixed
Changed to `!!leadingIcon && "pl-9"` — double-bang converts any ReactNode to a clean boolean, removing the BigInt from the type inference.

### Remember
- **Never use `reactNode && "class"` directly in cn().** Always use `!!reactNode && "class"` or a ternary `reactNode ? "class" : undefined`.
- `React.ReactNode` is extremely wide — it includes `string | number | bigint | boolean | ReactElement | ReactPortal | null | undefined`.

---

## Lesson 3: Agents write to Windows paths in WSL environment

**Problem**: When using Agent tool to write files, agents used Windows-style paths (`C:/Users/keega/...`) instead of Linux paths (`/root/Projects/...`), causing "Module not found" build errors for newly created files.

**Fix**: After any agent file-writing session, verify files exist with `ls ~/Projects/fullpantry/lib/` before running build. Use `cat > file << 'EOF'` via Bash tool directly for any files that are missing.

**Rule**: Never trust that agent-written files landed correctly — always verify with `ls` and fix with Bash `cat >` heredoc if missing.

---

## Lesson 4: JSON-LD `recipeInstructions` can be nested HowToSection objects (Phase 2)
**Date**: 2026-04-17
**What broke**: AllRecipes, Food Network, and many major sites emit `recipeInstructions` as an array of `HowToSection` objects, each containing an `itemListElement` array of `HowToStep`. Naive parsing that only looks for `obj.text` finds nothing and returns an empty instruction list.

**Fix**: `parseInstructions` now checks for `@type === "HowToSection"` or the presence of an `itemListElement` array, and recurses into it to extract the actual steps.

**Remember**: Always recurse into `itemListElement` when parsing `recipeInstructions`. The top-level array may be sections, not steps.

---

## Lesson 5: TypeScript narrows union types inside conditional JSX blocks (Phase 2)
**Date**: 2026-04-17
**What broke**: `state === "loading"` comparison inside `{state === "idle" && (...)}` JSX block caused a TypeScript error: "This comparison appears to be unintentional because the types 'idle' and 'loading' have no overlap." TypeScript correctly narrows `state` to `"idle"` inside that branch, making the check always-false.

**Fix**: Derive a plain boolean outside the JSX — `const isLoading = state === "loading"` — and use that in the disabled prop.

**Remember**: Never compare a narrowed discriminant inside its own conditional block. Extract derived booleans above the return statement.

---

## Lesson 6: Always block SSRF vectors in server-side fetch routes (Phase 2)
**Date**: 2026-04-17
**What broke**: The `/api/import` route accepted any `http://` or `https://` URL, including `http://localhost`, `http://169.254.169.254` (AWS metadata endpoint), and RFC-1918 private ranges. This made the endpoint usable as a proxy to probe internal infrastructure.

**Fix**: Added `isPrivateHost()` check in the API route that rejects loopback (127.x, ::1), link-local (169.254.x), and all RFC-1918 ranges (10.x, 172.16–31.x, 192.168.x).

**Remember**: Any route that performs a server-side fetch to a user-supplied URL MUST validate against private IP ranges before fetching. This is a standard SSRF mitigation.

---

## Lesson 7: next/image requires all external hostnames in remotePatterns (Phase 2)
**Date**: 2026-04-17
**What broke**: Imported recipe images from ATK (Cloudinary CDN) crashed the RecipeForm with "Invalid src prop — hostname not configured under images in next.config.js". Only Supabase was in `remotePatterns`.

**Fix**: Added `{ protocol: "https", hostname: "**" }` wildcard pattern to `next.config.ts` images config. Imported recipes can come from any CDN (Cloudinary, Imgix, Fastly, AWS S3, etc.) so a wildcard is the only practical solution.

**Remember**: When an app handles user-supplied or scraped image URLs, always add `{ protocol: "https", hostname: "**" }` to `remotePatterns` upfront. You cannot predict which CDN external sites use.

---

## Lesson 9: Grocery categorization — substring matching causes false positives (Phase 5)
**Date**: 2026-04-17
**What broke**: Simple `name.includes(keyword)` matching caused several wrong categorizations:
- `"teaspoon"` matched keyword `"tea"` → salt and other ingredients ended up in BEVERAGES
- `"peanuts"` matched keyword `"pea"` → peanuts ended up in PRODUCE
- `"peanut butter"` matched keyword `"butter"` → ended up in DAIRY & EGGS (checked before pantry)
- `"spaghetti"` had no match → fell to OTHER

**Fix**:
1. Switched to `(?<![a-z])keyword(?![a-df-rt-z])` regex — leading word boundary prevents mid-word matches, trailing allows plural "s"/"e" suffixes
2. Reordered SECTION_KEYWORDS: pantry-staples now before dairy-eggs so "peanut butter" hits pantry first
3. Replaced bare `"tea"` in beverages with specific forms: `"green tea"`, `"black tea"`, `"herbal tea"`, `"iced tea"`
4. Removed bare `"pea"` from produce; replaced with `"peas"`, `"snap peas"`, `"snow peas"`, `"green peas"`
5. Added `"spaghetti"` and other pasta names explicitly to pantry-staples

**Remember**: Grocery keyword matching MUST use word boundaries, not `includes()`. Substring matching will always produce false positives on ingredient strings that contain measurement words ("teaspoon", "tablespoon"). Check pantry-staples BEFORE dairy-eggs since compound words like "peanut butter" contain dairy keywords.

---

## Lesson 10: Frontend state not cleaned up after backend replace-in-place (Phase 5)
**Date**: 2026-04-17
**What broke**: Regenerating a grocery list for the same week deleted + recreated it on the backend (correct), but the frontend `handleGenerate` only filtered `prev.filter((l) => l.id !== newList.id)`. Since the new list has a fresh UUID, the old list was never removed from state — resulting in duplicate list tabs showing the same week.

**Fix**: Filter by both ID and `week_start_date`:
```typescript
const filtered = prev.filter((l) => l.id !== newList.id && l.week_start_date !== newList.week_start_date);
```

**Remember**: When the backend replaces a record (delete old + create new), the new record has a different ID. Frontend state must filter by the SEMANTIC key (week_start_date), not just the database ID.

---

## Lesson 11: Bottom sheet z-index must exceed bottom nav to be interactive (Phase 5)
**Date**: 2026-04-17
**What broke**: AddToPantrySheet and AddGroceryItemSheet both used `z-50`, same as the bottom nav. Since both are `fixed bottom-0`, the nav (later in DOM from layout) rendered on top of the sheet, hiding the "Add to pantry"/"Add to list" buttons.

**Fix**: Raised sheet z-index to `z-[60]` and backdrop to `z-[55]`. Also added `pb-20` to sheet container so content clears the 68px nav bar.

**Remember**: Any bottom sheet must use a z-index strictly higher than the nav (which is z-50). Always add `pb-20` (or nav height equivalent) to the sheet's inner container — even if the sheet visually overlays the nav, its own content padding must push buttons above the nav area.

---

## Lesson 14: Global button:active CSS conflicts with component-level active states (Phase 7)
**Date**: 2026-04-18
**What broke**: Added `button:active, a:active { transform: scale(0.97) }` globally in globals.css. This duplicated the `active:scale-[0.97]` already in Button.tsx and also applied to nav links, quantity steppers, and category pills — places where a scale transform is jarring or wrong.

**Fix**: Removed the global rule entirely. Button.tsx already handles press feedback correctly with Tailwind's `active:` variant and respects `:disabled`.

**Remember**: Never add global interactive state styles (`hover`, `active`, `focus`) to bare element selectors. Always apply them at the component level where you control context and can guard disabled states.

---

## Lesson 15: FAB bottom position must clear the bottom nav on mobile (Phase 7)
**Date**: 2026-04-18
**What broke**: FAB was positioned at `bottom-24` (96px) which was close to the BottomNav height (~68px) but didn't account for safe area insets on notched devices, potentially causing overlap.

**Fix**: Changed to `bottom-20` (80px) on mobile, `lg:bottom-6` on desktop. On desktop the bottom nav is hidden so the FAB can sit closer to the edge.

**Remember**: Any fixed element that must sit above the bottom nav needs: `bottom-[nav-height + buffer]` on mobile, plus a `lg:bottom-*` override for desktop where the nav doesn't exist. The pattern: `bottom-20 lg:bottom-6`.

---

## Lesson 12: Always check res.ok before parsing API JSON responses (Phase 6)
**Date**: 2026-04-17
**What broke**: `RecipeGrid` fetched `/api/recipes/can-make` and called `res.json()` without checking `res.ok`. A 500 error response would parse as `{error: "..."}` (an object), which would then be stored in `canMakeData`. Later, `canMakeData.map(...)` would throw `TypeError: canMakeData.map is not a function`, crashing the component.

**Fix**: Added `if (!res.ok) throw new Error("Failed")` before `res.json()`. The catch block sets `canMakeData` to `[]` (empty array), which gracefully shows "No recipes match" instead of crashing.

**Remember**: Always `if (!res.ok) throw new Error(...)` before `res.json()` in client-side fetch calls. TypeScript casts don't protect against wrong runtime shapes — `as SomeType[]` will happily cast an error object to an array type.

---

## Lesson 13: Catch blocks in async save functions need user-visible error feedback (Phase 6)
**Date**: 2026-04-17
**What broke**: `SuggestedMealsSheet.handleSave()` had a catch block that called `setSaving(false)` but showed no error to the user. A network failure or API error would silently fail — the sheet's spinner would stop and nothing else would happen. The user would have no idea their meals weren't saved.

**Fix**: Added `saveError` state. Set it `true` in catch, `false` before each attempt. Show "Failed to save. Try again." text above the CTA button when `saveError` is true.

**Remember**: Every async save operation that can fail must have a visible error state. A spinner that stops is not an error message.

---

## Lesson 16: BottomNav safe-area paddingBottom must go on the background div, not the nav element (Phase 7 deploy)
**Date**: 2026-04-18
**What broke**: `paddingBottom: env(safe-area-inset-bottom)` was placed on the outer `<nav>` element (which is `fixed bottom-0`). This made the nav element taller, but the frosted-glass background div was only as tall as its content (68px). The result: the visible bar floated above the screen bottom with a transparent gap underneath — the nav appeared "too high up" on iPhone.

**Fix**: Moved `paddingBottom: env(safe-area-inset-bottom, 0px)` into the inner `bg-fp-surface/90` div. Now the background colour extends all the way to the screen edge (covering the home indicator zone), and the 68px icon row sits above it.

**Remember**: Safe-area padding must live on the **visible background element**, not an outer fixed container. If padding is on a transparent wrapper, the content floats above the inset and leaves a gap.

---

## Lesson 17: Next.js server component data goes stale after client-side delete without revalidatePath (Phase 7 deploy)
**Date**: 2026-04-18
**What broke**: After deleting a recipe, `router.push('/recipes')` navigated back to the list — but Next.js served a cached version of the server component. The deleted recipe still appeared. Clicking it returned a 404 because it was gone from the DB.

**Fix**: Added `revalidatePath('/recipes')` in the `DELETE /api/recipes/[id]` route handler. Also added `export const dynamic = 'force-dynamic'` to `app/recipes/page.tsx` so the page is never statically cached.

**Remember**: Any server component that displays data that can be mutated by a client action needs either `dynamic = 'force-dynamic'` OR `revalidatePath()` called in the mutating API route. `router.refresh()` alone is unreliable when combined with `router.push()` — the push races with the refresh. Use server-side revalidation instead.

---

## Lesson 18: App horizontal overflow on mobile requires overflow-x hidden on html, not just body (Phase 7 deploy)
**Date**: 2026-04-18
**What broke**: On narrow phones (375px and below), certain layouts caused horizontal overflow and the whole app could be swiped left/right. Adding `overflow-x: hidden` to `body` alone doesn't prevent this — the html element also needs it.

**Fix**: Added `overflow-x: hidden` to the `html` selector in globals.css.

**Remember**: Always put `overflow-x: hidden` on `html` (not just `body`) to prevent full-page horizontal scroll from any element that exceeds the viewport width.

---

## Lesson 19: iOS Safari needs apple-touch-icon.png at the root path, not just in metadata (Phase 7 deploy)
**Date**: 2026-04-18
**What broke**: The PWA icon didn't appear when adding to iPhone home screen. The icon was referenced in Next.js metadata and manifest.json at `/icons/apple-touch-icon.png`, but iOS Safari also looks for it at the root path `/apple-touch-icon.png` without any link hint.

**Fix**: Copied `apple-touch-icon.png` to `public/apple-touch-icon.png` (root), in addition to keeping the `/icons/` copy. Also removed non-existent startup/splash screen image references from layout.tsx metadata — those caused 404s that interfered with PWA processing.

**Remember**: Always place `apple-touch-icon.png` in the root of `public/` for iOS. Don't reference startup images in metadata unless the files actually exist — 404 splash image requests can prevent Safari from recognising the app as a PWA.

---

## Lesson 20: CSS `transform` on a parent breaks `fixed` positioning for all descendants

**Date**: 2026-04-19
**What broke**: `AddPantryItemSheet` uses `fixed inset-x-0 bottom-0`. PageShell's inner div has `animate-fade-in-up` with `animation-fill-mode: forwards`. The keyframe ends with `transform: translateY(0)`. Even though `translateY(0)` is visually a no-op, it is NOT the same as `transform: none` — it still creates a new CSS containing block. Result: the sheet's `bottom: 0` anchored to PageShell's content bottom (~400px into page) instead of the viewport bottom. The sheet extended ~200px above the viewport, hiding the name/header fields.

**Fix**: Render the sheet via `createPortal(jsx, document.body)`. The portal renders the sheet as a direct child of `<body>`, which has no transform, so `fixed bottom: 0` correctly anchors to the viewport.

**Remember**: **Any element with `transform`, `filter`, `perspective`, `will-change: transform`, or `contain: paint/layout/strict` creates a new containing block for `fixed` descendants.** This includes `transform: translateY(0)` from animation fill-mode. Bottom sheets, modals, tooltips, and dropdowns that use `position: fixed` MUST be rendered via `createPortal(jsx, document.body)` if any ancestor might have a transform — including from CSS animations.

---

## Lesson 8: Optimistic-delete quick actions must call the API, not just update local state (Phase 3)
**Date**: 2026-04-17
**What broke**: The "Used it" quick-delete button in `PantryItem` called `onDelete(item.id)` which mapped to `handleDelete` in the page — which only filtered local state. Item disappeared from the UI but came back on page reload because no DELETE API call was made.

**Fix**: Split into two functions in `app/pantry/page.tsx`:
- `removeItem(id)` — local-state-only filter, passed to `AddPantryItemSheet.onDelete` (the sheet already made the API call itself)
- `handleQuickDelete(id)` — optimistically removes from UI, then calls `DELETE /api/pantry/:id`, passed to `PantryGroup/PantryItem.onDelete`

**Remember**: When a component has a quick-action delete that bypasses a modal/confirmation flow, the page-level callback must own the API call. Never assume the child component handled the network request. The pattern: quick-action → page calls API + updates state. Modal delete → modal calls API, then invokes state-only callback.
