

# Atlas Quest Discovery System

## Overview

Build a quest engine that generates Atlas Dots through 4-interaction gamified quests. Each quest targets a cluster, uses varied interaction mechanics, and culminates in a Winning Card celebration that inserts a new dot into the Atlas.

## Database

**New table: `atlas_quests`** — tracks quest completion per user

```sql
CREATE TABLE public.atlas_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cluster_id uuid REFERENCES public.atlas_clusters(id),
  quest_key text NOT NULL,           -- e.g. "passions_q1"
  interactions jsonb DEFAULT '[]',   -- stores user responses per step
  status text DEFAULT 'in_progress', -- in_progress | completed
  generated_dot_id uuid REFERENCES public.atlas_dots(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.atlas_quests ENABLE ROW LEVEL SECURITY;
-- Standard user-owns-row policies (SELECT/INSERT/UPDATE)
```

No edge function needed — dot interpretation will use a deterministic client-side mapping (quest answers → dot title/description), matching the existing capability/superpower pattern.

## Quest Content Data

**New file: `src/data/atlasQuests.ts`**

Static quest definitions for all 13 clusters. Each quest has:
- `clusterId` (matched by slug)
- `interactions`: array of 4 steps, each with a `type` and `options`

Interaction types (reusable):
- `multi_select` — pick 2-3 from 5-6 options
- `ranking` — order 4 items by priority
- `scenario` — choose between 2-3 scenarios
- `card_pick` — select 1 card from 4 visual cards
- `energy_slider` — rate 3 items on a 1-5 scale
- `reflection` — short text input (1-2 sentences)

Each cluster gets one quest initially (13 quests total). The interpretation mapping (answers → dot title) is embedded in the quest definition.

## New Components

### `src/components/atlas/AtlasQuestFlow.tsx`
Full-screen quest experience. Renders 4 sequential interactions with animated transitions. Props: `quest definition`, `onComplete(dotData)`. Manages step state, validates each step, and triggers the Winning Card after step 4.

### `src/components/atlas/AtlasQuestInteraction.tsx`
Renders a single interaction step based on type. Handles `multi_select`, `ranking`, `scenario`, `card_pick`, `energy_slider`, `reflection`. Each returns structured response data.

### `src/components/atlas/AtlasWinningCard.tsx`
Celebration modal shown after interaction 4. Displays:
- "We discovered a new Atlas signal"
- Generated dot title + short explanation
- Confetti animation (reuse existing `canvas-confetti`)
- "Add to Atlas" button

On confirm: inserts dot into `atlas_dots`, saves quest to `atlas_quests`, navigates to Atlas page, and invalidates react-query cache so the new dot appears.

## Quest Entry Points

### From Atlas Page (`AtlasPage.tsx`)
- Add a floating "Start Quest" button at bottom of Atlas screen
- When tapped, system picks a random cluster (avoiding last completed cluster, preferring clusters with fewer dots)
- Opens `AtlasQuestFlow` full-screen

### From Cluster Detail (`AtlasClusterDetail.tsx`)
- Add "Explore" button in empty cluster state and as secondary action in populated clusters
- Starts a quest specifically for that cluster

## Quest Assignment Logic

**In `src/hooks/useAtlasQuests.tsx`:**
- Fetch completed quests for user
- `getNextQuest()`: picks random cluster weighted toward least-explored clusters, avoids last-completed cluster
- Returns the quest definition for the selected cluster

## Route

Add `/atlas/quest` route in `App.tsx` pointing to a wrapper page that loads `AtlasQuestFlow`.

## Flow Summary

```text
User taps "Start Quest" on Atlas
  → system picks cluster (random, weighted)
  → AtlasQuestFlow renders interaction 1
  → user completes interaction 1-4
  → AtlasWinningCard appears with confetti
  → user taps "Add to Atlas"
  → dot inserted into atlas_dots
  → quest saved to atlas_quests
  → navigate to /atlas (dot visible in cluster)
```

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration (atlas_quests table) | Create |
| `src/data/atlasQuests.ts` | Create (13 quest definitions) |
| `src/components/atlas/AtlasQuestFlow.tsx` | Create |
| `src/components/atlas/AtlasQuestInteraction.tsx` | Create |
| `src/components/atlas/AtlasWinningCard.tsx` | Create |
| `src/hooks/useAtlasQuests.tsx` | Create |
| `src/pages/AtlasQuestPage.tsx` | Create (route wrapper) |
| `src/pages/AtlasPage.tsx` | Edit (add Start Quest button) |
| `src/components/atlas/AtlasClusterDetail.tsx` | Edit (add Explore button) |
| `src/components/atlas/index.ts` | Edit (add exports) |
| `src/App.tsx` | Edit (add /atlas/quest route) |

