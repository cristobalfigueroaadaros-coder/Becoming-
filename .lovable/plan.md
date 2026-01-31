

# Becoming Path: Inner Self Console + Pattern Discovery System

## Overview

This plan implements a complete pattern discovery system for the Becoming Path that mirrors the "project creation" first-win flow in the Creating Path. The key difference: instead of discovering a project, users discover a **life event or inner pattern**, making their internal experience visible and transformable.

---

## Current State Analysis

The codebase already has:

| Existing Component | Status |
|-------------------|--------|
| `InnerSelfCouncil.tsx` | Has pattern detection, but needs PDR-specific entry flow |
| `inner-self-council` edge function | Has pattern detection logic |
| `useInnerPatterns.tsx` hook | Supports pattern CRUD |
| `PatternDiscoveryCard.tsx` | Shows pattern confirmation modal |
| `PatternCelebration.tsx` | Shows celebration on pattern creation |
| `BecomingPath.tsx` | 4-tab navigation (Becoming, Pattern Map, Transmutation, Lifetime) |
| `useLifetimeEvents.tsx` | Supports lifetime event CRUD |

**Gap Analysis:**
1. No WhatsApp-style notification to trigger Inner Self Console after project creation
2. Inner Self Council opening message not PDR-compliant (Life Event First principle)
3. No mandatory redirect to Inner Clarity Mentor after Council
4. No auto-population of Pattern Map, Transmutation Map, and Lifetime Map after pattern creation
5. No age/time-period question after pattern confirmation

---

## Implementation Plan

### Step 1: Create "Inner Self Console Ready" Notification

When a user creates their first project in the Creating Path, trigger a notification that invites them to the Inner Self Console.

**File:** `src/hooks/useInnerSelfNotification.tsx` (NEW)

```typescript
// Hook to detect first project creation and create notification
export function useInnerSelfNotification() {
  // When first project is created:
  // 1. Insert into mentor_whispers with type 'inner_self_console_unlock'
  // 2. Message: "Now that we know what you're building, let's look at what's happening inside you."
}
```

**Trigger Location:** `src/pages/Chat.tsx` - After `completeFirstWin()` is called

**Notification Display:** Modify `FutureSelfDashboardCard.tsx` or create dedicated `InnerSelfConsoleNotification.tsx` component that shows the invite message.

---

### Step 2: Update Inner Self Council Introduction Message

**File:** `src/pages/InnerSelfCouncil.tsx`

Modify the introduction card (lines 289-323) to use PDR-compliant copy:

**Current:**
> "Now that we know what you are building... let's work on what is happening inside you."

**New (from PDR):**
> "Now that we know what you're building, let's look at what's happening inside you.
> 
> This is a safe space. You can share as much or as little as you want.
> 
> Let's start with something real. Not dramatic. Just meaningful.
> 
> **Tell us about a life event that challenged you or changed you.**"

**Update placeholder examples** to match PDR:
- "I moved to another country and felt lost"
- "I broke my leg and had to stop everything"
- "I ended a long relationship"
- "I failed a business"
- "I lost someone important"
- "I left my comfort zone for the first time"

---

### Step 3: Update Inner Self Council Edge Function for PDR Flow

**File:** `supabase/functions/inner-self-council/index.ts`

**Key changes:**

1. **Update system prompt** to prioritize Life Event discovery:
   - First ask about the life event itself (what happened)
   - Then explore emotional impact
   - Then look for mental loops or protective behaviors
   - Only then suggest pattern naming

2. **Add 1:1 Mentor Redirect Logic:**
   After 2-3 gentle clarifying questions, suggest redirect to Inner Clarity Mentor:
   ```
   "This feels like something we can understand more clearly together.
   Would you like to explore this one-on-one?"
   ```

3. **Pattern Detection Enhancement:**
   - Detect when 2-3 of these are present: life event context, emotional impact, mental loop, protective behavior, consequence
   - If no clear pattern emerges after 4-5 exchanges, use the life event itself as the pattern name (fallback rule)

4. **Return structured data for mentor handoff:**
   ```json
   {
     "suggestMentorRedirect": true,
     "redirectMentor": "inner_clarity_mentor",
     "redirectContext": "life_event_exploration"
   }
   ```

---

### Step 4: Create Mentor Redirect Card Component

**File:** `src/components/MentorRedirectCard.tsx` (NEW)

A styled card that appears when the Council suggests 1:1 exploration:

```typescript
interface MentorRedirectCardProps {
  mentorType: string; // Always "inner_clarity_mentor" for this flow
  context: string;
  onContinue: () => void;
  onNotNow: () => void;
}
```

**UI:**
- Message: "This feels like something we can understand more clearly together. Would you like to explore this one-on-one?"
- Buttons: [✅ Continue] [Not now]

---

### Step 5: Update Inner Clarity Mentor Prompt for PDR Flow

**File:** `supabase/functions/chat-mentor/index.ts`

Add a special mode when Inner Clarity Mentor receives a handoff from Inner Self Council:

**Opening message (when handoff context is `life_event_exploration`):**
> "I've read what you shared with the Council. You trusted us with something meaningful.
>
> Let's understand this together."

**Pattern Naming Rules:**
1. Continue conversation until 2-3 of these are clearly present:
   - Life event context
   - Emotional impact
   - Mental loop or repeated thought
   - Protective behavior
   - Consequence in life or relationships

2. When ready, propose pattern name:
   > "Based on what you shared, this feels like it could be called:
   >
   > '[Pattern or Life Event Name]'
   >
   > Does this feel right?"

3. **Fallback rule:** If no clear inner pattern emerges after several interactions, use the life event itself as the pattern name.

**Add to mentorPrompts for `inner_clarity_mentor`:**
```typescript
=== PATTERN NAMING MODE (when redirected from Inner Self Council) ===
When you receive context about a life event exploration:
1. Acknowledge what was shared with the Council
2. Ask focused questions one at a time
3. Look for: life event context, emotional impact, mental loop, protective behavior, consequences
4. When 2-3 are present, propose a pattern name
5. FALLBACK: If no clear pattern after 4-5 exchanges, use the life event as the name
6. Include [PATTERN_READY] marker when proposing a name
===
```

---

### Step 6: Add Age/Time Period Question After Pattern Confirmation

**File:** `src/pages/InnerSelfCouncil.tsx` and `src/pages/Chat.tsx`

After pattern is confirmed, show a light question to seed the Lifetime Map:

```typescript
// New component
<PatternTimeQuestion
  patternName={patternName}
  onSelect={(timePeriod) => createLifetimeEvent(patternName, timePeriod)}
  onSkip={() => createLifetimeEvent(patternName, 'current')} // Default fallback
/>
```

**Question UI:**
> "When did this pattern first show up in your life?"
> - Childhood
> - Teen years
> - Early adulthood (20s)
> - Adulthood (30s+)
> - Current life

This is optional - user can skip, and system defaults to a broad category.

---

### Step 7: Enhance Pattern Creation to Auto-Populate Maps

**File:** `src/hooks/useInnerPatterns.tsx`

Modify `createPattern` function to also:

1. **Auto-populate Pattern Map nodes** from conversation data:
   ```typescript
   life_events: {
     trigger_event: extractedTrigger,
     old_story: extractedStory,
     mental_loop: extractedLoop,
     cost: extractedCost,
     protective_role: extractedProtection,
     life_event: patternName, // The life event that started it
   }
   ```

2. **Auto-populate Transmutation Map** Black Phase:
   ```typescript
   transmutation_data: {
     shadow: patternDescription || patternName,
     // White and Gold phases remain empty
   }
   ```

**File:** `src/hooks/useLifetimeEvents.tsx`

After pattern creation, automatically create a Lifetime Event:

```typescript
export const createEventFromPattern = async (
  patternId: string,
  patternName: string,
  timePeriod: TimePeriod = 'current'
) => {
  return createEvent({
    time_period: timePeriod,
    event_label: patternName,
    pattern_id: patternId,
    pattern_name: patternName,
  });
};
```

---

### Step 8: Update Pattern Celebration to Show Unlock Message

**File:** `src/components/pattern-map/PatternCelebration.tsx`

Enhance to communicate that maps are now unlocked:

**Current:** "Your Pattern Map is now created."

**New:**
> "This is powerful.
>
> Awareness is the first shift.
>
> Your Pattern Map is now created.
> Your Transmutation Map is unlocked.
> Your Lifetime Map has its first entry.
>
> [Open Pattern Map]"

---

### Step 9: Ensure Inner Clarity Mentor is Mandatory/Locked

**File:** `src/pages/OnboardingStep4.tsx`

Verify that `inner_clarity_mentor` is in `MANDATORY_MENTORS` array (already done - line 12).

**File:** `src/pages/Council.tsx`

Ensure Inner Clarity Mentor cannot be deselected:
```typescript
const LOCKED_MENTORS = ["strategist_mentor", "creative_visionary", "inner_clarity_mentor"];
```

---

### Step 10: Create Pattern Extraction Interface

**File:** `src/types/pattern.ts` (NEW)

```typescript
export interface ExtractedPatternData {
  patternName: string;
  patternType: PatternType;
  lifeEvent: string;
  triggerContext?: string;
  emotionalImpact?: string;
  mentalLoop?: string;
  protectiveBehavior?: string;
  consequence?: string;
  primaryEmotion?: string;
  relatedEmotions?: string[];
  bodySensation?: string;
  timePeriod?: TimePeriod;
}

export type PatternType = 
  | 'limiting_belief'
  | 'protection_mechanism'
  | 'relational_pattern'
  | 'self_sabotage'
  | 'emotional_block'
  | 'core_wound'
  | 'life_event'; // New type for when no clear pattern emerges
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useInnerSelfNotification.tsx` | CREATE | Trigger notification after first project creation |
| `src/components/InnerSelfConsoleNotification.tsx` | CREATE | WhatsApp-style notification component |
| `src/pages/InnerSelfCouncil.tsx` | MODIFY | Update intro copy, add time period question |
| `supabase/functions/inner-self-council/index.ts` | MODIFY | Add Life Event First logic, mentor redirect suggestion |
| `src/components/MentorRedirectCard.tsx` | CREATE | "Continue 1:1?" card |
| `supabase/functions/chat-mentor/index.ts` | MODIFY | Add pattern naming mode for Inner Clarity Mentor |
| `src/hooks/useInnerPatterns.tsx` | MODIFY | Auto-populate maps on pattern creation |
| `src/hooks/useLifetimeEvents.tsx` | MODIFY | Add `createEventFromPattern` function |
| `src/components/pattern-map/PatternCelebration.tsx` | MODIFY | Show all unlocks message |
| `src/pages/OnboardingStep4.tsx` | VERIFY | Ensure inner_clarity_mentor is mandatory |
| `src/pages/Council.tsx` | MODIFY | Add inner_clarity_mentor to locked mentors |
| `src/components/PatternTimeQuestion.tsx` | CREATE | Age/time period question component |
| `src/types/pattern.ts` | CREATE | Pattern extraction interface |

---

## User Flow Diagram

```
User creates first project in Creating Path
              ↓
    [Notification appears in Becoming Path]
    "Now that we know what you're building..."
              ↓
    User opens Inner Self Console
              ↓
    [Life Event First Introduction]
    "Tell us about a life event that challenged you"
              ↓
    Inner Self Council asks 1-3 clarifying questions
    (gentle, not interrogation)
              ↓
    Council suggests 1:1 exploration
    "Would you like to explore this one-on-one?"
              ↓
    [Redirect to Inner Clarity Mentor]
    Mentor acknowledges Council conversation
              ↓
    Mentor continues until 2-3 elements present:
    - Life event context
    - Emotional impact
    - Mental loop
    - Protective behavior
    - Consequence
              ↓
    Mentor proposes pattern name
    (or life event name as fallback)
              ↓
    [Pattern Confirmation Card]
    "Does this feel right?"
    [✅ Yes, create it] [Rename] [Not now]
              ↓
    User confirms → [First Win Celebration]
              ↓
    [Time Period Question]
    "When did this first show up?"
    - Childhood / Teen / 20s / 30s+ / Current
              ↓
    System auto-creates:
    ├── Pattern Map (center + 2-3 nodes populated)
    ├── Transmutation Map (Black phase populated)
    └── Lifetime Map (first entry created)
              ↓
    [Celebration Complete]
    User can explore any of the 3 maps
```

---

## Success Criteria

1. Notification appears after first project creation
2. Inner Self Council uses "Life Event First" introduction
3. Council asks 1-3 gentle clarifying questions (no interrogation)
4. Council suggests 1:1 redirect to Inner Clarity Mentor
5. Inner Clarity Mentor acknowledges Council conversation
6. Mentor continues until pattern elements are present
7. Pattern name is proposed (or life event as fallback)
8. Confirmation creates Pattern Map, Transmutation Map, and Lifetime Map entries
9. Celebration communicates all three maps are unlocked
10. Time period question seeds Lifetime Map correctly
11. Inner Clarity Mentor is mandatory and cannot be deselected

---

## PDR Philosophy Implementation

The system ensures users feel:
- **Safe** - No pressure, "as much or as little as you want"
- **Human** - Gentle questions, not interrogation
- **Non-invasive** - No trauma mining, clarity not therapy
- **Guided but not forced** - "Not now" is always an option

The core message: **Nothing you lived was meaningless. Your struggles contain learning, strength, and value.**

