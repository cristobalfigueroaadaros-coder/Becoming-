

# PDR 17 — Atlas Precision, Dot Selection & Meaning Expansion

## Summary

Five changes: (1) Default to 3-option dot selection instead of showing one weak dot first, (2) add internal signal tags to dots, (3) persist Golden Moments as a special cluster, (4) add two new service clusters (Who I Serve, How I Create Impact) unlocking at 10+ quests, (5) replace "Pattern Detected" language with "Atlas Dot" language throughout.

## 1. Three-Option Default Dot Selection

**Problem**: The single first dot is often the weakest. The 3 variations generated after "Close, but not quite" are consistently better.

**Solution**: Make the `generate` mode in the edge function return 3 options by default. The user picks one. Keep "Let me edit" and "Not really" as fallbacks.

**Edit: `supabase/functions/generate-atlas-dot/index.ts`**

- Change the `generate` mode's tool from `create_atlas_dot` (single dot) to `create_atlas_dot_options` returning 3 variations (same schema as current `regenerate` mode but always 3 options + mirrorFeedback + emotionalTone + suggestedClusterSlug as shared fields).
- Keep `regenerate` mode for "Not really" with user feedback.

**Edit: `src/components/atlas/AtlasWinningCard.tsx`**

- Replace the current `initial` validation mode with a 3-option picker as default.
- Show 3 cards, user taps the one that fits. Below: "None of these" (→ "Not really" flow) and "Let me edit" (→ editing mode).
- Remove the "Yes, that's me" single-confirm + "Close, but not quite" buttons — no longer needed since we start with 3 options.

**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**

- After AI generation, set `variations` directly from the 3 options returned.
- Set `validationMode` to `"picking"` by default instead of `"initial"`.
- Store non-selected options as secondary signal data in the quest record's `interactions` JSON.

## 2. Internal Signal Tags on Dots

**Migration**: Add tags column to `atlas_dots`:

```sql
ALTER TABLE public.atlas_dots
  ADD COLUMN IF NOT EXISTS signal_tags jsonb DEFAULT '{}';
```

`signal_tags` stores: `{ signalType, emotionalTone, actionType, dotSubType }` — all from the AI output.

**Edit: `supabase/functions/generate-atlas-dot/index.ts`**

Add `signalType` (skill/value/experience/identity/audience/action/emotional_insight) and `actionType` (create/connect/guide/build/teach/support/express/organize) to the tool schema output for each variation.

**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**

When saving, store AI-returned tags in `signal_tags` JSON column.

## 3. Golden Moment Persistent Cluster

**Migration**: Insert a new cluster and assign it to a meta domain:

```sql
-- Insert Golden Moments cluster (special, no unlock phase restriction)
INSERT INTO public.atlas_clusters (name, slug, description, sort_order, cluster_category, meta_domain_id)
VALUES ('Golden Moments', 'golden-moments', 'Where your discoveries converge into deeper meaning.', 14, 'vision',
  (SELECT id FROM public.atlas_meta_domains WHERE name = 'Person' LIMIT 1));
```

**Edit: `src/hooks/useAtlas.tsx`**

- Add `golden-moments` to phase 1 so it's always unlocked (or handle it specially — always visible once the user has at least one gold moment).
- Add a special color for the golden-moments cluster.

**Edit: `src/pages/AtlasPage.tsx`**

- Add position for the 14th cluster (golden-moments). Place it centrally (e.g., `{ x: 50, y: 45 }`).
- Only render it if the cluster has dots (or always show it dimmed).

**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**

- When a Gold Moment is detected and confirmed: save a new `atlas_dot` in the `golden-moments` cluster with the superpower name as title, link to source dots via `evolved_from_ids`.
- Mark the gold moment dot with `is_gold_moment: true`.

**Edit: `src/components/atlas/GoldMomentCard.tsx`**

- After user taps "Continue", the gold moment dot is already saved (move saving before showing the card).

## 4. Service Layer — Two New Clusters

**Migration**: Insert two new clusters:

```sql
INSERT INTO public.atlas_clusters (name, slug, description, sort_order, cluster_category, meta_domain_id)
VALUES 
  ('Who I Serve', 'who-i-serve', 'The people you feel most called to help.', 15, 'vision',
    (SELECT id FROM public.atlas_meta_domains WHERE name = 'Environment' LIMIT 1)),
  ('How I Create Impact', 'how-i-create-impact', 'How you naturally express value in the world.', 16, 'vision',
    (SELECT id FROM public.atlas_meta_domains WHERE name = 'Product' LIMIT 1));
```

**Edit: `src/hooks/useAtlas.tsx`**

- Add a new phase 5 with threshold 10 for `who-i-serve` and `how-i-create-impact`.

**Edit: `src/pages/AtlasPage.tsx`**

- Add positions for clusters 15 and 16 (e.g., `{ x: 30, y: 78 }` and `{ x: 68, y: 82 }`).

**Edit: `src/data/atlasQuests.ts`**

- Add 4 quests per new cluster (8 total). Questions drawn from PDR 17 examples (audience identification, contribution style).

**Edit: `supabase/functions/generate-atlas-dot/index.ts`**

- Add `CLUSTER_INTELLIGENCE` entries for "Who I Serve" and "How I Create Impact" with correct examples and wrong examples.

**Edit: `src/data/atlasSignals.ts`**

- Add signal mappings for the new quest keys.

## 5. Language Updates — "Atlas Dot" Not "Pattern"

**Edit: `src/components/atlas/AtlasWinningCard.tsx`**

- Replace `"Pattern Detected"` → `"New Atlas Dot"`
- Replace `"Pattern Reinforced"` → `"Atlas Dot Reinforced"`
- Replace `"New Atlas Signal"` → `"New Atlas Dot"`

**Edit: `src/components/atlas/AtlasQuestFlow.tsx`**

- Update toast messages: `"Discovery added to Atlas!"` (already good), `"Discovery reinforced!"` (already good).
- Update loading text: `"Discovering patterns…"` → `"Discovering…"`

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration (signal_tags column + 3 new clusters) | Create |
| `supabase/functions/generate-atlas-dot/index.ts` | Edit — 3-option default, signal tags, new cluster intelligence |
| `src/components/atlas/AtlasWinningCard.tsx` | Edit — 3-option picker as default, language updates |
| `src/components/atlas/AtlasQuestFlow.tsx` | Edit — handle 3 options, save gold moments to cluster, signal tags |
| `src/components/atlas/GoldMomentCard.tsx` | Edit — save gold moment dot before showing card |
| `src/hooks/useAtlas.tsx` | Edit — phase 5 for service clusters, golden-moments handling |
| `src/pages/AtlasPage.tsx` | Edit — positions for 3 new clusters |
| `src/data/atlasQuests.ts` | Edit — add 8 service cluster quests |
| `src/data/atlasSignals.ts` | Edit — add signal mappings for service quests |
| `src/hooks/useAtlasQuests.tsx` | Edit — include service clusters in quest rotation after 10 dots |

