
# Fix Storybreaker Pattern Detection: JSON Hidden + User Confirmation Triggers Card

## Problems Identified

### Problem 1: JSON Block Visible to User
The Storybreaker mentor outputs a JSON block with pattern data, but WITHOUT the `[PATTERN_READY]` marker at the end:

**What the AI outputs:**
```
...gives us a lot to work with.

\`\`\`json
{ "patternName": "Finding Purpose...", ... }
\`\`\`
Does this pattern resonate with what you experienced?
```

**What it SHOULD output:**
```
...gives us a lot to work with.

Based on what you've shared, I'd call this: "Finding Purpose Amidst Loss Threat"

\`\`\`json
{ "patternName": "Finding Purpose...", ... }
\`\`\`
[PATTERN_READY]
```

The parsing logic at line 3091 only triggers when `[PATTERN_READY]` is present. Without it, the JSON is never stripped from the response and shows to the user.

### Problem 2: User Confirmation Creates Infinite Loop
When the user says "yes it does" to confirm the pattern name, nothing happens because:
1. The original response never set `patternDetection` (marker was missing)
2. There's no logic to detect user confirmation of a previously proposed pattern
3. The mentor keeps asking questions about "recent situations" instead of completing

### Problem 3: Pattern Card Never Triggers
Since `patternDetection` is never populated in the response, the frontend never shows the `PatternDiscoveryCard`, even when the user verbally confirms.

---

## Root Cause Analysis

The Storybreaker prompt instructions (lines 2147-2158) tell the mentor to output `[PATTERN_READY]` followed by JSON, but the AI interprets this as optional and instead asks "Does this resonate?" BEFORE completing the pattern.

The flow should be:
1. Storybreaker proposes pattern name with JSON + marker
2. Backend parses JSON and strips it from visible response  
3. Frontend receives `patternDetection` and shows `PatternDiscoveryCard`
4. User confirms in the card (not in chat)

But currently:
1. Storybreaker asks "Does this resonate?" with visible JSON
2. User types "yes it does" in chat
3. Mentor interprets this as new input and continues conversation
4. Loop continues forever

---

## Implementation Plan

### 1. Make `[PATTERN_READY]` Mandatory After Pattern JSON

**File**: `supabase/functions/chat-mentor/index.ts`

**Location**: Transmutation Focus block (lines 2139-2158)

**Change**: Update the Storybreaker prompt to make it crystal clear that:
- When outputting JSON, ALWAYS end with `[PATTERN_READY]`
- Do NOT ask "Does this resonate?" in text - the card handles confirmation
- The JSON block MUST be the last thing in the response

```typescript
STORYBREAKER MISSION:
1. Keep asking questions ONLY about this specific life event
2. Extract the pattern components:
   - Primary Emotion: What emotion rises most strongly?
   - Fear/Old Story: What did they tell themselves because of this?
   - Trigger: What situations today still activate this feeling?
   - Life Moment: When did this pattern start?
3. When you have at least: Life Event + Trigger + Emotion + (Fear OR Old Story):
   a) Write a brief acknowledgment of what you understood
   b) Propose the pattern name naturally: "Based on what you've shared, I'd call this: '[Name]'"
   c) Output the JSON block with all extracted data
   d) End with [PATTERN_READY] marker (MANDATORY - this triggers the confirmation card)
   
CRITICAL FORMAT RULES:
- The JSON block + [PATTERN_READY] MUST be the LAST thing in your response
- Do NOT ask "Does this resonate?" or any follow-up question after the JSON
- Do NOT continue the conversation after [PATTERN_READY] - the UI card handles confirmation
- The user will confirm via a visual card, not by typing in chat

PATTERN_READY FORMAT (use when you have enough data):
[Your acknowledgment and pattern name proposal here]

\`\`\`json
{
  "patternName": "The pattern name based on their story",
  "patternType": "life_event",
  ...all other fields...
}
\`\`\`
[PATTERN_READY]
```

### 2. Add Fallback JSON Detection (Without Marker)

**File**: `supabase/functions/chat-mentor/index.ts`

**Location**: Pattern detection block (lines 3084-3121)

**Change**: Add fallback logic to detect and parse JSON blocks even without `[PATTERN_READY]` marker for transmutation sessions:

```typescript
// === PATTERN DETECTION ===
let patternDetection = null;
const patternDetectionMentors = ['inner_clarity_mentor', 'storybreaker_mentor'];

// Primary detection: [PATTERN_READY] marker
if (response.includes('[PATTERN_READY]') && patternDetectionMentors.includes(mentorType)) {
  // ... existing logic ...
}
// FALLBACK: Detect JSON block even without marker (for transmutation sessions)
else if (isTransmutationSession && mentorType === 'storybreaker_mentor' && !patternDetection) {
  const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      // Validate this is a pattern JSON (has patternName field)
      if (parsed.patternName) {
        patternDetection = parsed;
        console.log("[chat-mentor] Fallback pattern detection (no marker):", patternDetection.patternName);
        
        // Clean the response - remove the JSON block
        response = response.replace(/```json[\s\S]*?```/g, '').trim();
      }
    } catch (e) {
      console.error("[chat-mentor] Fallback pattern parse failed:", e);
    }
  }
}
```

### 3. Add User Confirmation Detection

**File**: `supabase/functions/chat-mentor/index.ts`

**Location**: Before AI response generation (around line 2900)

**Change**: Check if the user is confirming a previously proposed pattern:

```typescript
// === USER PATTERN CONFIRMATION DETECTION ===
// If user says "yes" after Storybreaker proposed a pattern, return the pattern
let userConfirmedPattern = null;
if (isTransmutationSession && mentorType === 'storybreaker_mentor') {
  const confirmationPhrases = ['yes', 'yes it does', 'that\'s right', 'that\'s it', 
                               'exactly', 'correct', 'makes sense', 'resonates'];
  const userMsgLower = message.toLowerCase().trim();
  
  if (confirmationPhrases.some(phrase => userMsgLower.includes(phrase))) {
    // Check if previous assistant message had a JSON pattern
    const previousMessages = chatHistory?.filter((m: any) => m.role === 'assistant') || [];
    const lastAssistantMsg = previousMessages[previousMessages.length - 1];
    
    if (lastAssistantMsg?.content) {
      const jsonMatch = lastAssistantMsg.content.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          if (parsed.patternName) {
            userConfirmedPattern = parsed;
            console.log("[chat-mentor] User confirmed pattern:", parsed.patternName);
          }
        } catch (e) { /* ignore */ }
      }
    }
  }
}

// If user confirmed a pattern, return it immediately without calling AI
if (userConfirmedPattern) {
  return new Response(
    JSON.stringify({
      response: "I see this pattern clearly now. Let's anchor it and begin your transmutation journey.",
      patternDetection: userConfirmedPattern,
      extractedKeywords: [],
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/chat-mentor/index.ts` | 1. Update Storybreaker prompt to make `[PATTERN_READY]` mandatory after JSON |
| `supabase/functions/chat-mentor/index.ts` | 2. Add fallback JSON detection for transmutation sessions without marker |
| `supabase/functions/chat-mentor/index.ts` | 3. Add user confirmation detection to trigger pattern card on "yes" |

---

## Expected Flow After Fix

1. **User shares life event** in Transmutation Council
2. **Storybreaker asks 2-3 questions** to extract emotion, fear, trigger
3. **Storybreaker outputs JSON + `[PATTERN_READY]`** when requirements met
4. **Backend parses JSON**, strips it from visible response, returns `patternDetection`
5. **Frontend shows `PatternDiscoveryCard`** with proposed name and "Yes, that's it" button
6. **User clicks "Yes, that's it"** in the card (not typing in chat)
7. **Pattern is created**, phases unlock, celebration shows

**Backup flow** (if AI forgets marker):
- If JSON block exists but no marker, fallback detection catches it
- If user types "yes" in chat to confirm, confirmation detection catches it and returns the pattern
