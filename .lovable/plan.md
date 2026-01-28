

# Transmutation Map Implementation Plan

## Overview

The Transmutation Map is the second tab of the Inner Work Lab, providing a **Black → White → Gold** alchemy journey that transforms painful patterns into wisdom and personal growth. This plan implements the visual map, node editing, celebration flow, and placeholder for the Transmutation Team council.

---

## Architecture Summary

| Existing Component | Transmutation Map Equivalent |
|-------------------|------------------------------|
| `PatternMapCanvas.tsx` | `TransmutationMapCanvas.tsx` (NEW) |
| `PatternMapNode.tsx` | `TransmutationNode.tsx` (NEW) - with phase-aware coloring |
| `PatternNodeEditModal.tsx` | `TransmutationNodeEditModal.tsx` (NEW) - with different prompts |
| `PatternCelebration.tsx` | `TransmutationCelebration.tsx` (NEW) - gold-themed |
| Pattern Map tab in `PatternMap.tsx` | Transmutation tab enabled in same page |

---

## Database Changes

### Extend the `inner_patterns` table

Add a new JSONB column to store transmutation-specific data separately from pattern map nodes:

```sql
ALTER TABLE inner_patterns 
ADD COLUMN IF NOT EXISTS transmutation_data JSONB DEFAULT '{}';
```

**Transmutation data structure:**
```typescript
interface TransmutationData {
  // BLACK PHASE
  shadow?: string;           // "What happened, what feels heavy?"
  dark_night?: string;       // Optional deeper layer
  
  // WHITE PHASE  
  shift_moment?: string;     // "What made you change perspective?"
  protective_purpose?: string; // "What was this pattern protecting you from?"
  lesson_learned?: string;   // "What did you learn?"
  
  // GOLD PHASE
  gold_insight?: string;     // "What did you gain?" (also saved to gold_shift_text)
  letter_to_self?: string;   // "What would you tell your younger self?"
  brave_step?: string;       // Optional action step
  
  // Meta
  phase_completed?: 'black' | 'white' | 'gold';
  completed_at?: string;
}
```

---

## Implementation Steps

### Step 1: Create Database Migration

**Action:** Add `transmutation_data` JSONB column to `inner_patterns` table.

```sql
ALTER TABLE public.inner_patterns 
ADD COLUMN IF NOT EXISTS transmutation_data JSONB DEFAULT '{}';
```

---

### Step 2: Create Transmutation Node Component

**File:** `src/components/transmutation-map/TransmutationNode.tsx` (NEW)

A phase-aware node component that changes appearance based on phase (Black/White/Gold):

```typescript
interface TransmutationNodeProps {
  id: string;
  label: string;
  content: string | null;
  phase: 'black' | 'white' | 'gold';
  x: number;
  y: number;
  size: number;
  isCenter?: boolean;
  isCompleted?: boolean;
  onClick: () => void;
  delay?: number;
}
```

**Visual styling by phase:**
- **Black phase nodes:** Dark gray/slate fill, subtle glow when filled
- **White phase nodes:** Light/clear fill, soft white glow
- **Gold phase nodes:** Amber/gold gradient, prominent glow when activated
- **Completed nodes:** Solid fill with checkmark indicator

---

### Step 3: Create Transmutation Map Canvas

**File:** `src/components/transmutation-map/TransmutationMapCanvas.tsx` (NEW)

SVG-based canvas with three distinct phases arranged in a flow structure:

**Layout (left-to-right or top-to-bottom flow):**

```text
BLACK PHASE                WHITE PHASE                 GOLD PHASE
    │                          │                           │
┌─────────┐              ┌─────────────┐             ┌───────────┐
│ Shadow  │──────────────│Shift Moment │─────────────│Gold Insight│
└─────────┘              └─────────────┘             └───────────┘
    │                          │                           │
┌─────────┐              ┌─────────────┐             ┌───────────┐
│Dark Night│             │ Protective  │             │Letter to  │
│(optional)│             │  Purpose    │             │  Self     │
└─────────┘              └─────────────┘             └───────────┘
                               │                           │
                         ┌─────────────┐             ┌───────────┐
                         │   Lesson    │             │Brave Step │
                         │  Learned    │             │(optional) │
                         └─────────────┘             └───────────┘
```

**Center element:** Pattern Summary node (always visible, links back to Pattern Map)

**Node definitions:**
```typescript
const TRANSMUTATION_NODES = [
  // Black Phase
  { id: 'shadow', label: 'The Shadow', phase: 'black', required: true },
  { id: 'dark_night', label: 'Dark Night', phase: 'black', required: false },
  
  // White Phase
  { id: 'shift_moment', label: 'The Shift', phase: 'white', required: true },
  { id: 'protective_purpose', label: 'Protective Role', phase: 'white', required: true },
  { id: 'lesson_learned', label: 'The Lesson', phase: 'white', required: true },
  
  // Gold Phase
  { id: 'gold_insight', label: 'The Gold', phase: 'gold', required: true },
  { id: 'letter_to_self', label: 'To Younger Me', phase: 'gold', required: true },
  { id: 'brave_step', label: 'Brave Step', phase: 'gold', required: false },
];
```

---

### Step 4: Create Transmutation Node Edit Modal

**File:** `src/components/transmutation-map/TransmutationNodeEditModal.tsx` (NEW)

Enhanced modal with phase-specific prompts and placeholder guidance:

**Node prompts (from PDR):**

| Node | Prompt | Placeholder Examples |
|------|--------|---------------------|
| shadow | "What happened, or what part feels heavy right now?" | "A relationship breakup...", "A moment I felt rejected...", "A memory from childhood..." |
| dark_night | "That moment when it felt like everything was lost. How was it?" | "What did you feel?", "Where were you physically?", "What would you name this moment?" |
| shift_moment | "What made you change your perspective?" | "A conversation...", "A person...", "A realization...", "A decision I finally made..." |
| protective_purpose | "What was this pattern trying to protect you from?" | "Being rejected...", "Feeling shame again...", "Getting hurt...", "Being alone..." |
| lesson_learned | "What did you learn because you lived this?" | "I realized I need boundaries...", "I realized I'm stronger than I thought..." |
| gold_insight | "What did you gain from this experience?" | "A new belief I chose...", "A new strength I discovered...", "A new truth I'm living by..." |
| letter_to_self | "What would you tell your younger self?" | "What do they need to hear?", "What truth would change everything?" |
| brave_step | "What is one small brave action you can take this week?" | "Say no to something...", "Have one honest conversation...", "Choose myself once..." |

**Additional feature:** "Talk to the Transmutation Team" button in every modal (routes to placeholder for now).

---

### Step 5: Enable Transmutation Tab in PatternMap.tsx

**File:** `src/pages/PatternMap.tsx` (MODIFY)

1. Remove the `disabled` attribute from the Transmutation tab
2. Add tab content switching logic
3. Load and display `transmutation_data` from the pattern
4. Handle node editing for transmutation nodes

**Tab content structure:**
```typescript
{activeTab === "pattern-map" && (
  <PatternMapCanvas ... />
)}

{activeTab === "transmutation" && (
  <TransmutationMapCanvas 
    patternName={pattern.pattern_name}
    transmutationData={transmutationData}
    onNodeClick={handleTransmutationNodeClick}
    isCompleted={pattern.status === 'transformed'}
  />
)}
```

---

### Step 6: Create Transmutation Celebration Component

**File:** `src/components/transmutation-map/TransmutationCelebration.tsx` (NEW)

Gold-themed celebration overlay that appears when Gold phase is completed:

**Copy (from PDR):**
- Title: "Transmutation Completed"
- Text: "You turned a difficult moment into wisdom. This is now part of who you are becoming."
- Buttons: "Save Gold Insight" / "View in Lifetime Map"

**Visual style:**
- Amber/gold gradient background
- Sparkle animations
- Confetti effect (reuse existing pattern)

---

### Step 7: Update useInnerPatterns Hook

**File:** `src/hooks/useInnerPatterns.tsx` (MODIFY)

Add functions for transmutation data management:

```typescript
// Add to InnerPattern interface
transmutation_data?: TransmutationData;

// New function
const updateTransmutationData = async (id: string, data: Partial<TransmutationData>) => {
  const pattern = patterns.find(p => p.id === id);
  const currentData = (pattern?.transmutation_data as TransmutationData) || {};
  const updatedData = { ...currentData, ...data };
  
  // If gold phase complete, also update gold_shift_text and status
  if (data.gold_insight && data.letter_to_self) {
    updatedData.phase_completed = 'gold';
    updatedData.completed_at = new Date().toISOString();
    
    await supabase.from("inner_patterns").update({
      transmutation_data: updatedData,
      gold_shift_text: data.gold_insight,
      status: 'transformed',
      transformed_at: new Date().toISOString(),
    }).eq("id", id);
  } else {
    await supabase.from("inner_patterns").update({
      transmutation_data: updatedData
    }).eq("id", id);
  }
  // ... update local state
};

// Helper to check phase completion
const getPhaseStatus = (data: TransmutationData) => ({
  blackComplete: !!data.shadow,
  whiteComplete: !!(data.shift_moment && data.protective_purpose && data.lesson_learned),
  goldComplete: !!(data.gold_insight && data.letter_to_self),
});
```

---

### Step 8: Add "Talk to Transmutation Team" Button

**Implementation:** Add a button in each node edit modal and at the bottom of the Transmutation Map canvas.

**Current behavior (placeholder):**
- Show toast: "Transmutation Team coming soon"
- Button is styled but not fully functional until Day 5 PDR

**Future behavior (after Day 5):**
- Navigate to `/transmutation-council` or open a dedicated council view

---

### Step 9: Color State Logic

**Before transmutation:**
- Black nodes: dark/neutral styling
- White nodes: light/clear styling  
- Gold nodes: "potential gold" (muted amber, dashed border)

**After transmutation completed:**
- All nodes shift to warmer tones
- Gold nodes fully activated with glow
- Pattern status badge changes to "Transmuted"
- Subtle golden border/glow on entire canvas

**Implementation:** Pass `isCompleted` prop to canvas and nodes, apply conditional styling.

---

### Step 10: Auto-Population Logic

The Transmutation Map should pre-fill nodes based on existing Pattern Map data:

| Pattern Map Node | Pre-fills Transmutation Node |
|-----------------|------------------------------|
| `trigger_context` | Suggests content for `shadow` |
| `protective_role` | Pre-fills `protective_purpose` |
| `pattern_description` | Shown in center summary |

**Behavior:** Auto-populated content appears as suggested text, user can edit or confirm.

---

### Step 11: Update Inner Work Lab Card

**File:** `src/components/becoming/InnerWorkLabCard.tsx` (MODIFY)

Add visual indicator for transmutation progress:
- Show "In Transmutation" status for patterns with partial transmutation data
- Show "" or "Transmuted" badge for completed patterns

---

### Step 12: Create Index Export

**File:** `src/components/transmutation-map/index.ts` (NEW)

```typescript
export { TransmutationMapCanvas } from "./TransmutationMapCanvas";
export { TransmutationNode } from "./TransmutationNode";
export { TransmutationNodeEditModal } from "./TransmutationNodeEditModal";
export { TransmutationCelebration } from "./TransmutationCelebration";
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| Database migration | CREATE | Add `transmutation_data` column |
| `src/components/transmutation-map/TransmutationNode.tsx` | CREATE | Phase-aware visual node |
| `src/components/transmutation-map/TransmutationMapCanvas.tsx` | CREATE | SVG canvas with 3-phase layout |
| `src/components/transmutation-map/TransmutationNodeEditModal.tsx` | CREATE | Node editing with prompts |
| `src/components/transmutation-map/TransmutationCelebration.tsx` | CREATE | Gold-themed completion overlay |
| `src/components/transmutation-map/index.ts` | CREATE | Exports |
| `src/pages/PatternMap.tsx` | MODIFY | Enable transmutation tab, add content |
| `src/hooks/useInnerPatterns.tsx` | MODIFY | Add transmutation data functions |
| `src/components/becoming/InnerWorkLabCard.tsx` | MODIFY | Show transmutation status |

---

## Visual Representation (Transmutation Map Layout)

```text
          ┌─────────────────────────────────────────────────────────┐
          │                   PATTERN SUMMARY                        │
          │               "I'm not enough"                           │
          │          (Connected from Pattern Map)                    │
          └─────────────────────────┬───────────────────────────────┘
                                    │
    ╔═══════════════════════════════╧═══════════════════════════════╗
    ║                                                                 ║
    ║   BLACK PHASE          WHITE PHASE           GOLD PHASE        ║
    ║   ───────────          ───────────           ──────────        ║
    ║                                                                 ║
    ║   ┌─────────┐         ┌─────────────┐       ┌───────────┐      ║
    ║   │ Shadow  │────────▶│Shift Moment │──────▶│Gold Insight│     ║
    ║   └─────────┘         └─────────────┘       └───────────┘      ║
    ║        │                    │                     │            ║
    ║   ┌─────────┐         ┌─────────────┐       ┌───────────┐      ║
    ║   │Dark Night│        │ Protective  │       │Letter to  │      ║
    ║   │(optional)│        │  Purpose    │       │  Self     │      ║
    ║   └─────────┘         └─────────────┘       └───────────┘      ║
    ║                             │                     │            ║
    ║                       ┌─────────────┐       ┌───────────┐      ║
    ║                       │   Lesson    │       │Brave Step │      ║
    ║                       │  Learned    │       │(optional) │      ║
    ║                       └─────────────┘       └───────────┘      ║
    ║                                                                 ║
    ╚════════════════════════════════════════════════════════════════╝
                                    │
                  ┌─────────────────┴──────────────────┐
                  │   Talk to the Transmutation Team   │
                  └────────────────────────────────────┘
```

---

## Success Criteria

1. Transmutation tab is enabled and clickable in Pattern Map page
2. Transmutation Map displays 3-phase node structure (Black/White/Gold)
3. Each node opens modal with correct prompt and placeholder examples
4. "Talk to Transmutation Team" button appears in all modals (placeholder for now)
5. Completing Gold phase triggers celebration overlay
6. Pattern status updates to "transformed" when complete
7. Visual styling changes from dark → light → gold as phases complete
8. Auto-population works from Pattern Map data
9. Inner Work Lab Card shows transmutation progress
10. Data persists correctly in database

---

## What This Does NOT Include (Future PDRs)

- **Transmutation Team Council** (Day 5) - only button/placeholder now
- **Lifetime Map integration** (Day 3) - mentioned in PDR but separate
- **New mentors** (Phoenix, Stoic, Story Breaker) - Day 4
- **Daily journal pattern detection** - separate feature

---

## Safety Notes (From PDR)

The Transmutation Map maintains the same gentle, compassionate tone:
- No interrogation or forced exploration
- "Share as little as you want" messaging
- Pattern framed as protection, not problem
- User always in control of what they share
- Progress feels earned, not pressured

