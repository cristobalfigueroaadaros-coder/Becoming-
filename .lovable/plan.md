

# Atlas Dot System (Discovery Structure)

## Summary

Extend the Atlas Dot system with three discovery types (strength, shadow, life_imprint), add `source_system` and `signal_sources` fields to `atlas_dots`, implement duplicate detection with confidence reinforcement, add visual type-based coloring, expand quest content for variety, and introduce progressive discovery ordering.

## Database Changes

**Migration: Add columns to `atlas_dots`**

```sql
ALTER TABLE public.atlas_dots 
  ADD COLUMN IF NOT EXISTS dot_category text NOT NULL DEFAULT 'strength',
  ADD COLUMN IF NOT EXISTS signal_sources jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS signal_strength int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT 'quest_system';
```

- `dot_category`: `strength` | `shadow` | `life_imprint` (the PDR's `dot_type` concept — we keep existing `dot_type` for quest_discovery/pattern_discovery and add this new semantic category)
- `signal_sources`: JSON array of signal names that generated the dot
- `signal_strength`: combined signal score
- `source_system`: `quest_system` | `capability_map` | `superpower_map` | `transmutation_map`

## Duplicate Detection

**In `AtlasQuestFlow.tsx` (before insert):**

Query existing dots for the user with matching title. If found:
- UPDATE existing dot: increment `confidence_score` by 0.1, update `signal_strength`, skip insert
- Show modified Winning Card: "Pattern reinforced" instead of "New discovery"

## Dot Type Classification

**In `src/data/atlasSignals.ts`:**

Add `dotCategory` field to `PatternDefinition`:
- Most patterns → `"strength"`
- Add 3-4 new shadow patterns (e.g., `fear_of_failure`, `perfectionism_loop`, `avoidance_pattern`) that emit from frustrations/reflections clusters → `"shadow"`
- Add 2-3 life imprint patterns (e.g., `mentor_influence`, `turning_point`, `creative_awakening`) from life-events/childhood clusters → `"life_imprint"`

**In `src/data/atlasQuests.ts`:**

Add `dotCategory` to the fallback `interpret()` return type so even non-pattern dots get categorized. Default all current quests to `"strength"`. Add quest progression ordering:
- Quests 1-3: strength-oriented clusters
- Quest 4: life imprint cluster
- Quest 5: strength
- Quest 6+: may include shadow clusters

**In `useAtlasQuests.tsx`:**

Update `getNextQuest()` to factor in completed quest count for progressive discovery:
- If completedCount < 4: prefer strength clusters (passions, skills, natural-talents, experiments, values)
- If completedCount === 3: pick a life-imprint cluster (life-events, childhood-signals, aha-moments)
- If completedCount >= 5 and completedCount % 4 === 1: pick shadow cluster (personal-frustrations, external-reflections)

## Quest Variation (39 more quests)

**In `src/data/atlasQuests.ts`:**

Expand from 13 quests to 52 (4 per cluster). Each variation explores the same cluster from a different angle with different wording and mechanics. Add helper `getQuestsForCluster(slug)` that returns all quests for a cluster. Update `getQuestForCluster` to pick one the user hasn't completed yet.

## Visual Updates

**`src/hooks/useAtlas.tsx`:**

Add `DOT_TYPE_COLORS` mapping:
- strength: `hsl(195 80% 55%)` (teal)
- shadow: `hsl(280 60% 50%)` (purple)  
- life_imprint: `hsl(40 80% 55%)` (amber/gold)

**`src/components/atlas/AtlasDotCard.tsx`:**

Use `dot.dot_category` to pick dot color instead of cluster color.

**`src/components/atlas/AtlasDotDetailModal.tsx`:**

Show dot category badge (Strength / Shadow / Life Imprint), signal sources list, and detection explanation text.

**`src/components/atlas/AtlasClusterNode.tsx`:**

Color mini-dot indicators by `dot_category` instead of uniform cluster color.

**`src/components/atlas/AtlasWinningCard.tsx`:**

Add third variant for reinforced discoveries. Show dot category label. Vary icon: Sparkles (strength), Shield (shadow), Star (life_imprint).

## Updated DotInterpretation Type

```typescript
export interface DotInterpretation {
  title: string;
  description: string;
  dotCategory: "strength" | "shadow" | "life_imprint";
}
```

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration (add columns to atlas_dots) | Create |
| `src/data/atlasQuests.ts` | Edit — add dotCategory to interpret, add 39 quest variations |
| `src/data/atlasSignals.ts` | Edit — add dotCategory to patterns, add shadow + life_imprint patterns |
| `src/lib/atlasSignalEngine.ts` | Edit — pass dotCategory through |
| `src/hooks/useAtlas.tsx` | Edit — add DOT_TYPE_COLORS |
| `src/hooks/useAtlasQuests.tsx` | Edit — progressive discovery ordering |
| `src/components/atlas/AtlasQuestFlow.tsx` | Edit — duplicate detection, dot_category insert |
| `src/components/atlas/AtlasWinningCard.tsx` | Edit — category visuals, reinforcement variant |
| `src/components/atlas/AtlasDotCard.tsx` | Edit — type-based coloring |
| `src/components/atlas/AtlasDotDetailModal.tsx` | Edit — category badge, signal sources |
| `src/components/atlas/AtlasClusterNode.tsx` | Edit — type-colored dot indicators |

