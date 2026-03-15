

# Atlas Signal Detection Engine

## Summary

Replace the current simplistic `pickByIndex` interpretation with a signal-based system. Each quest interaction emits typed signals that accumulate in a new `atlas_signals` table. When signal combinations cross thresholds, the system generates richer, more credible Atlas Dots. Cross-quest pattern detection runs after each quest completion.

## Database

**New table: `atlas_signals`**

```sql
CREATE TABLE public.atlas_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  signal_name text NOT NULL,        -- e.g. "curiosity", "empathy"
  signal_category text NOT NULL,    -- motivation, behavior, cognitive, creative, social
  strength int NOT NULL DEFAULT 1,  -- points awarded
  source_quest_key text NOT NULL,
  source_interaction_index int NOT NULL, -- 0-3
  cluster_id uuid REFERENCES public.atlas_clusters(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.atlas_signals ENABLE ROW LEVEL SECURITY;
-- Users read/insert own signals
CREATE POLICY "Users read own signals" ON public.atlas_signals
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own signals" ON public.atlas_signals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

**New table: `atlas_patterns`** — tracks detected cross-quest patterns

```sql
CREATE TABLE public.atlas_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern_key text NOT NULL,           -- e.g. "explorer_mindset"
  pattern_title text NOT NULL,         -- "Explorer Mindset"
  signal_names text[] NOT NULL,        -- signals that triggered it
  total_strength int NOT NULL,
  generated_dot_id uuid REFERENCES public.atlas_dots(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pattern_key)
);

ALTER TABLE public.atlas_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own patterns" ON public.atlas_patterns
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own patterns" ON public.atlas_patterns
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

## Signal Mapping Data

**New file: `src/data/atlasSignals.ts`**

Defines:

1. **Signal catalog** — ~15 named signals with categories:
   - Motivation: curiosity, vision_thinking, teaching_impulse
   - Behavior: experimentation, exploration, leadership
   - Cognitive: pattern_thinking, problem_solving, reflection
   - Creative: creativity, expression
   - Social: empathy, community_orientation, connection

2. **Option-to-signal mapping** per quest interaction — each selectable option emits specific signals with strength values. Example:
   - "Teaching others" → `{teaching_impulse: +2, community_orientation: +1}`
   - "Exploring ideas" → `{curiosity: +2, exploration: +1}`

3. **Pattern definitions** — combinations with thresholds:
   - `explorer_mindset`: curiosity(3) + exploration(3) + experimentation(2) → threshold 8, cluster: "passions"
   - `community_builder`: empathy(3) + community_orientation(3) + teaching_impulse(2) → threshold 8, cluster: "natural-talents"
   - `creative_starter`: creativity(3) + experimentation(2) + expression(2) → threshold 7, cluster: "experiments"
   - ~10 pattern definitions total

## Signal Extraction Logic

**New file: `src/lib/atlasSignalEngine.ts`**

Core functions:

- `extractSignals(questKey, interactionIndex, response)` → returns `Signal[]` by looking up the option-to-signal mapping
- `detectPatterns(userSignals: AggregatedSignal[])` → checks all pattern definitions against accumulated signal strengths, returns newly triggered patterns
- `interpretQuestResult(questKey, allResponses, existingSignals)` → runs signal extraction for all 4 interactions, checks for new patterns, returns the best dot interpretation (pattern-based if threshold met, otherwise single-quest fallback like current system)

## Integration Into Quest Flow

**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**

After step 4 completes:

1. Call `extractSignals()` for each of the 4 responses → get all emitted signals
2. Fetch user's existing signals from `atlas_signals`
3. Merge new + existing signals
4. Run `detectPatterns()` on merged signals
5. If a new pattern is detected → use pattern title/description for the Winning Card dot
6. If no new pattern → fall back to the current `quest.interpret()` logic (single-quest dot)
7. Insert all new signals into `atlas_signals` table
8. If pattern detected → insert into `atlas_patterns` with reference to generated dot

The Winning Card message changes based on detection type:
- Pattern detected: "We detected a new pattern across your discoveries"
- Single quest: "We discovered a new Atlas signal" (current behavior)

**Edit: `src/data/atlasQuests.ts`**

Keep `interpret()` as fallback but update it to produce better descriptions using the actual responses rather than just index-based picking.

## Hook Updates

**Edit: `src/hooks/useAtlasQuests.tsx`**

Add a query for user's aggregated signals (grouped by signal_name, summed strength) to pass into the detection engine.

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration (atlas_signals + atlas_patterns) | Create |
| `src/data/atlasSignals.ts` | Create — signal catalog, option mappings, pattern definitions |
| `src/lib/atlasSignalEngine.ts` | Create — extractSignals, detectPatterns, interpretQuestResult |
| `src/components/atlas/AtlasQuestFlow.tsx` | Edit — integrate signal extraction + pattern detection after step 4 |
| `src/data/atlasQuests.ts` | Edit — improve fallback interpret with response-aware descriptions |
| `src/hooks/useAtlasQuests.tsx` | Edit — add signal aggregation query |
| `src/components/atlas/AtlasWinningCard.tsx` | Edit — vary message based on pattern vs single detection |

