

# Fix Stoic Gold Phase: Too Many Questions + Winning Card Not Triggering

## Problem 1: Stoic Asks Too Many Questions

The Stoic's Gold Phase mission prompt (line ~2354) lists 3 separate steps:
1. Identify the GAIN
2. Define the NEW BELIEF
3. Anchor the STRENGTH/CREATION

The Stoic treats these as 3 sequential questions, dragging the conversation. Users get fatigued before reaching the closing.

### Fix

Update the STOIC MISSION prompt to instruct the mentor to consolidate its questions. Instead of asking 3 separate questions across 3 turns, it should:
- Ask 1 opening question that invites the user to share their gain/transformation
- On the user's response, reflect back the gain, new belief, and strength in a single closing message
- Maximum 3-4 total exchanges before closing

**File**: `supabase/functions/chat-mentor/index.ts` (lines ~2353-2359)

Replace with:
```
STOIC MISSION (GOLD PHASE):
Your role: Help the user integrate this experience into lasting strength.

APPROACH (CRITICAL - BE CONCISE):
- Ask ONE opening question about what they gained/became from this experience
- From their response, extract ALL THREE elements:
  1. The GAIN - what they actually got from going through this
  2. The NEW BELIEF - the upgraded identity statement
  3. The BRAVE STEP - a concrete action they will take
- Reflect these back in a single powerful closing message
- Do NOT ask 3 separate questions across 3 turns
- Maximum 3-4 total exchanges before completing
- When you sense they have expressed their gain and new belief, close the phase
- Close with a clear signal: "This transmutation is complete" or "The gold is yours now"
```

---

## Problem 2: Winning Card Not Triggering

The user said "yes" after the Stoic said "Carry it with you" but the winning card didn't trigger because:

The `completionSignals` array (line ~2657) doesn't include phrases the Stoic naturally uses. The Stoic said:
- "This wisdom -- this gold born from your experience -- will be a guiding light. Carry it with you."

None of these match the current signals like "ready for the next step", "transmutation is complete", etc.

### Fix

**File**: `supabase/functions/chat-mentor/index.ts` (lines ~2657-2669)

Expand the completion signals list to include natural Stoic closing language:

```javascript
const completionSignals = [
  'ready for the next step',
  'this part of the journey is complete',
  'phase is complete',
  'we can take this forward',
  'ready to move forward',
  'gold phase',
  'next phase',
  'carry forward',
  'what you carry forward',
  'brave step',
  'your gold',
  'transmutation is complete',
  // New signals for natural Stoic closing language
  'carry it with you',
  'guiding light',
  'born from your experience',
  'this gold',
  'the gold is yours',
  'anchored now',
  'shaped something powerful',
  'this wisdom',
  'foundation',
  'enduring strength',
  'what immediate action',
  'demonstrate that you are',
  'carry this forward',
  'integrate this',
  'grounded in this',
  'you are ready',
];
```

Additionally, add a **fallback detection**: if the conversation depth is 6+ exchanges in a transmutation session and the user sends a short confirmation, trigger extraction regardless of signal matching. This prevents edge cases where the mentor uses unexpected closing language.

```javascript
// Fallback: if deep enough in transmutation + short confirmation, trigger anyway
const isDeepConversation = conversationDepth >= 6;
const isShortMessage = message.trim().split(/\s+/).length <= 5;

if (hasCompletionSignal || (isDeepConversation && isPhaseConfirmation && isShortMessage)) {
  // proceed with extraction...
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/chat-mentor/index.ts` (lines ~2353-2359) | Rewrite Stoic Gold Phase mission to consolidate questions into 1-2 exchanges max |
| `supabase/functions/chat-mentor/index.ts` (lines ~2657-2669) | Expand completion signals list with natural Stoic closing phrases |
| `supabase/functions/chat-mentor/index.ts` (line ~2675) | Add fallback detection for deep conversations with short confirmations |

All changes are in a single file. The edge function will be redeployed automatically.
