

# PDR 10 — Atlas Discovery Engine Personalization & Humanization

## Summary

This PDR addresses seven issues: (1) repetitive interaction mechanics, (2) limited discovery types, (3) generic pattern explanations, (4) artificial dot names, (5) robotic language, (6) dots appearing inside cluster nodes, and (7) dot name persistence bug. The solution uses AI-powered dot naming and explanations from the user's reflection text, adds new interaction types (emoji_scale, visual_metaphor, sentence_completion, memory_flash), fixes the visual layout, and rewrites quest content with simpler language.

## 1. New Interaction Types

**Edit: `src/data/atlasQuests.ts`**

Add 4 new interaction types to `InteractionType`:

```typescript
type InteractionType = "multi_select" | "ranking" | "scenario" | "card_pick" 
  | "energy_slider" | "reflection" 
  | "emoji_scale" | "visual_metaphor" | "sentence_completion" | "memory_flash";
```

- `emoji_scale`: Shows emoji options (e.g., 😠😐🙂😄🤯) with labels. Data: `emojiOptions: {emoji, label}[]`
- `visual_metaphor`: Like card_pick but with metaphor-style options and a softer intro prompt
- `sentence_completion`: User completes a sentence stem. Data: `sentenceStem: string`
- `memory_flash`: Trigger prompt + free text response (like reflection but with a "close your eyes" style intro). Data: `memoryPrompt: string`

**Edit: `src/components/atlas/AtlasQuestInteraction.tsx`**

Add UI renderers for each new type:
- `emoji_scale`: Horizontal row of emoji buttons with labels below
- `visual_metaphor`: Card-style options with slightly larger text and italic styling
- `sentence_completion`: Display the stem in bold, followed by a text input (not textarea)
- `memory_flash`: Display the memory prompt in italic, then a textarea for response

## 2. Rewrite All 52 Quests

**Edit: `src/data/atlasQuests.ts`**

Rewrite all quest content following these rules:
- Questions must be short, clear, emotionally recognizable
- Replace overly abstract/philosophical questions with direct ones
- Use the new interaction types: vary mechanics across quests so no two quests in the same cluster use identical interaction patterns
- Interaction 4 MUST always be `reflection`, `sentence_completion`, or `memory_flash` (open-ended)
- Remove generic fallback descriptions like "Discovered through Atlas quest exploration."
- Rename dot titles from abstract labels ("Emotional Cartographer", "Memory Alchemist", "Rhythm Designer") to concrete identity phrases ("Deep Feeler", "Pattern Finder", "Chose Freedom")

## 3. AI-Powered Dot Naming & Pattern Explanations

**New edge function: `supabase/functions/generate-atlas-dot/index.ts`**

This function takes the user's 4 quest responses (especially the final reflection) and generates:
- A personalized dot title (2-4 words, identity phrase style)
- A personalized description referencing the user's actual answers
- The dot category (strength/shadow/life_imprint)

Uses Lovable AI (gemini-2.5-flash) with a prompt that enforces:
- Title must be a simple identity phrase, not a psychological label
- Description must reference specific things the user said
- Language must be conversational and human

**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**

After step 4 completes:
1. Still run signal extraction for pattern detection
2. If a pattern is detected, use pattern title but call the edge function to personalize the description using the user's reflection text
3. If no pattern, call the edge function to generate both title and description from responses
4. Fallback to current `interpret()` if the edge function fails

Add a brief loading state ("Discovering patterns...") while the AI generates.

**Edit: `src/components/atlas/AtlasWinningCard.tsx`**

Update the description display to use the personalized AI-generated text. Show it with slightly more emphasis (larger font, not italic).

## 4. Quest Language Cleanup

All quest prompts must follow these rules (applied in the quest rewrite in step 2):
- Max 12 words per question
- No questions starting with "What recurring frustration is attempting to teach you"
- Replace "Which of the following resonates" patterns with direct asks
- Bad: "What do you wish others recognized in you more?" → Good: "What ability do you wish people noticed?"
- Bad: "Rhythm Designer" → Good: "Found My Pace"

## 5. Atlas Map Visualization Fix — Dots Outside Clusters

**Edit: `src/components/atlas/AtlasClusterNode.tsx`**

Current issue: dots render inside the main circle via `getOrbitPositions` with orbits at 20px, 34px, 48px — these overlap with the main circle (64-108px diameter = 32-54px radius).

Fix: Increase orbit radii so dots appear clearly outside the main circle:
- Orbit 1: radius = `(style.size / 2) + 12` (just outside the edge)
- Orbit 2: radius = `(style.size / 2) + 24`  
- Orbit 3: radius = `(style.size / 2) + 36`

Also increase the button container size to accommodate the outer dots.

## 6. Dot Name Persistence Bug Fix

**Edit: `src/components/atlas/AtlasClusterNode.tsx`**

The bug: cluster name text disappears when dots are added. Root cause is likely the `z-10` content div being overlapped by absolutely-positioned orbit dots. 

Fix:
- Ensure the name/count `div` has `z-20` and `pointer-events-none` on the orbit dots layer
- Ensure the name text is always rendered regardless of dot count
- Add a subtle semi-transparent background behind the name text for readability when dots surround it

## 7. Signal Map Updates for New Interaction Types

**Edit: `src/data/atlasSignals.ts`**

Add signal mappings for the new interaction types:
- `emoji_scale`: Map each emoji value to signals (higher emoji = stronger signal)
- `sentence_completion` and `memory_flash`: Treat like `_reflection` — emit generic cluster-appropriate signals

**Edit: `src/lib/atlasSignalEngine.ts`**

Update `extractSignals` to handle new interaction types:
- `emoji_scale`: Use the selected emoji index as a strength multiplier
- `sentence_completion` / `memory_flash`: Same as reflection handling

## Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/generate-atlas-dot/index.ts` | Create — AI dot naming + description |
| `src/data/atlasQuests.ts` | Edit — new interaction types, rewrite all 52 quests |
| `src/components/atlas/AtlasQuestInteraction.tsx` | Edit — add 4 new mechanic renderers |
| `src/components/atlas/AtlasQuestFlow.tsx` | Edit — integrate AI generation, loading state |
| `src/components/atlas/AtlasWinningCard.tsx` | Edit — display personalized descriptions |
| `src/components/atlas/AtlasClusterNode.tsx` | Edit — fix dot positioning outside circles, fix name persistence |
| `src/data/atlasSignals.ts` | Edit — add signal maps for new types |
| `src/lib/atlasSignalEngine.ts` | Edit — handle new interaction types |

