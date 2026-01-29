

# Lifetime Map Implementation Plan

## Overview

The Lifetime Map is the third tab of the Inner Work Lab, providing a horizontal timeline view of the user's life events connected to patterns and transmutations. The key design principle is **"Life Event Label first"** - users describe what happened before naming any psychological patterns.

---

## Architecture Summary

| Existing Component | Lifetime Map Equivalent |
|-------------------|------------------------|
| `PatternMapCanvas.tsx` | `LifetimeMapTimeline.tsx` (NEW) |
| `PatternMapNode.tsx` | `LifetimeEventCard.tsx` (NEW) |
| `PatternNodeEditModal.tsx` | `LifetimeEventEditModal.tsx` (NEW) |
| Pattern tab in `PatternMap.tsx` | Lifetime tab enabled in same page |

---

## Database Changes

### Create new `lifetime_events` table

This table stores life events separately from patterns, allowing standalone event creation:

```sql
CREATE TABLE public.lifetime_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Time Anchor (required)
  time_period TEXT NOT NULL,  -- 'childhood', 'teen', 'early_20s', 'mid_20s', 'late_20s', '30s', 'current'
  
  -- Life Event (required entry point)
  event_label TEXT NOT NULL,  -- "My parents separated"
  event_description TEXT,      -- Optional longer description
  
  -- Event Type (optional helper tag)
  event_type TEXT,  -- 'family', 'love', 'health', 'money', 'work', 'friendship', 'identity', 'loss', 'change'
  
  -- Pattern Connection (optional, can be linked later)
  pattern_id UUID REFERENCES public.inner_patterns(id) ON DELETE SET NULL,
  pattern_name TEXT,  -- Cached for display when no pattern_id
  
  -- Transmutation Connection (synced from pattern)
  gold_outcome TEXT,  -- "I became resilient" - from transmutation gold_insight
  is_transmuted BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.lifetime_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own lifetime events" 
ON public.lifetime_events FOR ALL 
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_lifetime_events_user ON public.lifetime_events(user_id);
CREATE INDEX idx_lifetime_events_pattern ON public.lifetime_events(pattern_id);
CREATE INDEX idx_lifetime_events_time ON public.lifetime_events(time_period);
```

---

## Implementation Steps

### Step 1: Create Database Migration

Add the `lifetime_events` table with the schema defined above.

---

### Step 2: Create Lifetime Events Hook

**File:** `src/hooks/useLifetimeEvents.tsx` (NEW)

A dedicated hook for managing lifetime events:

```typescript
export interface LifetimeEvent {
  id: string;
  user_id: string;
  time_period: TimePeriod;
  event_label: string;
  event_description: string | null;
  event_type: EventType | null;
  pattern_id: string | null;
  pattern_name: string | null;
  gold_outcome: string | null;
  is_transmuted: boolean;
  created_at: string;
  updated_at: string;
}

export type TimePeriod = 
  | 'childhood' 
  | 'teen' 
  | 'early_20s' 
  | 'mid_20s' 
  | 'late_20s' 
  | '30s' 
  | 'current';

export type EventType = 
  | 'family' 
  | 'love' 
  | 'health' 
  | 'money' 
  | 'work' 
  | 'friendship' 
  | 'identity' 
  | 'loss' 
  | 'change';

export function useLifetimeEvents() {
  // Load events
  // Create event (manual or auto from pattern)
  // Update event
  // Delete event
  // Link event to pattern
  // Sync gold outcome from transmutation
  // Get events grouped by time period
}
```

Key functions:
- `loadEvents()` - Fetch all user's lifetime events
- `createEvent(input)` - Create new event (manual mode)
- `createFromPattern(pattern)` - Auto-create from pattern map
- `linkPattern(eventId, patternId)` - Connect existing event to pattern
- `syncGoldOutcome(eventId, goldText)` - Update when transmutation completes
- `getEventsByPeriod()` - Group events for timeline display

---

### Step 3: Create Lifetime Map Timeline Component

**File:** `src/components/lifetime-map/LifetimeMapTimeline.tsx` (NEW)

A horizontal scrollable timeline with time period columns:

```typescript
interface LifetimeMapTimelineProps {
  events: LifetimeEvent[];
  onEventClick: (event: LifetimeEvent) => void;
  onAddEvent: (timePeriod: TimePeriod) => void;
}
```

**Visual layout:**
```
Childhood   Teen    Early 20s   Mid 20s   Late 20s   30s    Current
   │         │         │          │          │        │        │
   ●─────────●─────────●──────────●──────────●────────●────────●
   │         │         │          │          │        │        │
 ┌───┐     ┌───┐     ┌───┐                          ┌───┐    ┌───┐
 │ E │     │ E │     │ E │                          │ E │    │ + │
 └───┘     └───┘     └───┘                          └───┘    └───┘
```

Features:
- Horizontal scroll for mobile
- Time period headers with subtle styling
- Event cards stacked vertically within each period
- "+" button to add new event in any period
- Color coding: neutral → shadow (linked pattern) → gold (transmuted)

---

### Step 4: Create Lifetime Event Card Component

**File:** `src/components/lifetime-map/LifetimeEventCard.tsx` (NEW)

Individual event card displayed in the timeline:

```typescript
interface LifetimeEventCardProps {
  event: LifetimeEvent;
  onClick: () => void;
}
```

**Card structure:**
- Event label (primary text)
- Event type badge (optional, soft color)
- Pattern indicator (if linked)
- Gold badge (if transmuted, shows gold_outcome)
- Visual state changes based on status

**Color language:**
- **No pattern:** Neutral gray/soft background
- **Pattern linked:** Indigo/purple tint (shadow phase)
- **Transmuted:** Amber/gold highlight with sparkle

---

### Step 5: Create Lifetime Event Edit Modal

**File:** `src/components/lifetime-map/LifetimeEventEditModal.tsx` (NEW)

Modal for creating/editing lifetime events:

```typescript
interface LifetimeEventEditModalProps {
  open: boolean;
  onClose: () => void;
  event?: LifetimeEvent | null;  // null = creating new
  defaultTimePeriod?: TimePeriod;
  onSave: (data: LifetimeEventInput) => void;
  onDelete?: () => void;
}
```

**Form fields:**
1. **Time Period** (required) - Select/buttons for time anchors
2. **Life Event Label** (required) - Text input with placeholder examples
3. **Event Type** (optional) - Select with soft category tags
4. **Description** (optional) - Textarea for details
5. **Pattern Activated** (optional, read-only if linked from pattern)

**Placeholder examples from PDR:**
- "My parents separated"
- "I moved to a new country alone"
- "I had an injury that changed my life"
- "I lost someone I loved"
- "My first business failed"
- "A breakup that broke me"

---

### Step 6: Create Event Detail View Component

**File:** `src/components/lifetime-map/LifetimeEventDetailView.tsx` (NEW)

Expanded view when user clicks an event:

```typescript
interface LifetimeEventDetailViewProps {
  event: LifetimeEvent;
  onGoToPatternMap: () => void;
  onGoToTransmutation: () => void;
  onTalkToMentor: () => void;
  onEdit: () => void;
  onClose: () => void;
}
```

**Content:**
- Life Event Label (large)
- Time period badge
- Pattern info (if present)
- Gold outcome (if transmuted, displayed prominently)
- Action buttons:
  - "Go to Pattern Map" (if pattern linked)
  - "Go to Transmutation Map" (if pattern linked)
  - "Talk to Inner Self Mentor"
  - "Edit Entry"
  - "Delete Entry" (with confirmation)

---

### Step 7: Create Pattern Link Suggestion Card

**File:** `src/components/lifetime-map/PatternLinkSuggestion.tsx` (NEW)

Notification/prompt when event has no pattern:

```typescript
interface PatternLinkSuggestionProps {
  eventLabel: string;
  onMapPattern: () => void;
  onDismiss: () => void;
}
```

**Copy from PDR:**
> "This event shaped you deeply. Want to map the pattern it created?"
> Buttons: [Map Pattern] [Not now]

---

### Step 8: Create Transmutation Ready Card

**File:** `src/components/lifetime-map/TransmutationReadyCard.tsx` (NEW)

Prompt when pattern exists but no transmutation:

```typescript
interface TransmutationReadyCardProps {
  patternName: string;
  onStartTransmutation: () => void;
  onDismiss: () => void;
}
```

**Copy from PDR:**
> "Ready to transform this into gold?"
> Buttons: [Start Transmutation] [Not now]

---

### Step 9: Enable Lifetime Tab in PatternMap.tsx

**File:** `src/pages/PatternMap.tsx` (MODIFY)

1. Remove the `disabled` attribute from the Lifetime tab
2. Add state for lifetime events
3. Load events using `useLifetimeEvents` hook
4. Render `LifetimeMapTimeline` when tab is active
5. Handle event CRUD operations

**Tab content structure:**
```typescript
{activeTab === "lifetime" && (
  <LifetimeMapTimeline
    events={lifetimeEvents}
    currentPatternId={pattern.id}
    onEventClick={handleEventClick}
    onAddEvent={handleAddEvent}
  />
)}
```

---

### Step 10: Auto-Population from Inner Work Flows

**Automatic event creation triggers:**

1. **Pattern Map created with life_event node:**
   - When `life_events.life_event` is filled in Pattern Map
   - Create corresponding lifetime_event linked to the pattern

2. **Pattern with life_event_age_category:**
   - Use the age category as time_period
   - Auto-create lifetime event

3. **Transmutation completed:**
   - Update existing lifetime_event with `gold_outcome`
   - Set `is_transmuted = true`

**Implementation:** Add effects in `useInnerPatterns` or create a dedicated sync function.

---

### Step 11: Update Transmutation Celebration

**File:** `src/components/transmutation-map/TransmutationCelebration.tsx` (MODIFY)

Change the "View in Lifetime Map" button to actually navigate:

```typescript
const handleCelebrationViewLifetime = () => {
  setShowCelebration(false);
  setActiveTab("lifetime");  // Switch to lifetime tab
  // Sync gold outcome to lifetime event
  syncLifetimeGoldOutcome(pattern.id, transmutationData.gold_insight);
};
```

---

### Step 12: Create Index Export

**File:** `src/components/lifetime-map/index.ts` (NEW)

```typescript
export { LifetimeMapTimeline } from "./LifetimeMapTimeline";
export { LifetimeEventCard } from "./LifetimeEventCard";
export { LifetimeEventEditModal } from "./LifetimeEventEditModal";
export { LifetimeEventDetailView } from "./LifetimeEventDetailView";
export { PatternLinkSuggestion } from "./PatternLinkSuggestion";
export { TransmutationReadyCard } from "./TransmutationReadyCard";
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| Database migration | CREATE | `lifetime_events` table |
| `src/hooks/useLifetimeEvents.tsx` | CREATE | Lifetime events data management |
| `src/components/lifetime-map/LifetimeMapTimeline.tsx` | CREATE | Horizontal scrollable timeline |
| `src/components/lifetime-map/LifetimeEventCard.tsx` | CREATE | Individual event card |
| `src/components/lifetime-map/LifetimeEventEditModal.tsx` | CREATE | Create/edit event modal |
| `src/components/lifetime-map/LifetimeEventDetailView.tsx` | CREATE | Expanded event view |
| `src/components/lifetime-map/PatternLinkSuggestion.tsx` | CREATE | Pattern linking prompt |
| `src/components/lifetime-map/TransmutationReadyCard.tsx` | CREATE | Transmutation prompt |
| `src/components/lifetime-map/index.ts` | CREATE | Exports |
| `src/pages/PatternMap.tsx` | MODIFY | Enable lifetime tab |
| `src/components/transmutation-map/TransmutationCelebration.tsx` | MODIFY | Navigate to lifetime tab |

---

## Visual Representation (Lifetime Map Layout)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         YOUR LIFE JOURNEY                                 │
│                  "Every moment shaped who you're becoming"                │
└──────────────────────────────────────────────────────────────────────────┘

←───────────────────────── Scroll ─────────────────────────→

Childhood      Teen       Early 20s     Mid 20s     Current
    ·────────────·────────────·────────────·────────────·

  ┌─────────┐  ┌─────────┐                           ┌─────────┐
  │ Parents │  │ First   │                           │ Career  │
  │separated│  │ love    │                           │ change  │
  │   💔    │  │ 💔→✨   │                           │   🌱    │
  └─────────┘  └─────────┘                           └─────────┘
                                                         
  ┌─────────┐                                        ┌─────────┐
  │ Moving  │                                        │   +     │
  │ cities  │                                        │  Add    │
  │   🌍    │                                        │ Event   │
  └─────────┘                                        └─────────┘

  Card States:
  ├── 💔 = Has linked pattern (shadow phase)
  ├── ✨ = Pattern transmuted to gold
  └── 🌱 = Standalone event (no pattern)
```

---

## Time Period Labels

| Value | Display Label |
|-------|---------------|
| `childhood` | Childhood |
| `teen` | Teen Years |
| `early_20s` | Early 20s |
| `mid_20s` | Mid 20s |
| `late_20s` | Late 20s |
| `30s` | 30s |
| `current` | Current Life |

---

## Event Type Tags (Optional)

| Value | Display | Color |
|-------|---------|-------|
| `family` | Family | Blue |
| `love` | Love/Relationship | Pink |
| `health` | Health/Body | Green |
| `money` | Money/Survival | Amber |
| `work` | School/Work | Indigo |
| `friendship` | Friendship | Cyan |
| `identity` | Identity | Purple |
| `loss` | Loss/Grief | Slate |
| `change` | Big Change | Orange |

---

## Success Criteria

1. Lifetime tab is enabled and clickable in Pattern Map page
2. Horizontal timeline displays with time period columns
3. Events can be created manually via "+" button
4. Events display with appropriate visual states
5. Clicking an event opens detail view
6. Actions work: Go to Pattern Map, Go to Transmutation, Talk to Mentor
7. Edit and delete events work correctly
8. Auto-population from Pattern Map works
9. Gold outcome syncs when transmutation completes
10. "View in Lifetime Map" from celebration navigates correctly
11. Pattern link suggestions appear for standalone events
12. Transmutation prompts appear for pattern-linked events

---

## Safety and UX Notes

Following PDR guidelines:

1. **Gentle language:** All prompts use supportive, non-clinical tone
2. **Optional fields:** Only time period and event label are required
3. **User control:** Events can be deleted anytime
4. **Privacy:** All data stays private (RLS enforced)
5. **No pressure:** "Not now" option on all suggestions
6. **Pattern is optional:** Life events can exist without pattern linking
7. **Progressive disclosure:** Details revealed on click, not overwhelming

---

## What This Does NOT Include (Future Expansion)

- Identity Constellation view
- Theme clustering (trust, belonging, confidence)
- "Your top 3 life lessons" summary
- Personalized mentor guidance based on timeline patterns
- Export/share functionality

These can be added in future iterations once the core timeline is validated.

