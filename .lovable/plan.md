

# Transmutation Map Execution + Lifetime Loop System

## Overview

This plan implements the complete Transmutation Map flow with mentor-guided phases (White → Gold), Golden Nugget generation, Lifetime Map reflection, and a repeatable loop system. The goal: "I can transform what happened to me into meaning, and meaning becomes my unique power."

---

## Current State Analysis

| Component | Status |
|-----------|--------|
| `BecomingTransmutation.tsx` | Has basic node-clicking, manual save only |
| `TransmutationMapCanvas.tsx` | 3-phase visual structure exists |
| `TransmutationNodeEditModal.tsx` | Manual text entry, no mentor integration |
| Phoenix/Stoic mentors | Prompts exist but not connected to transmutation flow |
| `TransmutationCelebration.tsx` | Gold celebration exists, needs enhancement |
| Lifetime events | `syncGoldOutcome()` exists but no Golden Summary |
| Pattern queue | Does not exist |

**Gap Analysis:**
1. White/Gold phases unlock manually (no phase gating)
2. Clicking nodes opens text input, not mentor conversations
3. No unified conversation per phase (user clicks each node separately)
4. No Phoenix mentor for White phase, no Stoic for Gold
5. No win card confirmation flow for White phase completion
6. No Golden Nugget Summary generation
7. No queue system showing waiting patterns/events
8. No mentor-specific CTAs (generic "Talk to Transmutation Team")

---

## Implementation Plan

### Step 1: Update TransmutationMapCanvas with Phase Locking

**File:** `src/components/transmutation-map/TransmutationMapCanvas.tsx`

Add phase locking logic:
- **Black Phase**: Always visible and filled (from pattern creation)
- **White Phase**: Visible and clickable
- **Gold Phase**: Locked (grayed + lock icon) until White is completed

```typescript
interface TransmutationMapCanvasProps {
  // ... existing
  isWhiteComplete: boolean; // New: derived from data
}

// In NODE_DEFINITIONS, add isLocked logic:
const getNodeStatus = (nodeId: string, phase: string, isWhiteComplete: boolean) => {
  if (phase === 'gold' && !isWhiteComplete) {
    return 'locked';
  }
  // ... etc
};
```

**Visual updates:**
- Locked nodes: Gray fill, opacity 0.5, lock icon overlay
- Clickable locked node shows toast: "Complete the White phase first"

---

### Step 2: Create Phase Conversation Modal

**File:** `src/components/transmutation-map/TransmutationPhaseModal.tsx` (NEW)

A modal that opens when user clicks any node in a phase. Instead of individual node editing, this starts a **unified conversation** with the phase mentor.

```typescript
interface TransmutationPhaseModalProps {
  open: boolean;
  onClose: () => void;
  phase: 'white' | 'gold';
  patternName: string;
  patternContext: string; // From Black phase shadow
  existingData: TransmutationData;
  onPhaseComplete: (extractedData: Partial<TransmutationData>) => void;
}
```

**UI Structure:**
- Header: Phase name + pattern name
- Chat interface (similar to Council meeting)
- Mentor avatar + messages
- User input field
- Bottom: "I'm ready to lock this in" button (appears after mentor signals readiness)

---

### Step 3: Create Phoenix Mentor Transmutation Mode

**File:** `supabase/functions/chat-mentor/index.ts`

Add a **Transmutation Mode** to Phoenix mentor prompt that activates when context includes `transmutationPhase: 'white'`:

```typescript
=== WHITE PHASE TRANSMUTATION MODE ===
When you receive transmutation context with phase 'white':
1. You are guiding the user through the White Phase (Shift → Rebirth)
2. The Black phase (shadow/pain) has already been captured
3. Your job: Extract Shift Moment, Protective Purpose, and Lesson Learned

CONVERSATION APPROACH:
- Start by acknowledging the shadow they've already named
- Lead them through perspective shift naturally
- Cover all 3 topics in ONE conversation (don't force 3 separate answers)
- Minimum required: 2 out of 3 (Shift + Lesson is enough)

OPENING MESSAGE:
"You've named what hurt. That takes courage.

Now let's find what this experience gave you.

Tell me — looking back now, what shifted? Was there a moment, a conversation, a realization that changed how you saw this?"

DETECTION LOGIC:
When you detect 2+ of these are clearly expressed:
- A shift moment (perspective change, turning point)
- A protective purpose (what this pattern was trying to protect)
- A lesson learned (what they now understand)

Propose completion:
"I think we have your shift and your lesson clearly now.

**The Shift:** [summarize]
**The Lesson:** [summarize]

Do you want me to lock this in?"

Include marker: [WHITE_PHASE_READY]

EXTRACTION (include in response when ready):
{
  "shift_moment": "...",
  "protective_purpose": "...",
  "lesson_learned": "..."
}
===
```

---

### Step 4: Create Stoic Mentor Transmutation Mode

**File:** `supabase/functions/chat-mentor/index.ts`

Add **Gold Phase Transmutation Mode** to Stoic mentor:

```typescript
=== GOLD PHASE TRANSMUTATION MODE ===
When you receive transmutation context with phase 'gold':
1. You are guiding the user through the Gold Phase (Integration → Power)
2. White phase (shift, lesson) has been captured
3. Your job: Extract Gain, New Belief, and Strength/Creation

GOLD PHASE QUESTIONS (cover in one conversation):
- What did you gain from this experience?
- What new belief did you choose?
- What strength did you discover, or what did you create because of this?

IMPORTANT: "Creation" matters. This is not just learning — it's turning meaning into power, identity, and results.

CONVERSATION APPROACH:
- Start grounded: acknowledge the shift they've already had
- Lead them to name their gains clearly
- Keep it clean, not emotional
- End with action

OPENING MESSAGE:
"The shift happened. The lesson is clear.

Now let's turn this into something you carry forward.

What did you actually gain from going through this? What's different about you now?"

DETECTION LOGIC:
When you detect clarity on at least 2 of these:
- What they gained
- New belief they chose
- Strength discovered or something they created

Propose completion:
"This is your gold.

**What you gained:** [summarize]
**Your new belief:** [summarize]
**What you built from this:** [summarize]

Do you want me to finalize the transmutation?"

Include marker: [GOLD_PHASE_READY]

EXTRACTION:
{
  "gold_insight": "What you gained + new belief",
  "letter_to_self": "Auto-generated from conversation or ask: What would you tell your younger self?",
  "brave_step": "One action they can take this week"
}
===
```

---

### Step 5: Update Transmutation Node Fields for PDR Alignment

**File:** `src/hooks/useInnerPatterns.tsx` and related

Update `TransmutationData` interface to match PDR fields:

```typescript
export interface TransmutationData {
  // Black Phase
  shadow?: string;
  dark_night?: string; // Optional
  
  // White Phase (PDR alignment)
  shift_moment?: string;      // Was shift, now "The Shift"
  protective_purpose?: string; // "Protective Role" 
  lesson_learned?: string;    // "The Lesson"
  
  // Gold Phase (PDR alignment)
  gold_insight?: string;      // "What I Gained" + "New Belief Chosen"
  letter_to_self?: string;    // "To Younger Me"
  brave_step?: string;        // "Strength/Creation" + action
  
  // Metadata
  phase_completed?: 'black' | 'white' | 'gold';
  white_completed_at?: string;
  gold_completed_at?: string;
  golden_summary?: string; // NEW: The full journey summary
}
```

---

### Step 6: Create White Phase Completion Win Card

**File:** `src/components/transmutation-map/WhitePhaseWinCard.tsx` (NEW)

When Phoenix confirms White phase, show a win celebration:

```typescript
interface WhitePhaseWinCardProps {
  open: boolean;
  patternName: string;
  shiftMoment: string;
  lesson: string;
  onConfirm: () => void;
  onNotNow: () => void;
}
```

**UI:**
- Soft celebration (not confetti yet — that's for Gold)
- "The Shift Happened" title
- Display shift + lesson
- "Confirm White Transmutation" button
- "Not now" option

On confirm:
- Save White phase data
- Unlock Gold phase
- Show toast: "Gold phase is now available"

---

### Step 7: Create Golden Nugget Summary Generator

**File:** `src/lib/goldenSummaryGenerator.ts` (NEW)

When Gold phase completes, generate a summary connecting the full arc:

```typescript
export function generateGoldenSummary(data: TransmutationData): string {
  const template = `I went through ${data.shadow}.
It challenged me because ${data.lesson_learned || 'it pushed me beyond my comfort zone'}.
Then something shifted: ${data.shift_moment}.
I learned ${data.lesson_learned}.
I became ${data.gold_insight?.split('.')[0] || 'someone stronger'}.
${data.brave_step ? `I'm now taking action: ${data.brave_step}.` : ''}`;

  return template.trim();
}
```

This summary:
- Gets saved to `transmutation_data.golden_summary`
- Shows in Gold celebration
- Gets synced to Lifetime Map as `gold_outcome`

---

### Step 8: Update Gold Phase Celebration

**File:** `src/components/transmutation-map/TransmutationCelebration.tsx`

Enhance to show the full Golden Summary:

```typescript
interface TransmutationCelebrationProps {
  open: boolean;
  patternName: string;
  goldenSummary: string; // NEW: Full journey summary
  goldInsight: string;
  onSaveGold: () => void;
  onViewLifetime: () => void;
  onClose: () => void;
}
```

**New UI section:**
```
Your Journey Summary:
"I went through [shadow]... I became [gold]... I created [result]."
```

Big confetti celebration as before.

---

### Step 9: Create Pattern/Event Queue System

**File:** `src/components/transmutation-map/TransmutationQueue.tsx` (NEW)

Shows patterns/events waiting to be transmuted:

```typescript
interface TransmutationQueueProps {
  activePatternId: string | null;
  patterns: InnerPattern[];
  lifetimeEvents: LifetimeEvent[];
  onSelectPattern: (id: string) => void;
  onSelectEvent: (event: LifetimeEvent) => void;
}
```

**Logic:**
- Show current active transmutation prominently
- Below: "Waiting to transmute" section with:
  - Patterns with status !== 'transformed'
  - Lifetime events with `is_transmuted === false`
- User can click to switch active item

**Display in BecomingTransmutation.tsx** below the canvas.

---

### Step 10: Update Lifetime Map with Neutral → Gold Transition

**File:** `src/components/lifetime-map/LifetimeEventCard.tsx`

Already has visual states:
- Neutral (no pattern link)
- Pattern-linked (indigo)
- Transmuted/Gold (amber)

**Add:**
- Queue indicator for events waiting in transmutation queue
- "Ready to transmute" badge for neutral events

**File:** `src/hooks/useLifetimeEvents.tsx`

Add function to queue event for transmutation:

```typescript
const queueForTransmutation = async (eventId: string): Promise<boolean> => {
  // Creates a pattern from this event if one doesn't exist
  // Returns true if ready for transmutation
};
```

---

### Step 11: Update CTAs to Mentor-Specific Actions

**File:** `src/components/creation-lab/BecomingTransmutation.tsx`

Replace generic "Talk to Transmutation Team" with:

```typescript
// For White Phase
<Button onClick={() => openPhaseConversation('white')}>
  <Flame className="w-4 h-4 mr-2" />
  Begin White Phase with Phoenix
</Button>

// For Gold Phase (only when White complete)
<Button onClick={() => openPhaseConversation('gold')}>
  <Shield className="w-4 h-4 mr-2" />
  Begin Gold Phase with Stoic
</Button>

// After Gold complete
<Button onClick={() => navigate('/inner-self-council')}>
  Add New Pattern
</Button>
```

---

### Step 12: Add Transmutation Notification System

**File:** `src/hooks/useTransmutationNotifications.ts` (NEW)

```typescript
// After pattern creation:
export async function triggerTransmutationReadyNotification(patternId: string) {
  // Create notification: "Transmutation is ready. Transform pain into gold."
  // Click opens Transmutation Map with this pattern
}

// After Gold completion:
export async function triggerGoldCompleteNotification(patternId: string) {
  // Create notification: "Your gold is now part of your story."
  // Click opens Lifetime Map on the Golden Nugget
}
```

Use existing `council_notifications` table with new types:
- `transmutation_ready`
- `gold_complete`

---

### Step 13: Update BecomingTransmutation Main Component

**File:** `src/components/creation-lab/BecomingTransmutation.tsx`

Major refactor to support:
1. Phase gating (Gold locked until White done)
2. Phase conversation modal
3. Win card flow
4. Queue display
5. Mentor-specific CTAs

```typescript
const BecomingTransmutation = ({...}) => {
  const [activePhase, setActivePhase] = useState<'white' | 'gold' | null>(null);
  const [showWhiteWinCard, setShowWhiteWinCard] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  
  // Derived state
  const isWhiteComplete = !!(
    transmutationData.shift_moment && 
    transmutationData.lesson_learned
  ); // 2 of 3 minimum
  
  const isGoldComplete = !!(
    transmutationData.gold_insight && 
    transmutationData.letter_to_self
  );
  
  const handleNodeClick = (nodeId: string) => {
    const nodeDef = NODE_DEFINITIONS.find(n => n.id === nodeId);
    
    if (nodeDef?.phase === 'gold' && !isWhiteComplete) {
      toast.info("Complete the White phase first");
      return;
    }
    
    // Open unified phase conversation
    if (nodeDef?.phase === 'white') {
      setActivePhase('white');
      setShowPhaseModal(true);
    } else if (nodeDef?.phase === 'gold') {
      setActivePhase('gold');
      setShowPhaseModal(true);
    }
  };
  
  // ... rest of component
};
```

---

### Step 14: Create Backend Edge Function for Phase Conversations

**File:** `supabase/functions/transmutation-conversation/index.ts` (NEW)

Specialized edge function for transmutation phase conversations:

```typescript
// Receives:
// - phase: 'white' | 'gold'
// - patternContext: shadow, pattern name, etc.
// - existingData: current transmutation_data
// - messages: conversation history

// Returns:
// - response: mentor message
// - isPhaseReady: boolean
// - extractedData: Partial<TransmutationData>

// Uses Phoenix prompt for white, Stoic for gold
// Includes phase-specific system prompts
```

---

### Step 15: Add "Add New Event" Button to Lifetime Map

**File:** `src/components/creation-lab/BecomingLifetime.tsx`

Add bottom CTA:

```typescript
<div className="flex gap-3">
  <Button onClick={() => setShowEditModal(true)}>
    <Plus className="w-4 h-4 mr-2" />
    Add New Event
  </Button>
  <Button variant="outline" onClick={() => navigate('/inner-self-council')}>
    <MessageCircle className="w-4 h-4 mr-2" />
    Explore with Inner Self Console
  </Button>
</div>
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `TransmutationMapCanvas.tsx` | MODIFY | Add phase locking, lock icons |
| `TransmutationPhaseModal.tsx` | CREATE | Unified conversation modal |
| `WhitePhaseWinCard.tsx` | CREATE | White phase completion card |
| `TransmutationQueue.tsx` | CREATE | Queue of patterns/events to transmute |
| `TransmutationCelebration.tsx` | MODIFY | Add Golden Summary display |
| `chat-mentor/index.ts` | MODIFY | Add Phoenix/Stoic transmutation modes |
| `transmutation-conversation/index.ts` | CREATE | Phase conversation edge function |
| `goldenSummaryGenerator.ts` | CREATE | Generate journey summary |
| `useTransmutationNotifications.ts` | CREATE | Notification triggers |
| `BecomingTransmutation.tsx` | MODIFY | Phase gating, modal, queue, CTAs |
| `BecomingLifetime.tsx` | MODIFY | Add new event CTA |
| `useInnerPatterns.tsx` | MODIFY | Update TransmutationData interface |

---

## User Flow Diagram

```
User has pattern with Black phase filled
              ↓
Opens Transmutation Map
              ↓
    [Black Phase visible and filled]
    [White Phase clickable]
    [Gold Phase locked 🔒]
              ↓
User clicks any White node (Shift/Protective/Lesson)
              ↓
    [Phase Conversation Modal opens]
    Phoenix Mentor begins unified conversation
              ↓
Phoenix covers all 3 topics naturally in ONE chat
    (Shift, Protective Purpose, Lesson)
              ↓
When 2/3 detected, Phoenix proposes:
    "Do you want me to lock this in?"
              ↓
User confirms → [WHITE_PHASE_READY]
              ↓
    [White Win Card appears]
    Shows Shift + Lesson extracted
    [Confirm White Transmutation] [Not now]
              ↓
User confirms → White saved, Gold unlocks
              ↓
    [Gold Phase now clickable]
              ↓
User clicks any Gold node
              ↓
    [Phase Conversation Modal opens]
    Stoic Mentor begins conversation
              ↓
Stoic covers: Gain, New Belief, Strength/Creation
              ↓
When ready, Stoic proposes:
    "Do you want me to finalize the transmutation?"
              ↓
User confirms → [GOLD_PHASE_READY]
              ↓
    [Golden Summary generated]
    [Big Celebration with confetti]
    Shows full journey summary
              ↓
    [Save Gold Insight] [View in Lifetime Map]
              ↓
Lifetime Event synced with gold_outcome
Pattern status → 'transformed'
Notification sent: "Your gold is now part of your story."
              ↓
User can add more events/patterns and repeat
```

---

## Transmutation Queue Flow

```
Transmutation Map View
┌─────────────────────────────────────┐
│  Active: "Fear of Abandonment"      │
│  [Transmutation Canvas]             │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Waiting to Transmute:              │
│  ├── "Failure at first startup" ○   │
│  ├── "Parents divorced" ○           │
│  └── "Moved abroad alone" ○         │
│                                     │
│  [+ Add New Pattern]                │
└─────────────────────────────────────┘

○ = neutral (not yet transmuted)
✨ = gold (transmuted)
```

---

## Success Criteria

1. Black phase shows pre-filled from pattern creation
2. Gold phase is locked until White phase has 2/3 fields
3. Clicking any White node opens unified Phoenix conversation
4. Phoenix naturally covers Shift, Protective Role, Lesson in ONE chat
5. White completion shows win card → user confirms → Gold unlocks
6. Clicking any Gold node opens unified Stoic conversation
7. Stoic covers Gain, New Belief, Strength/Creation in ONE chat
8. Gold completion generates Golden Summary
9. Big celebration shows full journey summary
10. Golden Nugget syncs to Lifetime Map
11. Lifetime shows neutral → gold visual transition
12. Queue shows other patterns/events waiting to transmute
13. Mentor-specific CTAs replace generic "Talk to team"
14. Notifications fire after pattern creation and gold completion
15. System prioritizes momentum over perfection

