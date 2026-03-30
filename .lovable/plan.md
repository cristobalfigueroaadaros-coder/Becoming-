

# Atlas Core Fix — Precision, Integrity & Humanization

## Summary

Seven targeted fixes to make each cluster speak its own truth: (1) enforce cluster-specific dot formats in AI generation, (2) remove client-side cluster reassignment, (3) gate evolution to require 3+ related dots or mature cluster, (4) humanize growth reflections to mention only 1 pattern, (5) humanize Gold Moments to short recognition phrases, (6) ensure Who I Serve / How I Create Impact create dots properly, (7) prevent duplicate-meaning dots.

## Changes

### 1. Edge Function: `generate-atlas-dot` — Cluster-Specific Dot Formats

Update the system prompt to enforce that each cluster generates dots in its **own format only**:

- Add a `CLUSTER INTEGRITY RULE` block: "The dot MUST match the type of truth this cluster represents. Do NOT generate a skill in a life-events cluster. Do NOT generate an emotion in a skills cluster."
- Add per-cluster **format constraints** to `CLUSTER_INTELLIGENCE`:
  - Skills: `formatRule: "Must describe a repeatable capability. Not an emotion, event, or identity label."`
  - Passions: `formatRule: "Must describe what energizes. Not a skill or solution."`
  - Personal Frustrations: `formatRule: "Must describe something that bothers the user. Not a solution or identity."`
  - Experiments: `formatRule: "Must describe a real action taken. Not an idea or trait."`
  - Aha Moments: `formatRule: "Must describe a specific realization moment. Not a skill or strength."`
  - Life Events: `formatRule: "Must describe a real past event. Not a capability."`
  - Who I Serve: `formatRule: "Must name a specific group of people. Not a method or identity."`
  - How I Create Impact: `formatRule: "Must describe the mechanism of helping. Not an audience or identity."`
  - (Similar for all other clusters)
- Include `formatRule` in the prompt via `getClusterContext()`
- Remove the `CLUSTER_OVERRIDE_RULES` section entirely — dots stay in their quest cluster

### 2. Client: `AtlasQuestFlow.tsx` — Remove Cross-Cluster Reassignment

- Delete `resolveTargetClusterSlug` function entirely
- Remove `suggestedClusterSlug` state and all references
- Remove `CLUSTER_OVERRIDE_RULES` from edge function
- Remove `suggestedClusterSlug` from the tool schema
- Dots always save to `clusterId` (the quest's cluster)

### 3. Edge Function: `evolve-atlas-dot` — Gate Evolution

Current: evolves on reframe (different category in same cluster), expansion (confidence ≥ 1.0), upgrade (4+ signals), merge (2+ shared cross-cluster signals). This triggers too often.

Fix:
- Add minimum dot threshold: evolution only fires when the cluster has **≥ 3 dots** OR when confidence ≥ 1.0 (truly reinforced multiple times)
- Remove the `reframe` trigger entirely (different category in same cluster should not auto-evolve)
- Remove the `upgrade` type that auto-generates "I am X" identity statements
- Keep only `expansion` (reinforced 3+ times) and `merge` (2+ shared signals across clusters with ≥3 dots each)
- Update the system prompt tone: replace "I am someone who..." with observational language: "I'm noticing something", "Something keeps repeating", "You might be someone who"

### 4. Edge Function: `generate-atlas-dot` — Growth Reflection Humanization

Update the `growth_reflection` mode prompt:
- "Mention only 1 main pattern, maximum 2 if truly necessary"
- "Do NOT stack identity labels"
- "Sound reflective, not clinical"
- "Maximum 2 sentences"
- Add example: Instead of "You consistently identify as A Clarifier and A Pattern Seeker..." → "Something keeps repeating here. You tend to step back, simplify what feels messy, and find the pattern underneath."
- Change trigger from every 6 quests to every **8 quests** minimum

### 5. Edge Function: `generate-atlas-dot` — Gold Moment Humanization

Update the `gold_moment` mode prompt:
- "The superpower name must be 3-6 words of simple, human language"
- "Do NOT invent compound identity names like 'The Clarity-through-Complexity Code-Breaker'"
- "Do NOT use 'I Am a...' format"
- "Preferred tone: 'You turn complexity into a clear next step', 'You help people move when things feel stuck'"
- "The transformation description must be 1 sentence maximum"
- Add blacklist: no "Architect", "Navigator", "Code-Breaker", "Alchemist" labels

### 6. Client: `AtlasQuestFlow.tsx` — Fix Silent Completion

Currently the flow works for all clusters but "Who I Serve" and "How I Create Impact" may fail silently. Ensure:
- The `handleConfirm` function doesn't skip dot creation for any cluster
- Add error logging if dot insert fails for these clusters
- Verify the quest flow reaches `processAfterAllInteractions` for service clusters (check `useAtlasQuests` returns valid quests for these slugs)

### 7. Edge Function: `generate-atlas-dot` — Duplicate Prevention

Add to the system prompt:
- "Each of the 3 dot options must be meaningfully different from each other"
- "Do NOT generate variations that mean the same thing with different words (e.g., 'Problem Solver' and 'Debugger' are the same)"
- "Each option must highlight a genuinely different aspect of what the user said"

Also add to client-side `handleConfirm`: before saving, check if any existing dot in the same cluster has a very similar title (fuzzy match on first 3 words). If match found, reinforce instead of creating duplicate.

### 8. Edge Function: `generate-atlas-dot` — Connection Spam Fix

Update connection detection in `atlasConnectionEngine.ts`:
- Raise minimum shared signals from 2 to **3** for `signal_overlap` connections
- Keep Gold Moment threshold at 2 (frustration↔strength)

## Files to Edit

| File | Action |
|------|--------|
| `supabase/functions/generate-atlas-dot/index.ts` | Edit — add formatRule per cluster, remove cluster override rules, humanize growth reflection + gold moment prompts, add duplicate prevention rules |
| `supabase/functions/evolve-atlas-dot/index.ts` | Edit — gate to ≥3 dots, remove reframe/upgrade, observational tone |
| `src/components/atlas/AtlasQuestFlow.tsx` | Edit — remove resolveTargetClusterSlug, remove suggestedClusterSlug, add duplicate fuzzy check, fix growth reflection trigger to 8 |
| `src/lib/atlasConnectionEngine.ts` | Edit — raise signal overlap threshold to 3 |

