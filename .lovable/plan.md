

# PDR 13 — Atlas Evolution & Intelligence Engine

## Summary

This PDR adds five major capabilities: (1) dot evolution (reframe/expansion/upgrade/merge), (2) cross-cluster connection detection, (3) Gold Moments (frustration→strength transformation), (4) dot validation after creation, and (5) growth reflection feedback every 5-8 quests.

## Database Migration

```sql
-- Dot evolution tracking
ALTER TABLE public.atlas_dots
  ADD COLUMN IF NOT EXISTS evolution_stage int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS evolution_type text,
  ADD COLUMN IF NOT EXISTS evolved_from_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_gold_moment boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_validated boolean,
  ADD COLUMN IF NOT EXISTS user_edited boolean DEFAULT false;

-- Cross-cluster connections
CREATE TABLE public.atlas_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dot_id_a uuid REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  dot_id_b uuid REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  connection_type text NOT NULL DEFAULT 'signal_overlap',
  shared_signals jsonb DEFAULT '[]',
  strength int DEFAULT 0,
  insight_text text,
  is_gold_moment boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(dot_id_a, dot_id_b)
);
ALTER TABLE public.atlas_connections ENABLE ROW LEVEL SECURITY;
-- RLS: user can CRUD own rows

-- Dot evolution history
CREATE TABLE public.atlas_dot_evolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dot_id uuid REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  previous_title text NOT NULL,
  new_title text NOT NULL,
  previous_description text,
  new_description text,
  evolution_type text NOT NULL,
  trigger_reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.atlas_dot_evolutions ENABLE ROW LEVEL SECURITY;
-- RLS: user can CRUD own rows
```

## 1. Dot Validation Flow (after dot creation)

**Edit: `AtlasWinningCard.tsx`**

Replace the single "Add to Atlas" button with 4 validation actions:
- "Yes, that's me" → confirms and saves (current behavior)
- "Close, but not quite" → calls edge function with flag to regenerate 2-3 title/description variations, user picks one
- "Not really" → discards, shows a single follow-up text input, regenerates from that
- "Let me edit" → shows inline edit fields for title and description, saves edited version with `user_edited = true`

**Edit: `AtlasQuestFlow.tsx`**

Add state for validation mode (`validating | regenerating | editing | discarded`). Pass validation handlers to WinningCard. When saving, set `user_validated = true`.

## 2. Dot Evolution System

**New: `supabase/functions/evolve-atlas-dot/index.ts`**

Edge function that checks evolution conditions after each new dot is saved:
- **Reframe**: Same cluster has a dot with overlapping signals but different emotional tone → generate evolved title
- **Expansion**: Dot has been reinforced 2+ times → generate more specific title
- **Upgrade**: 4+ signals confirmed → generate identity-level title ("I am someone who...")
- **Merge**: 2+ dots across different clusters share 2+ signals → generate merged dot, mark originals as `evolved_from_ids`

Uses Lovable AI (gemini-2.5-flash) with PDR 13 language rules (observational, no labels, echo user words).

Returns evolution proposal (type, new title, new description) — applied client-side after user sees the result.

**Edit: `AtlasQuestFlow.tsx`**

After saving a dot, call `evolve-atlas-dot` with the user's full dot list. If evolution is returned, show a subtle toast/card: "A discovery is evolving..." with the old→new title. User can accept or dismiss.

## 3. Cross-Cluster Connection Detection

**New: `src/lib/atlasConnectionEngine.ts`**

Client-side utility that scans all user dots for:
- Signal overlap (2+ shared signals across clusters) → creates connection
- Theme repetition (3+ dots with same signal) → flags for upgrade
- Gold Moment detection (frustration cluster dot + strength/skill cluster dot share signals)

Function: `detectConnections(dots: AtlasDot[], existingConnections: Connection[])` → returns new connections to insert.

**Edit: `AtlasQuestFlow.tsx`**

After saving dot + evolution check, run `detectConnections`. Insert any new connections. If a Gold Moment is detected, show a special celebration card.

## 4. Gold Moment Experience

**New: `src/components/atlas/GoldMomentCard.tsx`**

Special celebration card shown when a frustration transforms into a strength:
- Gold-themed visuals (amber glow, special confetti)
- Shows the transformation chain (e.g., "Hates Wasted Potential → Turns Ideas into Reality")
- AI-generated superpower name (3-6 words, earned, not assigned)
- Uses naming rules from PDR 13 Section 6.3

**Edit: `generate-atlas-dot/index.ts`**

Add a `mode: "gold_moment"` option that generates a superpower-style name from the frustration→strength pair.

## 5. Growth Reflection Feedback

**Edit: `AtlasQuestFlow.tsx`**

After every 5-8 completed quests (track via `completedCount`), show a brief growth reflection before the next quest starts. Content generated by calling `generate-atlas-dot` with `mode: "growth_reflection"` that references the user's recent dots.

Rules: max 2-3 sentences, references specific dots, observational tone ("You seem to..." not "You are...").

## 6. Mirror Feedback on WinningCard

**Edit: `AtlasWinningCard.tsx`**

Add a small "mirror feedback" line below the dot description. Generated by the edge function alongside the dot — a one-line observational insight like "This shows that connection matters deeply to you."

**Edit: `generate-atlas-dot/index.ts`**

Add `mirrorFeedback` field to the tool output — a single sentence reflecting what the dot reveals about the user. Must follow pattern language rules (use "you often", "this suggests", never "you are").

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration (atlas_dots columns + connections + evolutions tables) | Create |
| `supabase/functions/evolve-atlas-dot/index.ts` | Create — evolution detection + generation |
| `src/lib/atlasConnectionEngine.ts` | Create — cross-cluster connection detection |
| `src/components/atlas/GoldMomentCard.tsx` | Create — Gold Moment celebration UI |
| `src/components/atlas/AtlasWinningCard.tsx` | Edit — validation flow (4 actions), mirror feedback, edit mode |
| `src/components/atlas/AtlasQuestFlow.tsx` | Edit — validation state, evolution check, connection detection, growth reflections |
| `src/components/atlas/AtlasDotDetailModal.tsx` | Edit — show evolution history, connections |
| `supabase/functions/generate-atlas-dot/index.ts` | Edit — add mirrorFeedback, growth_reflection mode, gold_moment mode, regenerate mode |

