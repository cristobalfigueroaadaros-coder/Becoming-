

# Fix Plan: Restore Transmutation Map Structure + Full Handoff Context

## Problem Summary

The current implementation broke the original flow:
1. Clicking a White/Gold node opens a **separate chat modal** (`TransmutationPhaseModal`) instead of the original node edit modal
2. The mentor in this modal receives `"BEGIN_TRANSMUTATION_PHASE"` with no real context
3. No handoff system is used — the mentor doesn't know the user's history, pattern details, or progress

## What User Wants

```
Original Flow (RESTORE):
┌────────────────────────────────────────┐
│  [White Phase Badge]                   │
│  Node Title: "The Shift"               │
│  Question: "What made you change..."   │
│                                        │
│  • Example placeholder 1               │
│  • Example placeholder 2               │
│  • Example placeholder 3               │
│                                        │
│  ┌────────────────────────────────┐    │
│  │ Textarea for user input        │    │
│  └────────────────────────────────┘    │
│                                        │
│  [Cancel]  [Save]                      │
│  [Talk to Phoenix Mentor]              │
│         ↓                              │
│  Creates HANDOFF with full context     │
│  → Navigate to Council chat            │
│  → Phoenix knows pattern + history     │
└────────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: Restore Original Node Click Behavior

**File:** `src/components/creation-lab/BecomingTransmutation.tsx`

**Changes:**
1. **Remove** `TransmutationPhaseModal` usage
2. **Add** `TransmutationNodeEditModal` state management back
3. Restore original `handleNodeClick` to open the edit modal (not the phase modal)
4. Update bottom CTAs to navigate with handoff context

```typescript
// REMOVE these states:
// const [showPhaseModal, setShowPhaseModal] = useState(false);
// const [activePhase, setActivePhase] = useState<'white' | 'gold'>('white');

// ADD these states back:
const [showNodeEditModal, setShowNodeEditModal] = useState(false);
const [editingNode, setEditingNode] = useState<{id: string; label: string; phase: string} | null>(null);

// RESTORE handleNodeClick:
const handleNodeClick = (nodeId: string, phase: 'black' | 'white' | 'gold') => {
  if (phase === 'gold' && !whiteComplete) {
    toast.info("Complete the White phase first");
    return;
  }
  
  // Open the node edit modal with the specific node
  const label = getNodeLabel(nodeId);
  setEditingNode({ id: nodeId, label, phase });
  setShowNodeEditModal(true);
};
```

### Step 2: Update TransmutationNodeEditModal for Handoff Navigation

**File:** `src/components/transmutation-map/TransmutationNodeEditModal.tsx`

**Add new props:**
- `patternId: string`
- `patternName: string`
- `patternContext: string` (shadow)
- `transmutationData: TransmutationData`

**Update `handleTalkToMentor`:**
Instead of `window.location.href`, use a proper handoff-based navigation:

```typescript
interface TransmutationNodeEditModalProps {
  // ... existing props
  patternId: string;
  patternName: string;
  patternContext: string;
  transmutationData: TransmutationData;
  onNavigateToMentor: (mentorType: string) => void;
}

// In the component:
const handleTalkToMentor = () => {
  const mentorType = phase === 'white' ? 'phoenix_mentor' : phase === 'gold' ? 'stoic_mentor' : 'inner_clarity_mentor';
  onClose();
  onNavigateToMentor(mentorType);
};
```

### Step 3: Create Transmutation Handoff Function

**File:** `src/components/creation-lab/BecomingTransmutation.tsx`

Create a function that:
1. Fetches last 20 messages from all mentors (for full context)
2. Creates a `conversation_handoffs` record with transmutation context
3. Navigates to Council with handoff ID

```typescript
const navigateToMentorWithHandoff = async (mentorType: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedPattern) return;

    // Fetch recent conversation history across all mentors
    const { data: recentMessages } = await supabase
      .from("chats")
      .select("role, content, mentor_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Create handoff with transmutation context
    const transmutationContext = {
      phase: !whiteComplete ? 'white' : 'gold',
      patternId: selectedPattern.id,
      patternName: selectedPattern.pattern_name,
      patternDescription: selectedPattern.pattern_description,
      shadow: transmutationData.shadow,
      existingTransmutationData: transmutationData,
      lifeEvents: selectedPattern.life_events, // Pattern Map data
    };

    const { data: handoff, error } = await supabase
      .from("conversation_handoffs")
      .insert({
        user_id: user.id,
        source_mentor_type: "transmutation_map",
        target_mentor_type: mentorType,
        source_messages: recentMessages?.reverse() || [],
        journey_topic: `Transmutation ${!whiteComplete ? 'White' : 'Gold'} Phase for pattern: ${selectedPattern.pattern_name}`,
        voice_context: transmutationContext, // Using voice_context for transmutation context
        processed: false,
      })
      .select()
      .single();

    if (handoff && !error) {
      navigate(`/council?view=${mentorType}`, {
        state: {
          handoffId: handoff.id,
          transmutationContext, // Also pass directly for immediate access
        }
      });
    } else {
      console.error("Handoff creation error:", error);
      toast.error("Failed to start conversation");
    }
  } catch (error) {
    console.error("Error creating transmutation handoff:", error);
    toast.error("Something went wrong");
  }
};
```

### Step 4: Update Chat.tsx to Handle Transmutation Handoff

**File:** `src/pages/Chat.tsx`

**Update interface:**
```typescript
interface ChatProps {
  // ... existing
  locationState?: { 
    handoffId?: string; 
    voiceHandoffId?: string; 
    voiceContext?: string;
    problemClarificationMode?: boolean;
    projectId?: string;
    projectName?: string;
    transmutationContext?: TransmutationContext; // NEW
  } | null;
}

interface TransmutationContext {
  phase: 'white' | 'gold';
  patternId: string;
  patternName: string;
  patternDescription?: string;
  shadow: string;
  existingTransmutationData: TransmutationData;
  lifeEvents?: any;
}
```

The existing `processHandoff` function already handles handoffs. When a handoff is detected, `chat-mentor` is called with `__HANDOFF_INIT__` which retrieves the handoff record.

### Step 5: Update chat-mentor to Handle Transmutation Handoff

**File:** `supabase/functions/chat-mentor/index.ts`

When processing `__HANDOFF_INIT__`, check for `voice_context` (which contains transmutation context):

```typescript
// In __HANDOFF_INIT__ handling:
if (handoffRecord?.voice_context && handoffRecord.voice_context.phase) {
  // This is a transmutation handoff
  const transmutationCtx = handoffRecord.voice_context;
  const phase = transmutationCtx.phase;
  const patternName = transmutationCtx.patternName;
  const shadow = transmutationCtx.shadow;
  
  if (phase === 'white') {
    // Phoenix mentor opening
    return {
      response: `You've named what hurt — "${patternName}".

That takes courage.

The shadow you're holding: "${shadow}"

Now let's find what this experience gave you.

Looking back now, what shifted? Was there a moment, a conversation, a realization that changed how you saw this?`
    };
  } else if (phase === 'gold') {
    // Stoic mentor opening
    const shiftMoment = transmutationCtx.existingTransmutationData?.shift_moment || 'the shift you found';
    const lesson = transmutationCtx.existingTransmutationData?.lesson_learned || 'the lesson you learned';
    
    return {
      response: `The shift happened: ${shiftMoment}

The lesson is clear: ${lesson}

Now let's turn "${patternName}" into something you carry forward.

What did you actually gain from going through this? What's different about you now?`
    };
  }
}
```

### Step 6: Update Bottom CTA Buttons

**File:** `src/components/creation-lab/BecomingTransmutation.tsx`

Change the bottom buttons to use the handoff navigation:

```typescript
{/* Mentor-Specific CTAs */}
<div className="space-y-3">
  {!whiteComplete && selectedPattern && (
    <Button
      onClick={() => navigateToMentorWithHandoff('phoenix_mentor')}
      className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600"
      size="lg"
    >
      <Flame className="w-4 h-4 mr-2" />
      Talk to Phoenix Mentor
    </Button>
  )}

  {whiteComplete && !goldComplete && selectedPattern && (
    <Button
      onClick={() => navigateToMentorWithHandoff('stoic_mentor')}
      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
      size="lg"
    >
      <Shield className="w-4 h-4 mr-2" />
      Talk to Stoic Mentor
    </Button>
  )}
</div>
```

### Step 7: Keep the Node Edit Modal for Manual Entry

The `TransmutationNodeEditModal` remains for users who want to type directly. The modal now has two paths:
1. **Manual entry**: User types in textarea → clicks Save → data saved
2. **Mentor guidance**: User clicks "Talk to Phoenix/Stoic Mentor" → navigates to Council with full handoff

---

## Handoff Data Structure

The handoff record contains:

| Field | Content |
|-------|---------|
| `source_mentor_type` | `"transmutation_map"` |
| `target_mentor_type` | `"phoenix_mentor"` or `"stoic_mentor"` |
| `source_messages` | Last 20 messages across all mentors |
| `journey_topic` | `"Transmutation White Phase for pattern: [name]"` |
| `voice_context` | Full transmutation context (phase, pattern, shadow, existing data, life events) |

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `BecomingTransmutation.tsx` | MODIFY | Restore node edit modal, remove phase modal, add handoff navigation |
| `TransmutationNodeEditModal.tsx` | MODIFY | Add pattern props, onNavigateToMentor callback |
| `Chat.tsx` | VERIFY | Already handles handoffs correctly |
| `chat-mentor/index.ts` | MODIFY | Add transmutation-aware opening for Phoenix/Stoic |

---

## User Flow After Fix

```
User clicks "The Shift" node in White Phase
              ↓
TransmutationNodeEditModal opens:
- Question: "What made you change your perspective?"
- Placeholder examples
- Textarea for input
- [Cancel] [Save]
- [Talk to Phoenix Mentor] button
              ↓
User clicks "Talk to Phoenix Mentor"
              ↓
System creates conversation_handoffs record with:
- Last 20 messages from all mentors
- Full transmutation context (pattern, shadow, life_events, phase)
              ↓
Navigate to /council?view=phoenix_mentor
with state: { handoffId: "xxx-xxx" }
              ↓
Chat.tsx detects handoffId
              ↓
Calls chat-mentor with __HANDOFF_INIT__
              ↓
chat-mentor fetches handoff record
Sees voice_context.phase === 'white'
              ↓
Phoenix Mentor sends personalized opening:
"You've named what hurt — 'Fear of Abandonment'.
That takes courage.
The shadow you're holding: 'Always expecting people to leave'
Now let's find what this experience gave you..."
              ↓
User continues conversation with Phoenix
(Phoenix knows full pattern context, life events, previous conversations)
```

---

## Success Criteria

1. Clicking a White/Gold node opens `TransmutationNodeEditModal` (question, placeholders, textarea)
2. "Talk to Phoenix Mentor" button creates a handoff with full transmutation context
3. Navigation goes to Council chat (not a separate modal)
4. Phoenix/Stoic mentor receives the handoff and knows:
   - The pattern name and description
   - The shadow/pain from Black phase
   - Life events data from Pattern Map
   - Existing transmutation progress
   - Last 20 messages from previous conversations
5. Mentor sends a personalized opening mentioning the specific pattern
6. Same flow works for both White (Phoenix) and Gold (Stoic) phases

