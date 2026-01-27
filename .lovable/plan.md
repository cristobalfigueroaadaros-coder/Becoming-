

# Inner Work Lab: Pattern Map (Day 2) Implementation Plan

## Overview

This plan implements the **Pattern Map** - a visual representation of inner patterns discovered through the Inner Self Council. It mirrors the existing project creation flow (Detection → Commitment Card → Celebration → Navigation) but for personal patterns instead of projects.

---

## Architecture Summary

| Project System | Pattern Map (Inner Work Lab) |
|----------------|------------------------------|
| `FirstWinNamingCard` | `PatternDiscoveryCard` (NEW) |
| `FirstWinCelebration` | `PatternCelebration` (NEW) |
| `projectCoherence` detection | `detectedPattern` detection (exists) |
| Navigate to `/creation-lab` | Navigate to Pattern Map page |
| `chat-mentor` edge function | `inner-self-council` edge function (modify) |
| Creative Visionary/Strategist (mandatory) | Inner Clarity Mentor (make mandatory) |

---

## Implementation Steps

### Step 1: Add Inner Clarity Mentor to Mandatory Mentors

**File:** `src/pages/OnboardingStep4.tsx`

Add `inner_clarity_mentor` to the `MANDATORY_MENTORS` array:
```typescript
const MANDATORY_MENTORS = ["creative_visionary", "strategist_mentor", "inner_clarity_mentor"];
```

Update the mandatory notice to mention all three:
```typescript
<strong>Creative Visionary</strong>, <strong>Strategist Mentor</strong>, and <strong>Inner Clarity Mentor</strong> are required for your journey.
```

---

### Step 2: Improve Inner Self Council Introduction

**File:** `src/pages/InnerSelfCouncil.tsx`

Update the introduction card when no active thread exists to include the PDR-specified intro prompt:

Current intro is generic. Update to:
```typescript
// Introduction text (from PDR)
<p className="text-sm text-muted-foreground mb-4">
  Now that we know what you are building...
  let's work on what is happening inside you.
</p>
<p className="text-sm text-muted-foreground mb-4">
  This is a safe space. You can share as much or as little as you want.
</p>
<p className="text-sm text-muted-foreground font-medium">
  Tell us one thing that feels heavy right now,
  or one pattern you keep repeating.
</p>
```

Update placeholder examples to:
```typescript
placeholder={`Examples:
• "I feel like I'm not enough"
• "I'm scared of being rejected"
• "I freeze when it matters"
• "My father left home when I was young"
• "I always sabotage when it's going well"`}
```

---

### Step 3: Add Pattern Confirmation Flow to Inner Self Council

**File:** `src/pages/InnerSelfCouncil.tsx`

Add state for pattern detection and confirmation:
```typescript
const [detectedPattern, setDetectedPattern] = useState<any>(null);
const [showPatternCard, setShowPatternCard] = useState(false);
const [showPatternCelebration, setShowPatternCelebration] = useState(false);
```

In the `handleAsk` function, after receiving the response, check for `detectedPattern`:
```typescript
if (data.detectedPattern) {
  setDetectedPattern(data.detectedPattern);
  setShowPatternCard(true);
}
```

Add a "Talk to Inner Self Mentor" suggestion card when council has enough clarity (Q3+):
```typescript
{questionNumber >= 3 && !detectedPattern && (
  <Card className="border-indigo-500/30">
    <CardContent className="pt-4">
      <p className="text-sm mb-3">
        This feels like a pattern we can map clearly.
        Do you want to explore it with your Inner Self mentor and turn it into a Pattern Map?
      </p>
      <div className="flex gap-2">
        <Button 
          onClick={() => navigate('/council?view=inner_clarity_mentor')}
          className="bg-indigo-600"
        >
          Talk to Inner Self Mentor
        </Button>
        <Button variant="outline">Not now</Button>
      </div>
    </CardContent>
  </Card>
)}
```

---

### Step 4: Create PatternDiscoveryCard Component

**File:** `src/components/pattern-map/PatternDiscoveryCard.tsx` (NEW)

This component mirrors `FirstWinNamingCard` but for patterns. Props:
```typescript
interface PatternDiscoveryCardProps {
  proposedName: string;
  patternType: string;
  triggerContext: string;
  primaryEmotion: string;
  onAccept: (name: string) => void;
  onKeepExploring: () => void;
}
```

Key features:
- Shows the proposed pattern name with edit capability
- Displays detected emotional signature (trigger, emotion, body sensation)
- "Yes, that's it" button triggers confetti and saves pattern
- "Edit the name" inline input
- "Not now" dismisses

Visual styling:
- Purple/indigo gradient theme (matching Inner Self Council)
- Gentle, compassionate copy
- Icon: Orbit or similar introspective symbol

---

### Step 5: Create PatternCelebration Component

**File:** `src/components/pattern-map/PatternCelebration.tsx` (NEW)

Similar to `FirstWinCelebration` but for patterns:
```typescript
interface PatternCelebrationProps {
  patternName: string;
  onContinue: () => void;
}
```

Celebration copy:
```
Title: Pattern Discovered ✅
Text: "This is powerful. Awareness is the first shift. Your Pattern Map is now created."
Button: "Open Pattern Map"
```

---

### Step 6: Create Pattern Map Page

**File:** `src/pages/PatternMap.tsx` (NEW)

This is the visual map UI. Structure:

**Header:**
- Pattern name as title
- Status badge (Exploring / Transformed)
- Back button to Inner Work Lab

**Visual Map (SVG-based, similar to ConstellationCanvas):**
- **Center node** (larger, darker): Pattern Name
- **Surrounding nodes** (lighter, connected with curved lines):
  - Trigger Event node
  - Life Event node (optional)
  - Old Story node
  - Mental Loop node
  - Cost node
  - Protective Role node (always compassionate)

Each node:
- Editable on click (opens modal)
- Shows placeholder if empty: "Tap to explore"
- Uses indigo/purple color scheme

**Bottom Actions:**
- "Keep talking with Inner Self Mentor" - navigates to 1:1 chat
- "Start Transmutation Journey" (locked/coming soon badge)
- "Back to Inner Work Lab"

**Node data sources:**
- Auto-populated from `detectedPattern` data
- User can edit/add via modal

---

### Step 7: Create Pattern Map Node Components

**File:** `src/components/pattern-map/PatternMapNode.tsx` (NEW)

Visual node component:
```typescript
interface PatternMapNodeProps {
  id: string;
  label: string;
  content: string | null;
  x: number;
  y: number;
  size: number;
  color: string;
  isCenter?: boolean;
  onClick: () => void;
}
```

Center node styling: larger, darker color, stronger glow
Peripheral nodes: smaller, lighter variants of the theme color

Connection lines: curved SVG paths (reuse `NeuralConnection` pattern)

---

### Step 8: Create Pattern Map Canvas

**File:** `src/components/pattern-map/PatternMapCanvas.tsx` (NEW)

SVG-based canvas that renders:
1. Center node (pattern name)
2. Surrounding nodes in a circular layout
3. Connection lines from center to each node

Layout positions (clockwise from top):
- Trigger Event (top)
- Old Story (top-right)
- Mental Loop (right)
- Cost (bottom-right)
- Protective Role (bottom)
- Life Event (bottom-left, optional)

---

### Step 9: Create Node Edit Modal

**File:** `src/components/pattern-map/PatternNodeEditModal.tsx` (NEW)

Dialog for editing node content:
```typescript
interface PatternNodeEditModalProps {
  open: boolean;
  onClose: () => void;
  nodeType: string;
  nodeLabel: string;
  currentContent: string | null;
  guidingQuestion: string;
  onSave: (content: string) => void;
}
```

Guiding questions per node type:
- Trigger Event: "What situations activate this pattern?"
- Old Story: "What belief keeps looping?"
- Mental Loop: "What repeating thought or behavior?"
- Cost: "What does this pattern cost you?"
- Protective Role: "What is this pattern trying to protect you from?"
- Life Event: "Is there an earlier moment connected to this?"

---

### Step 10: Update Inner Patterns Hook

**File:** `src/hooks/useInnerPatterns.tsx`

Add new fields for node data. The `life_events` JSONB field can store all node data:
```typescript
interface PatternNodeData {
  trigger_event?: string;
  old_story?: string;
  mental_loop?: string;
  cost?: string;
  protective_role?: string;
  life_event?: string;
  life_event_age_category?: 'childhood' | 'teenage' | 'early_adulthood' | 'recent' | 'not_sure';
}
```

Add `updatePatternNodes` function:
```typescript
const updatePatternNodes = async (id: string, nodes: PatternNodeData) => {
  const { error } = await supabase
    .from("inner_patterns")
    .update({ life_events: nodes })
    .eq("id", id);
  // ... handle result
};
```

---

### Step 11: Update Inner Self Council Edge Function

**File:** `supabase/functions/inner-self-council/index.ts`

Enhance the detection logic:

1. Add reframing/summary before pattern proposal (as per PDR):
```
The AI should:
- Summarize what the user said
- Reframe it in clear words
- Suggest the pattern name
- Wait for confirmation
```

2. Add a new output field `patternProposal` for when ready to name:
```typescript
"patternProposal": {
  "summary": "What I'm hearing is...",
  "reframe": "The story becomes...",
  "proposedName": "Fear of Being Seen",
  "readyToConfirm": true
}
```

3. Trigger pattern proposal when:
- Q3+ conversation depth
- User has shared emotional content
- A clear pattern has emerged

4. Add pattern confirmation detection (similar to project agreement):
```typescript
const patternConfirmationPatterns = [
  /that['']?s\s+(exactly|it|right)/i,
  /yes,?\s+that['']?s\s+(the|my)\s+pattern/i,
  /I\s+(see|recognize)\s+that\s+now/i,
];
```

---

### Step 12: Add Pattern Map Route

**File:** `src/App.tsx`

Add new route:
```typescript
import PatternMap from "@/pages/PatternMap";

<Route path="/pattern-map/:patternId" element={<PatternMap />} />
```

---

### Step 13: Update Inner Work Lab Card

**File:** `src/components/becoming/InnerWorkLabCard.tsx`

When patterns exist, clicking a pattern should navigate to its Pattern Map:
```typescript
onClick={() => navigate(`/pattern-map/${pattern.id}`)}
```

---

### Step 14: Add Life Age Question

**File:** `src/pages/InnerSelfCouncil.tsx` or in the Pattern Map

After pattern is confirmed, ask one light time placement question:

```typescript
{patternJustCreated && (
  <Card>
    <CardContent className="pt-4 space-y-3">
      <p className="text-sm">When do you remember this starting, roughly?</p>
      <div className="flex flex-wrap gap-2">
        {['Childhood', 'Teenage years', 'Early adulthood', 'Recent months', 'Not sure'].map(age => (
          <Button 
            key={age} 
            variant="outline" 
            size="sm"
            onClick={() => saveAgeCategory(age)}
          >
            {age}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/OnboardingStep4.tsx` | MODIFY | Add inner_clarity_mentor to mandatory mentors |
| `src/pages/InnerSelfCouncil.tsx` | MODIFY | Add pattern detection display, improved intro, mentor redirect prompt |
| `src/components/pattern-map/PatternDiscoveryCard.tsx` | CREATE | Pattern confirmation card (like FirstWinNamingCard) |
| `src/components/pattern-map/PatternCelebration.tsx` | CREATE | Pattern celebration overlay |
| `src/components/pattern-map/PatternMapCanvas.tsx` | CREATE | SVG visual map with nodes and connections |
| `src/components/pattern-map/PatternMapNode.tsx` | CREATE | Individual node component |
| `src/components/pattern-map/PatternNodeEditModal.tsx` | CREATE | Edit modal for node content |
| `src/pages/PatternMap.tsx` | CREATE | Pattern Map page with visual and actions |
| `src/hooks/useInnerPatterns.tsx` | MODIFY | Add node data management |
| `src/components/becoming/InnerWorkLabCard.tsx` | MODIFY | Navigate to Pattern Map on pattern click |
| `supabase/functions/inner-self-council/index.ts` | MODIFY | Add pattern proposal logic |
| `src/App.tsx` | MODIFY | Add Pattern Map route |

---

## Visual Layout (Pattern Map)

```text
                    ┌─────────────┐
                    │   Trigger   │
                    │    Event    │
                    └──────┬──────┘
                           │
         ┌─────────────┐   │   ┌─────────────┐
         │    Life     │───┼───│  Old Story  │
         │   Event     │   │   │             │
         └─────────────┘   │   └─────────────┘
                           │
                   ┌───────┴───────┐
                   │               │
                   │   PATTERN     │  ← Center node (larger, darker)
                   │    NAME       │
                   │               │
                   └───────┬───────┘
                           │
         ┌─────────────┐   │   ┌─────────────┐
         │ Protective  │───┼───│   Mental    │
         │    Role     │   │   │    Loop     │
         └─────────────┘   │   └─────────────┘
                           │
                    ┌──────┴──────┐
                    │    Cost     │
                    │             │
                    └─────────────┘
```

---

## Pattern Map Tabs (Inner Work Lab Structure)

Once Pattern Map is created, the Inner Work Lab shows three tabs:
1. **Pattern Map** (active - this PDR)
2. **Transmutation Map** (coming soon badge)
3. **Lifetime Map** (coming soon badge)

This mirrors the Creative Lab structure (Focus / Creative Space / Design Thinking Lab).

---

## Success Criteria

1. Inner Clarity Mentor is mandatory for all new users
2. Inner Self Council shows improved intro with examples
3. Pattern detection triggers PatternDiscoveryCard overlay
4. User can confirm or edit pattern name
5. Pattern celebration shows on confirmation
6. Navigation to Pattern Map page works
7. Pattern Map displays visual node layout
8. Nodes are editable via modal
9. "Keep talking" button routes back to mentor
10. Age placement question appears after pattern creation
11. Pattern data persists correctly in database

---

## What This Does NOT Include (Future PDRs)

- Transmutation Map (Day 4-5)
- Lifetime Map (Day 3)
- New transformation mentors: Phoenix, Stoic, Story Breaker (Day 4)
- Transmutation Council (Day 5)
- Gold shift celebration flow
- Daily journal pattern detection integration

