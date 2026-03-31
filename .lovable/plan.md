

# PDR 1 — Dot Expansion, Mini-Dots, User-Created Dots & Zoom Navigation

## Summary

Transform the Atlas from a static discovery map into an interactive, layered exploration system with four zoom levels: Atlas Map → Cluster View → Dot View → Deep Layer. Add mini-dots (sub-discoveries attached to parent dots), user-created dots, and cluster-specific deepening questions. Remove identity labels from the UI.

## Database Migration

```sql
-- Mini-dots table
CREATE TABLE public.atlas_mini_dots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_dot_id UUID NOT NULL REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT 'user' CHECK (origin IN ('user', 'system')),
  cluster_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.atlas_mini_dots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mini-dots" ON public.atlas_mini_dots
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Track dot origin (quest vs user-created)
ALTER TABLE public.atlas_dots ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'quest';
```

## Architecture: Zoom Levels

```text
Level 1: Atlas Map (existing AtlasPage)
  └─ Click cluster → Level 2

Level 2: Cluster View (redesigned AtlasClusterDetail)
  ├─ Cluster name + description
  ├─ All dots listed
  ├─ [+ Add your own dot] button
  └─ Click dot → Level 3

Level 3: Dot View (new AtlasDotView component, replaces modal)
  ├─ Dot title
  ├─ Short description (1-2 lines)
  ├─ [Go deeper] button → Level 4
  ├─ [Add your own insight] → creates mini-dot
  ├─ Mini-dots list (if any)
  └─ Back → Level 2

Level 4: Deep Layer (new AtlasDotDeepLayer component)
  ├─ Cluster-specific questions (2-3 short prompts)
  ├─ Answers → create mini-dots attached to parent dot
  └─ Back → Level 3
```

## Changes

### 1. Cluster View Redesign (`AtlasClusterDetail.tsx`)

Replace the current bottom sheet with a full-screen view acting as Level 2:
- Show cluster name, short description, dot count
- List all dots as tappable cards
- Add "Add your own dot" button at top
- "Add your own dot" opens an inline form: title input + save button
- User-created dots insert into `atlas_dots` with `origin: 'user'`
- Keep "Explore more" button linking to quests
- Back button returns to Atlas Map (Level 1)

### 2. New Dot View (`AtlasDotView.tsx`)

Replaces `AtlasDotDetailModal` when navigating from Level 2. Full-screen component:
- **Top**: Dot title (original_title if exists)
- **Middle**: Short description, 1-2 lines max
- **Actions**: "Go deeper" button, "Add your own insight" button
- **Below**: Mini-dots list (fetched from `atlas_mini_dots`)
- **Bottom**: "Explore more" link to quests
- Remove: identity labels ("I am a..."), long paragraphs, category explanations, evolution history, connection lists, confidence scores
- Keep: dot category badge (Strength/Shadow/Life Imprint) as small subtle tag
- Back button returns to Cluster View (Level 2)

### 3. New Deep Layer (`AtlasDotDeepLayer.tsx`)

Triggered by "Go deeper" from Dot View:
- Shows 2-3 cluster-specific deepening questions one at a time
- Each answer creates a mini-dot attached to the parent dot
- Uses a simple text input per question, not the full quest interaction system
- After all questions answered, returns to Dot View showing new mini-dots
- Back button returns to Dot View (Level 3)

### 4. Cluster-Specific Deepening Questions

Defined in a new constant `CLUSTER_DEEPENING_QUESTIONS` in `atlasQuests.ts`:

| Cluster | Questions |
|---------|-----------|
| Skills | "When do you use this skill most?", "What happens when you apply it?" |
| Passions | "What specifically about this excites you?", "When did you first feel this?" |
| Personal Frustrations | "Why does this bother you so deeply?", "What would change if this was solved?" |
| Experiments | "What did you learn from doing this?", "Would you do it again differently?" |
| Aha Moments | "What changed after this realization?", "How does this show up now?" |
| Life Events | "How did this moment change you?", "What did you carry forward from it?" |
| Natural Talents | "When does this feel most effortless?", "How do others react to it?" |
| Inspirations | "What specifically inspires you about this?", "How does it influence you?" |
| Values | "When was this value tested?", "How do you live this value daily?" |
| Ideal Life | "What would a day in this life look like?", "What's the first step toward it?" |
| Childhood Signals | "How does this memory connect to who you are now?", "What feeling does it bring back?" |
| Who I Serve | "What do these people struggle with most?", "Why do you feel drawn to help them?" |
| How I Create Impact | "What happens when you do this for others?", "What makes your way unique?" |

### 5. "Add Your Own Insight" (Mini-dot from Dot View)

Button in Dot View opens inline text input. User writes insight → saved as mini-dot with `origin: 'user'`. Appears immediately in the mini-dots list below.

### 6. User-Created Dots (from Cluster View)

"Add your own dot" in Cluster View:
- Shows inline form with title input
- Saves to `atlas_dots` with `origin: 'user'`, `source_system: 'user_created'`, `dot_category: 'strength'`
- Dot appears immediately in the cluster list
- Behaves identically to quest-generated dots (clickable, expandable, supports mini-dots)

### 7. Identity Label Removal

Remove from `AtlasDotDetailModal.tsx` / new `AtlasDotView.tsx`:
- Remove `CATEGORY_META` explanation text
- Remove evolution history section
- Remove connection list section
- Remove confidence score display
- Remove signal sources display
- Remove `dot_type` badge ("Cross-quest pattern" / "Quest discovery")
- Keep only: title, short description, small category badge, mini-dots, action buttons

### 8. Navigation State

Use React state in `AtlasClusterDetail` to manage zoom levels rather than routes:
- Level 1: Atlas Map (AtlasPage — existing)
- Level 2: Cluster View (AtlasClusterDetail — redesigned as full-screen sheet)
- Level 3: Dot View (rendered inside AtlasClusterDetail when a dot is selected)
- Level 4: Deep Layer (rendered inside AtlasClusterDetail when "Go deeper" is tapped)
- Back button at each level returns to previous level

## Files

| File | Action |
|------|--------|
| Migration (atlas_mini_dots table + origin column) | Create |
| `src/components/atlas/AtlasDotView.tsx` | Create — Level 3 dot view |
| `src/components/atlas/AtlasDotDeepLayer.tsx` | Create — Level 4 deepening questions |
| `src/data/atlasQuests.ts` | Edit — add CLUSTER_DEEPENING_QUESTIONS constant |
| `src/components/atlas/AtlasClusterDetail.tsx` | Edit — full redesign with zoom navigation, add-dot form, level management |
| `src/components/atlas/AtlasDotDetailModal.tsx` | Keep for now but no longer used from cluster detail (replaced by AtlasDotView) |
| `src/components/atlas/AtlasDotCard.tsx` | Edit — remove identity labels, simplify display |
| `src/components/atlas/index.ts` | Edit — export new components |
| `src/hooks/useAtlas.tsx` | Edit — add AtlasMiniDot type |

