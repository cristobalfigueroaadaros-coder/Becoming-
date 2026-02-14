

# Transmutation Completion + Superpower Identity System

## Problems Found

### 1. Gold Winning Card Not Triggering (Root Cause)
When the user chats with the Stoic via the **PatternMap page** (`/pattern-map/:id`), the completion handler in `Chat.tsx` (line 629) always navigates back to `/creation-lab?type=becoming&bmode=transmutation` -- but the user's transmutation state lives in `PatternMap.tsx`. The `location.state.transmutationComplete` is never picked up because the user is routed to the wrong page.

**Fix**: Update `Chat.tsx` to detect the originating page and route back accordingly. The `transmutationContext` already contains `patternId`, so we can navigate to `/pattern-map/:patternId` when the handoff came from the standalone page.

### 2. Superpowers Table Missing `category` Column
The `superpowers` table has no `category` column, so the 5-domain system (Emotional Mastery, Psychological Strength, Cognitive Strength, Behavioral Strength, Identity Upgrade) cannot be stored or filtered.

**Fix**: Add a `category` column to the `superpowers` table via migration.

### 3. Superpower Extraction Prompt Does Not Match PDR
The current `extract-superpowers` edge function uses a generic prompt that asks for "positive skill labels" with no domain categorization, no formatting rules (medal-style, 1-3 words, no sentences), and no max-1-per-category constraint.

**Fix**: Rewrite the prompt to implement the 5-domain extraction logic, medal formatting, and category constraints from the PDR.

### 4. Superpower Map Needs Category Grouping
The current map shows badges in a flat radial layout with no domain labels or grouping.

**Fix**: Group superpowers by category with section labels; keep the radial avatar layout but add a categorized list below.

---

## Technical Changes

### A. Database Migration
Add `category` column to `superpowers` table:
```sql
ALTER TABLE public.superpowers ADD COLUMN category text;
```

### B. Chat.tsx -- Fix Return Navigation (lines 627-634)
Currently:
```typescript
navigate('/creation-lab?type=becoming&bmode=transmutation', {
  state: { transmutationComplete: data.transmutationPhaseComplete }
});
```
Change to detect origin and route accordingly:
```typescript
const patternId = transmutationContext?.patternId;
const returnPath = patternId 
  ? `/pattern-map/${patternId}`
  : '/creation-lab?type=becoming&bmode=transmutation';
navigate(returnPath, {
  state: { transmutationComplete: data.transmutationPhaseComplete }
});
```
This requires storing the `transmutationContext` from the location state when Chat.tsx mounts (it's already available in `location.state.transmutationContext`).

### C. Edge Function: `extract-superpowers/index.ts` -- New 5-Domain Prompt
Replace the current generic prompt with:

- Define the 5 categories: Emotional Mastery, Psychological Strength, Cognitive Strength, Behavioral Strength, Identity Upgrade
- Instruct the AI to extract up to 4 superpowers, max 1 per category
- Enforce medal-style formatting: 1-3 capitalized words, no punctuation, no sentences
- Include category field in the JSON output
- Store category in the database insert

### D. Superpower Map Visual Updates (`SuperpowerMap.tsx`)
- Add category grouping in the list view below the radial map
- Show category labels (e.g., "Emotional Mastery", "Identity Upgrade") as section headers
- Keep the radial visual map as-is for the badge positions

### E. Hook Update (`useSuperpowers.tsx`)
- Add `category` to the `Superpower` interface

---

## File-by-File Changes

| File | Change |
|------|--------|
| Migration SQL | Add `category` text column to `superpowers` table |
| `src/pages/Chat.tsx` (lines 627-634) | Fix return navigation to route back to originating page (PatternMap or CreationLab) |
| `supabase/functions/extract-superpowers/index.ts` | Rewrite prompt with 5-domain categories, medal formatting, max-1-per-category; store category in DB |
| `src/hooks/useSuperpowers.tsx` | Add `category` field to `Superpower` interface |
| `src/pages/SuperpowerMap.tsx` | Add category grouping in list view; add domain labels |

