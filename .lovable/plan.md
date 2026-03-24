

# PDR 17 — Emotional Clarity, Gamification & Dot Evolution

## Summary

Seven changes: (1) Two-layer dot system preserving user's original title, (2) language upgrade to direct tone, (3) pulsing Start Quest button, (4) dot creation celebration + location highlight, (5) new cluster unlock animation, (6) three bug fixes (growth reflection loop, Guide overlap, Golden Moments position), (7) Golden Moment visual distinction.

## 1. Two-Layer Dot System (Critical Fix)

**Problem**: The `evolve-atlas-dot` function overwrites `dot.title` with the evolved version. User's chosen name disappears.

**Database migration**: Add column to store original user selection:
```sql
ALTER TABLE public.atlas_dots
  ADD COLUMN IF NOT EXISTS original_title text,
  ADD COLUMN IF NOT EXISTS original_description text;
```

**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**
- When saving a dot, also set `original_title` and `original_description` to the user-selected values.
- When evolution occurs (lines 302-308), do NOT update `title`. Instead update a separate `evolved_title` and `evolved_description` column — OR keep the current `title` update but set `original_title` before overwriting.
- Backfill logic: if `original_title` is null, treat `title` as the original.

**Edit: `src/components/atlas/AtlasClusterDetail.tsx`**
- Restructure cluster panel: add "YOUR SIGNALS" section header showing dots with `original_title || title` as Layer 1.
- Add "EVOLUTION" section below, showing `short_description` (the evolved interpretation) in italic/muted style if evolution exists.

**Edit: `src/components/atlas/AtlasDotCard.tsx`**
- Always display `dot.original_title || dot.title` as the primary label.
- If evolution history exists, show evolved interpretation below in smaller muted text.

**Edit: `src/components/atlas/AtlasDotDetailModal.tsx`**
- Show "Your Signal" (original_title) prominently at top.
- Show "Evolution" (current title if different from original) below, visually distinct.

**Edit: `supabase/functions/evolve-atlas-dot/index.ts`**
- Change language rules from `"you seem to", "this suggests"` to `"You do this", "This is how you operate", "You consistently"`.

## 2. Language Upgrade

**Edit: `supabase/functions/evolve-atlas-dot/index.ts`**
- Replace observational hedging: `"you seem to", "this suggests"` → `"You do this.", "This is how you operate.", "You consistently..."`.

**Edit: `supabase/functions/generate-atlas-dot/index.ts`**
- Update description rules to use direct language instead of hedging phrases.

## 3. Pulsing Start Quest Button

**Edit: `src/pages/AtlasPage.tsx`**
- Add a pulsing animation to the Start Quest button using Framer Motion or CSS `animate-pulse`.
- The button should pulse on first load and after returning from a completed quest.

## 4. Dot Creation Celebration + Location Highlight

**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**
- After saving a dot, navigate to `/atlas` with a query param like `?highlight=<cluster-slug>`.

**Edit: `src/pages/AtlasPage.tsx`**
- Read `highlight` query param. If present, animate the matching cluster node with a 2-3 second glow/pulse, then clear the param.

**Edit: `src/components/atlas/AtlasClusterNode.tsx`**
- Accept `isHighlighted` prop. When true, add a bright pulse animation for 2-3 seconds.

## 5. New Cluster Unlock Animation

**Edit: `src/pages/AtlasPage.tsx`**
- Track previously unlocked clusters in a ref. On render, detect newly unlocked clusters (compare current vs previous).
- Show a toast: "New area unlocked: [cluster name]" when a cluster transitions from locked/dormant to activated.

## 6. Bug Fixes

### 6a. Growth Reflection Loop
**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**
- The `shouldShowGrowthReflectionCheck` runs inside the render body and calls `setShowGrowthReflection(true)` — this triggers re-renders and can loop. Move this check into a `useEffect` with proper deps. Once dismissed, set a flag (e.g., `growthReflectionDismissed`) to prevent re-triggering.

### 6b. Guide Overlaps Start Quest
**Edit: `src/components/BecomingGuide.tsx`**
- Change the trigger button position from `bottom-24` to `bottom-36` on Atlas page, or always use `bottom-36` to sit above the Start Quest button.
- Better approach: detect if on `/atlas` route and use a higher position like `bottom-36`.

### 6c. Golden Moments Cluster Position
**Edit: `src/pages/AtlasPage.tsx`**
- Move Golden Moments position from `{ x: 50, y: 60 }` area (too close to Personal Frustrations at `{ x: 50, y: 60 }`) to `{ x: 50, y: 42 }` (already defined but verify separation). Current positions show Golden Moments at index 13 = `{ x: 50, y: 42 }` and Personal Frustrations at index 10 = `{ x: 50, y: 60 }`. That's 18% vertical gap which should be fine. If still overlapping visually, adjust Golden Moments to `{ x: 50, y: 36 }`.

## 7. Golden Moment Visual Distinction

**Edit: `src/components/atlas/AtlasClusterNode.tsx`**
- When cluster slug is `golden-moments`, use gold color scheme and a distinct glow regardless of growth level.

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration (original_title columns) | Create |
| `src/components/atlas/AtlasQuestFlow.tsx` | Edit — save original_title, fix growth reflection loop |
| `src/components/atlas/AtlasClusterDetail.tsx` | Edit — two-layer panel structure |
| `src/components/atlas/AtlasDotCard.tsx` | Edit — show original_title as primary |
| `src/components/atlas/AtlasDotDetailModal.tsx` | Edit — two-layer display |
| `src/components/atlas/AtlasClusterNode.tsx` | Edit — highlight prop, golden cluster styling |
| `src/pages/AtlasPage.tsx` | Edit — pulsing button, highlight param, unlock animation, cluster position |
| `src/components/BecomingGuide.tsx` | Edit — reposition trigger on Atlas |
| `supabase/functions/evolve-atlas-dot/index.ts` | Edit — direct language |
| `supabase/functions/generate-atlas-dot/index.ts` | Edit — direct language in descriptions |

