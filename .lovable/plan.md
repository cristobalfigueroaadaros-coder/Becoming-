

# PDR 14 — How the System Speaks About a Human Life

## Summary

Fix the critical gap where the AI generates dots that don't match what the user said. This PDR upgrades the `generate-atlas-dot` edge function with emotional tone detection, dot type classification (behavioral/motivational/identity), the 6 core naming rules, shadow blacklisting for positive answers, and enforces a max-2 cluster rotation rule.

## What's Broken (from real testing)

- User says "frustrated by people going through life like zombies" → system generates "Fear of Failure"
- User says "connecting with people, creating with their gifts" → system generates "Perfectionism Loop"
- Shadow labels applied to positive/vision answers
- Same cluster appearing 3+ times in a row

## Changes

### 1. Upgrade `generate-atlas-dot` Edge Function

**File: `supabase/functions/generate-atlas-dot/index.ts`**

Major prompt rewrite for the `generate` mode:

- **Add Emotional Tone Detection step**: Before naming, classify the answer as one of 6 tones (positive/outward, vision/values, personal struggle, factual event, passion/enjoyment, transformation). Include tone classification in the tool output.
- **Add Dot Type Classification**: Behavioral (what user does), Motivational (why they do it), Identity (who they're becoming). Include in tool output.
- **Shadow Blacklist Rule**: Add explicit instruction — "A positive, strengths-based, or outward-facing answer NEVER generates a shadow dot. Shadow dots can ONLY come from answers that express personal struggle, tension, or fear. If the answer describes someone else's problem or the world's problem, it is Vision/Values, NOT personal frustration. BLACKLISTED shadow names for non-struggle answers: Fear of Failure, Perfectionism Loop, Overthinking Pattern, Avoidance Behavior, Self Doubt."
- **Cluster Override Rule**: Add instruction — "The cluster a dot is assigned to is determined by the emotional tone of the answer, not which cluster the quest was designed for." Add `suggestedClusterSlug` to tool output so the system can reassign the dot to the correct cluster.
- **Naming Formula**: Add the Action + Impact structure for behavioral/motivational dots, and identity statement structure for identity dots.
- **Add the 6 Naming Rules** to the prompt (already partially there, reinforce): use user's language, match tone, specificity test ("could this belong to 1M users?"), 3-6 words, no psych labels, cluster matches signal not quest.
- **Update tool schema**: Add `emotionalTone`, `dotSubType` (behavioral/motivational/identity), and `suggestedClusterSlug` fields.

### 2. Cluster Rotation Enforcement

**File: `src/hooks/useAtlasQuests.tsx`**

- Track the last 2 completed cluster slugs (not just the last one)
- In `getNextQuest()`: if the last 2 quests were in the same cluster, exclude that cluster entirely from the current selection
- This prevents 3+ consecutive same-cluster quests

### 3. Growth Reflection Rules Update

**File: `supabase/functions/generate-atlas-dot/index.ts`** (growth_reflection mode)

Update the prompt to enforce:
- Reference specific dot names (already done)
- Connect at least 2 dots from different clusters
- End with an open observation, never a definitive conclusion
- Maximum 3 sentences

### 4. Handle Cluster Reassignment in Quest Flow

**File: `src/components/atlas/AtlasQuestFlow.tsx`**

When the AI returns a `suggestedClusterSlug` different from the quest's original cluster:
- Look up the correct cluster ID from the clusters list
- Use that cluster ID when inserting the dot
- This implements "cluster matches signal, not quest"

## Files to Edit

| File | Action |
|------|--------|
| `supabase/functions/generate-atlas-dot/index.ts` | Edit — tone detection, dot type classification, shadow blacklist, cluster override, naming formula, updated tool schema |
| `src/hooks/useAtlasQuests.tsx` | Edit — track last 2 clusters, enforce max-2 rotation |
| `src/components/atlas/AtlasQuestFlow.tsx` | Edit — handle `suggestedClusterSlug` for cluster reassignment |

