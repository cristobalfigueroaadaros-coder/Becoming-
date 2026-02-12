
# Transmutation Phase Flow Fix + Superpowers System

## Part 1: Fix White and Gold Phase Flow

### Problem
When a user clicks on a White Phase node in the Transmutation Map, it opens a manual text-entry modal (`TransmutationNodeEditModal`). The mentor CTA exists but is secondary and easy to miss. The expected behavior is that clicking the phase box should directly open a 1-to-1 chat with the appropriate mentor (Phoenix for White, Stoic for Gold), following the same conversational pattern used during Pattern Discovery.

### Solution
Change `handleNodeClick` in `BecomingTransmutation.tsx` so that clicking any White or Gold phase node routes the user directly to the phase-specific mentor (via the existing `navigateToMentorWithHandoff` function), instead of opening the text-entry modal. The manual edit modal remains accessible as a secondary option inside the mentor CTA area (for users who prefer to write directly).

Additionally, when the mentor conversation completes (the user returns from the council chat), the system must detect the extracted data and trigger the appropriate Winning Card. This requires listening for returning handoff results via the transmutation context in the URL/state.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/creation-lab/BecomingTransmutation.tsx` | Change `handleNodeClick` to route directly to mentor for White/Gold phases. Add return-from-mentor detection to trigger Win Cards. |
| `src/pages/PatternMap.tsx` | Same fix for the standalone pattern map page: White/Gold node clicks go to mentor. |

### Detailed Changes

**BecomingTransmutation.tsx** -- `handleNodeClick` (line 107):
- When `phase === 'white'`: call `navigateToMentorWithHandoff('phoenix_mentor')` directly
- When `phase === 'gold'`: call `navigateToMentorWithHandoff('stoic_mentor')` directly
- Keep `phase === 'black'` behavior unchanged (view-only toast)

**Return detection**: Add a `useEffect` that checks `location.state` for returning transmutation data (shift_moment, lesson_learned, gold_insight, etc.) passed back from the Council chat. When detected:
- Merge extracted data into `transmutationData`
- If White phase completes: show `WhitePhaseWinCard`
- If Gold phase completes: show `TransmutationCelebration`

**PatternMap.tsx** -- `handleTransmutationNodeClick` (line 134):
- Same logic: White nodes navigate to Phoenix, Gold nodes navigate to Stoic
- Add return detection via `location.state`

### Winning Card Visual Rule
- White Phase Win Card: Already uses slate/white theme (correct)
- Gold Phase Win Card: Already uses amber/gold theme via `TransmutationCelebration` (correct)
- Both overlays updated to `z-[60]` to sit above BottomNavigation

---

## Part 2: Completion Summary

### Current State
The `generateGoldenSummary` function already exists in `src/lib/goldenSummaryGenerator.ts` and creates a narrative summary. However, it does not include the "main emotional trigger" or "primary skill gained" fields.

### Enhancement
Extend the golden summary to include:
- The original event (shadow)
- The main emotional trigger (from pattern's `primary_emotion`)
- The core transformation (gold_insight)
- The primary skill gained (new field to extract)

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/goldenSummaryGenerator.ts` | Add `primaryEmotion` and `skillGained` parameters to the summary generator |
| `src/components/transmutation-map/TransmutationCelebration.tsx` | Display the structured summary with all four fields |

---

## Part 3: Superpowers System (New Feature)

### Database

Create two new tables:

**`superpowers`** (reference table)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid | Owner |
| pattern_id | uuid | Source transmutation |
| name | text | e.g. "Resilient", "Courageous Decision Maker" |
| description | text | Short context from the event |
| icon | text | Emoji icon |
| color | text | Badge color |
| created_at | timestamptz | |

RLS: Users can only read/insert/update their own superpowers.

### Extraction Logic

When Gold Phase completes:
1. Call an edge function `extract-superpowers` that analyzes the full transmutation data (shadow, shift, lesson, gold insight, brave step) and extracts 1-4 positive skill labels
2. Store them in the `superpowers` table linked to the pattern
3. Display them in the Gold Celebration card

### Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/extract-superpowers/index.ts` | New edge function: takes transmutation data, returns 1-4 superpowers |
| DB migration | Create `superpowers` table with RLS |
| `src/hooks/useSuperpowers.tsx` | New hook: CRUD for superpowers |
| `src/components/transmutation-map/TransmutationCelebration.tsx` | Show extracted superpowers as badges after Gold completion |

### Edge Function Prompt
The AI will receive the full transmutation arc and extract concise, positive skill labels (max 4). Rules: must be positive, derived from the specific event, no duplicates, no generic labels.

---

## Part 4: Superpower Map (New Visual)

### New Page: `src/pages/SuperpowerMap.tsx`

A visual map showing:
- Center: Gender-appropriate avatar silhouette (based on profile data or a neutral default)
- Surrounding the avatar: Circular badge/medal positions
- Each badge represents a collected Superpower from completed transmutations
- Badges grow as more transmutations are completed

### Integration Points

| File | Change |
|------|--------|
| `src/pages/SuperpowerMap.tsx` | New page with avatar center + radial badge layout |
| `src/App.tsx` | Add route `/superpower-map` |
| `src/components/creation-lab/BecomingPath.tsx` | Add "Superpowers" tab or entry point alongside Pattern Map, Transmutation, Lifetime |
| `src/components/layout/BottomNavigation.tsx` | Optionally accessible from profile or Creation Lab |

### Visual Design
- Dark background with radial gradient (consistent with Pattern Map aesthetic)
- Center avatar: simple silhouette SVG (60-80px)
- Badges arranged in concentric rings around avatar
- Each badge: rounded icon with glow effect, superpower name below
- Empty slots shown as dashed circles to encourage completion
- Gold confetti animation when viewing for the first time after earning new superpowers

---

## Implementation Order

1. Fix White/Gold phase flow (direct mentor routing + return detection)
2. Update Winning Card z-index to z-[60]
3. Enhance completion summary
4. Create `superpowers` table + RLS
5. Create `extract-superpowers` edge function
6. Create `useSuperpowers` hook
7. Update Gold Celebration to show superpowers
8. Create Superpower Map page + route

## Files Summary

| File | Type |
|------|------|
| `src/components/creation-lab/BecomingTransmutation.tsx` | Modify |
| `src/pages/PatternMap.tsx` | Modify |
| `src/lib/goldenSummaryGenerator.ts` | Modify |
| `src/components/transmutation-map/TransmutationCelebration.tsx` | Modify |
| `src/components/transmutation-map/WhitePhaseWinCard.tsx` | Modify (z-index) |
| `src/hooks/useSuperpowers.tsx` | New |
| `src/pages/SuperpowerMap.tsx` | New |
| `supabase/functions/extract-superpowers/index.ts` | New |
| `src/App.tsx` | Modify (add route) |
| DB migration | New table `superpowers` |
