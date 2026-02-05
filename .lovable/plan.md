

# Fix: Pattern Detection Flow from Inner Clarity Mentor

## Problems Identified

### Problem 1: Raw JSON Visible to User
The Inner Clarity Mentor includes a `[PATTERN_READY]` marker and JSON block in the response text. Since Chat.tsx doesn't parse this, the raw JSON is displayed to the user - this should never happen.

### Problem 2: Pattern Card Not Triggered
Chat.tsx has no logic to:
1. Detect the `[PATTERN_READY]` marker in the response
2. Extract the pattern JSON data
3. Show the `PatternDiscoveryCard` component
4. Handle pattern acceptance

### Problem 3: Pattern Map Not Auto-Populated
When patterns are created via `handlePatternAccept` in InnerSelfCouncil.tsx, the `life_events` field (which contains Pattern Map node data) is not being passed to `createPattern()`. The database shows all patterns have empty `life_events` arrays.

### Problem 4: Life Event Support
The new onboarding focuses on "life events" rather than patterns. The system needs to:
1. Accept "life_event" as a valid pattern type
2. Handle cases where no psychological pattern emerges (use life event name instead)
3. Ensure the same White Phase flow works for both patterns and life events

---

## Solution Overview

### Part 1: Edge Function - Clean Response and Return Structured Data

**File:** `supabase/functions/chat-mentor/index.ts`

**Changes:**
1. When `[PATTERN_READY]` is detected in the AI response, extract the JSON and return it as a separate `patternDetection` field
2. Clean the response text to remove the JSON block before sending to the user
3. Never show raw JSON to users

```typescript
// In the response processing section
let patternDetection = null;

// Check for [PATTERN_READY] marker
if (response.includes('[PATTERN_READY]') && mentorType === 'inner_clarity_mentor') {
  // Extract JSON block from response
  const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      patternDetection = JSON.parse(jsonMatch[1].trim());
      console.log("Pattern detected:", patternDetection);
      
      // Clean the response - remove the JSON block
      response = response
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/\[PATTERN_READY\]/g, '')
        .trim();
    } catch (e) {
      console.error("Failed to parse pattern JSON:", e);
    }
  }
}

// Return patternDetection in the response
return new Response(
  JSON.stringify({ 
    response, 
    valueMapDetection,
    suggestedHandoff,
    patternDetection, // NEW: For pattern card
    ...
  })
);
```

### Part 2: Chat.tsx - Handle Pattern Detection

**File:** `src/pages/Chat.tsx`

**Changes:**
1. Add state for pattern detection: `patternDetection`, `showPatternCard`
2. Import `PatternDiscoveryCard` and `PatternCelebration`
3. In `handleSend`, check for `data.patternDetection` and trigger the pattern card
4. Add `handlePatternAccept` function that:
   - Creates the pattern with full `life_events` data mapping
   - Shows celebration
   - Navigates to Pattern Map

```typescript
// New state
const [patternDetection, setPatternDetection] = useState<any>(null);
const [showPatternCard, setShowPatternCard] = useState(false);
const [showPatternCelebration, setShowPatternCelebration] = useState(false);
const [createdPatternId, setCreatedPatternId] = useState<string | null>(null);

// In handleSend, after getting response:
if (data.patternDetection) {
  setPatternDetection(data.patternDetection);
  setShowPatternCard(true);
}

// Pattern acceptance handler
const handlePatternAccept = async (patternName: string) => {
  if (!patternDetection) return;
  
  // Map the extracted data to life_events format for Pattern Map nodes
  const lifeEventsData = {
    trigger_event: patternDetection.triggerEvent || '',
    old_story: patternDetection.oldStory || '',
    mental_loop: patternDetection.mentalLoop || '',
    cost: patternDetection.cost || '',
    protective_role: patternDetection.protectiveRole || '',
    life_event: patternDetection.lifeEvent || '',
    life_event_age_category: patternDetection.lifeEventAgeCategory || '',
  };
  
  // Map to transmutation_data for Black Phase
  const transmutationData = {
    shadow: patternDetection.oldStory || patternDetection.triggerEvent || '',
  };
  
  const pattern = await createPattern({
    pattern_name: patternName,
    pattern_type: patternDetection.patternType || 'life_event',
    pattern_description: patternDetection.lifeEvent || '',
    trigger_context: patternDetection.triggerEvent || '',
    primary_emotion: patternDetection.primaryEmotion || '',
    related_emotions: patternDetection.relatedEmotions || [],
    body_sensation: patternDetection.bodySensation || '',
    life_events: lifeEventsData,  // NEW: Auto-populate Pattern Map
    transmutation_data: transmutationData, // NEW: Auto-populate Black Phase
  });
  
  if (pattern) {
    setCreatedPatternId(pattern.id);
    setShowPatternCard(false);
    setShowPatternCelebration(true);
  }
};
```

### Part 3: Update PatternDiscoveryCard Label for Life Events

**File:** `src/components/pattern-map/PatternDiscoveryCard.tsx`

**Changes:**
1. Add "life_event" to `patternTypeLabels`
2. Conditionally show "Life Event" vs "Pattern" text based on type

```typescript
const patternTypeLabels: Record<string, string> = {
  limiting_belief: "Limiting Belief",
  protection_mechanism: "Protection Pattern",
  relational_pattern: "Relational Pattern",
  self_sabotage: "Self-Sabotage",
  emotional_block: "Emotional Block",
  core_wound: "Core Wound",
  life_event: "Life Event", // NEW
};

// In the header, show different copy for life events
<h3 className="text-xl font-semibold text-foreground">
  {patternType === 'life_event' 
    ? 'A meaningful moment is taking shape.'
    : 'A pattern is becoming clear.'}
</h3>
```

### Part 4: Fix InnerSelfCouncil Pattern Acceptance

**File:** `src/pages/InnerSelfCouncil.tsx`

The existing `handlePatternAccept` function doesn't pass `life_events` or `transmutation_data`. If patterns are also detected through the council (rare), it should be updated:

```typescript
const handlePatternAccept = async (patternName: string) => {
  if (!detectedPattern) return;
  
  // Map the extracted data to life_events format
  const lifeEventsData = {
    trigger_event: detectedPattern.triggerEvent || '',
    old_story: detectedPattern.oldStory || '',
    mental_loop: detectedPattern.mentalLoop || '',
    cost: detectedPattern.cost || '',
    protective_role: detectedPattern.protectiveRole || '',
    life_event: detectedPattern.lifeEvent || '',
    life_event_age_category: detectedPattern.lifeEventAgeCategory || '',
  };
  
  const transmutationData = {
    shadow: detectedPattern.oldStory || detectedPattern.triggerEvent || '',
  };
  
  const pattern = await createPattern({
    pattern_name: patternName,
    pattern_description: detectedPattern.lifeEvent || detectedPattern.triggerContext || undefined,
    pattern_type: detectedPattern.patternType || 'life_event',
    trigger_context: detectedPattern.triggerEvent || detectedPattern.triggerContext || undefined,
    primary_emotion: detectedPattern.primaryEmotion || undefined,
    related_emotions: detectedPattern.relatedEmotions || undefined,
    body_sensation: detectedPattern.bodySensation || undefined,
    life_events: lifeEventsData, // NEW
    transmutation_data: transmutationData, // NEW
  });
  ...
};
```

---

## File Summary

| File | Changes |
|------|---------|
| `supabase/functions/chat-mentor/index.ts` | Extract pattern JSON, clean response, return `patternDetection` field |
| `src/pages/Chat.tsx` | Add pattern detection state, show PatternDiscoveryCard, handle pattern acceptance with full data mapping |
| `src/components/pattern-map/PatternDiscoveryCard.tsx` | Add "life_event" type label, show appropriate copy |
| `src/pages/InnerSelfCouncil.tsx` | Fix handlePatternAccept to pass life_events and transmutation_data |

---

## Data Flow After Fix

```text
User shares life event in Inner Self Council
         │
         ▼
Council redirects to Inner Clarity Mentor (with handoff)
         │
         ▼
Inner Clarity Mentor asks focused questions (2-3 elements)
         │
         ▼
Mentor proposes name: "This feels like: 'Moving Abroad Alone'"
         │
         ▼
chat-mentor returns:
  - response: "This feels like: 'Moving Abroad Alone'..." (CLEAN - no JSON)
  - patternDetection: { patternName, patternType, lifeEvent, ... }
         │
         ▼
Chat.tsx detects patternDetection → shows PatternDiscoveryCard
         │
         ▼
User accepts → createPattern() called with:
  - pattern_name
  - life_events: { trigger_event, old_story, mental_loop, cost, protective_role, life_event }
  - transmutation_data: { shadow }
         │
         ▼
Pattern saved to database with auto-populated maps
         │
         ▼
PatternCelebration shown → Navigate to Pattern Map (fully populated)
         │
         ▼
Black Phase unlocked (shadow pre-filled) → Ready for White Phase (Phoenix)
```

---

## Technical Notes

### Pattern vs Life Event Handling
- Both use the same `inner_patterns` table
- `patternType: 'life_event'` indicates a life event rather than a psychological pattern
- The Pattern Map and Transmutation Map work identically for both
- The UI copy changes slightly ("meaningful moment" vs "pattern")

### Safety: No Raw JSON to Users
The edge function MUST clean the response before returning. The JSON block is:
1. Extracted and parsed
2. Returned as structured `patternDetection` field
3. Removed from the visible `response` text

