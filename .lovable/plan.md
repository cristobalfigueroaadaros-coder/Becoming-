

# Fix Transmutation Council Mentor Issues & Storybreaker Handoff Flow

## Problems Identified

### Problem 1: Wrong Mentors Appearing
The **Creative Visionary** and **Strategist Mentor** are appearing in the Transmutation Council instead of the correct mentors. This happens because:
- Line 42 in `council-meeting/index.ts`: `MANDATORY_MENTORS = ['creative_visionary', 'strategist_mentor']`
- Lines 664-680: These mandatory mentors are always added to all council responses

### Problem 2: Handoff to Storybreaker Not Working
The mentor routing (lines 1364-1435) suggests generic mentors (`strategist_mentor`, `creative_visionary`, `alignment_mentor`) instead of Storybreaker. The routing logic doesn't consider the council type.

### Problem 3: Storybreaker Doesn't Continue Conversation
When handoff works, the Storybreaker doesn't have transmutation-specific logic to:
1. Acknowledge the life event shared in the council
2. Ask targeted questions to extract pattern data (Emotion, Fear, Trigger, Life Moment)
3. Trigger the `PatternDiscoveryCard` when requirements are met

---

## Implementation Plan

### 1. Fix Mandatory Mentors by Council Type

**File**: `supabase/functions/council-meeting/index.ts`

**Change**: Make mandatory mentors dynamic based on `councilType`

```typescript
// Replace line 42 static definition with dynamic logic
// OLD: const MANDATORY_MENTORS = ['creative_visionary', 'strategist_mentor'];

// NEW: Dynamic selection inside the handler (after extracting councilType from request body)
const councilType = body.councilType || 'default';
const MANDATORY_MENTORS = councilType === 'transmutation' 
  ? ['problem_mentor', 'perspective_mentor'] 
  : ['creative_visionary', 'strategist_mentor'];
```

This ensures:
- **Transmutation Council**: Problem Mentor + Perspective Mentor (as requested)
- **Other Councils**: Creative Visionary + Strategist (default behavior preserved)

---

### 2. Fix Mentor Handoff Routing for Transmutation

**File**: `supabase/functions/council-meeting/index.ts`

**Change**: Update mentor routing prompt (lines 1364-1400) to prioritize Storybreaker for transmutation

```typescript
// Add councilType-aware routing rules
const mentorRoutingPrompt = `Analyze this conversation...

COUNCIL TYPE: ${councilType}

${councilType === 'transmutation' ? `
TRANSMUTATION COUNCIL RULES:
- ALWAYS suggest storybreaker_mentor as the 1-to-1 follow-up
- Reason: "The Storybreaker can help you extract the deeper pattern from this life event"
- The Storybreaker is the ONLY mentor who can unlock the Pattern Map
` : `
STANDARD ROUTING RULES:
- If CLARITY (they know what they want) → strategist_mentor or creative_visionary
- If NEEDS GUIDANCE (still finding direction) → alignment_mentor
...
`}

YOU MUST RESPOND WITH VALID JSON:
{
  "hasClarity": true/false,
  "suggestedMentor": "${councilType === 'transmutation' ? 'storybreaker_mentor' : 'mentor_type'}",
  ...
}
`;
```

---

### 3. Update TransmutationCouncil.tsx to Map Response Correctly

**File**: `src/pages/TransmutationCouncil.tsx`

**Change**: The current code expects `suggestedMentor` but the edge function returns `suggestedMentorFor1to1`. Fix the mapping:

```typescript
// In handleAsk, after receiving data:
// Map the correct field from the response
setSuggestedMentor(
  data.suggestedMentor || 
  (data.suggestedMentorFor1to1 ? {
    targetMentor: data.suggestedMentorFor1to1.mentorType,
    reason: data.suggestedMentorFor1to1.suggestionMessage
  } : null)
);
```

---

### 4. Add Transmutation Context to Handoff

**File**: `src/pages/TransmutationCouncil.tsx`

**Change**: Ensure the handoff includes transmutation context so Storybreaker knows to continue pattern discovery

```typescript
// In handleMentorHandoff function, add transmutation context:
const handoffPayload = {
  user_id: user.id,
  source_mentor_type: 'transmutation_council',
  target_mentor_type: targetMentor,
  source_messages: sourceMessages,
  handoff_chain_id: chainId,
  chain_position: 1,
  journey_topic: suggestedMentor?.reason || "Continuing transmutation journey",
  // ADD: Transmutation-specific context for Storybreaker
  voice_context: {
    flow: 'transmutation_pattern_discovery',
    councilContext: councilInsight,
    userInput: conversationHistory.filter(h => h.role === 'user').map(h => h.content).join('\n'),
    phase: 'pattern_extraction'
  },
  processed: false,
  initiated_by: 'transmutation_council'
};
```

---

### 5. Add Storybreaker Transmutation Handoff Handler

**File**: `supabase/functions/chat-mentor/index.ts`

**Change**: Add special handling when Storybreaker receives a handoff from Transmutation Council

```typescript
// In the __HANDOFF_INIT__ handler section, add transmutation-aware logic:

if (mentorType === 'storybreaker_mentor' && handoffRecord?.voice_context?.flow === 'transmutation_pattern_discovery') {
  const transmutationContext = handoffRecord.voice_context;
  
  systemPrompt = `You are the Storybreaker Mentor receiving a handoff from the Transmutation Council.

CONTEXT FROM COUNCIL:
${transmutationContext.councilContext || 'No council insight'}

USER'S SHARED LIFE EVENT:
${transmutationContext.userInput || 'Not provided'}

YOUR MISSION:
1. Acknowledge what they shared in the council with warmth
2. Ask 2-3 targeted questions to extract the MISSING pattern data:
   - Primary Emotion: "What emotion comes up most strongly when you think about this?"
   - Fear/Old Story: "What story did you tell yourself because of this?"
   - Trigger: "What situations today still activate this feeling?"
   - Life Moment: "Can you pinpoint a specific moment when this pattern started?"

REQUIREMENTS FOR PATTERN DISCOVERY:
- Minimum: Life Event, Trigger, Primary Emotion, and either Fear or Old Story
- When you have enough, output [PATTERN_READY] JSON block

TONE: Warm, precise, story-cleansing. You separate facts from interpretation.

Generate your opening message that:
1. Shows you were listening to the council conversation
2. Asks ONE specific question to go deeper
`;
}
```

---

### 6. Ensure Pattern Detection Triggers Correctly

**File**: `supabase/functions/chat-mentor/index.ts`

**Change**: Add pattern detection logic that triggers `PatternDiscoveryCard` when Storybreaker extracts enough data

This is already partially implemented but needs the `[PATTERN_READY]` JSON output to be parsed and returned as `patternDetection` in the response.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/council-meeting/index.ts` | Dynamic mandatory mentors, transmutation-specific routing |
| `src/pages/TransmutationCouncil.tsx` | Fix suggestedMentor mapping, add transmutation context to handoff |
| `supabase/functions/chat-mentor/index.ts` | Add Storybreaker transmutation handoff handler |

---

## Expected Result

1. **Transmutation Council shows correct mentors**: Storybreaker, Phoenix, Stoic + Problem Mentor and Perspective Mentor (replacing Creative Visionary and Strategist)

2. **Handoff card appears after Q2/Q3**: "Go deeper with Storybreaker" with reason explaining pattern discovery

3. **Clicking handoff navigates to Council chat with Storybreaker**: The mentor acknowledges the life event and asks targeted questions

4. **Storybreaker conversation unlocks Pattern Map**: After 2-3 questions, the `PatternDiscoveryCard` appears with the extracted pattern data

