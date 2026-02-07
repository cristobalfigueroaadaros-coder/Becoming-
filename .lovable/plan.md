
# Fix Storybreaker Transmutation Context Pollution

## The Problem

The Storybreaker mentor is receiving a handoff from the Transmutation Council about a **specific life event** (broken leg in Australia), but after the initial correct message, subsequent responses are **polluted with unrelated context** from other mentor conversations (Creative Visionary discussing memes, job hunting, etc.).

### Evidence from Database

**Handoff record (correct)**:
```
userInput: "I broked my leg while living in australia and it was lockdown for covid..."
councilContext: "...challenges you faced with a broken leg in Australia during lockdown..."
flow: transmutation_pattern_discovery
phase: pattern_extraction
```

**First Storybreaker message (correct at 10:53:13)**:
```
"I was listening in the Council. What you shared took courage.
'I broked my leg while living in australia...'
What emotion comes up most strongly when you think about that moment?"
```

**Second Storybreaker message (WRONG at 10:53:19)**:
```
"What strikes me is this thread about the 'difficulty of finding a good job 
or office work' that you mentioned with the Creative Visionary mentor..."
```

This is completely unrelated to the broken leg transmutation flow!

## Root Cause

In `supabase/functions/chat-mentor/index.ts`, lines 1853-1872:

```typescript
// Lines 1854-1860: Gets ALL previous Storybreaker chats (unrelated topics)
const { data: chatHistory } = await supabaseClient
  .from("chats")
  .select("role, content, created_at")
  .eq("user_id", user.id)
  .eq("mentor_type", mentorType)  // ← Gets OLD Storybreaker conversations too
  .order("created_at", { ascending: true })
  .limit(20);

// Lines 1866-1872: Gets 50 messages from ALL other mentors (Creative Visionary, etc.)
const { data: allRecentChats } = await supabaseClient
  .from("chats")
  .select("mentor_type, role, content, created_at")
  .eq("user_id", user.id)
  .neq("mentor_type", mentorType)  // ← Pulls in unrelated mentor context
  .order("created_at", { ascending: false })
  .limit(50);
```

When in transmutation pattern discovery mode, this cross-mentor memory creates noise that distracts from the specific life event.

---

## Solution

### 1. Detect and Track Transmutation Session

Add a flag/context that persists through the transmutation conversation so subsequent messages stay focused on the life event.

**File**: `supabase/functions/chat-mentor/index.ts`

After the initial handoff is processed (lines 1698-1729), we need to:
1. Store the transmutation context so follow-up messages use it
2. Skip cross-mentor memory when in transmutation mode
3. Only use chat history from AFTER the transmutation handoff started

```typescript
// After detecting transmutation handoff, set a flag
let isTransmutationSession = false;
let transmutationSessionStart: Date | null = null;
let transmutationLifeEvent: string | null = null;

// Check if this is a continuation of a transmutation session
if (mentorType === 'storybreaker_mentor') {
  // Check for recent transmutation handoff (within last hour)
  const { data: recentHandoff } = await supabaseClient
    .from("conversation_handoffs")
    .select("voice_context, created_at")
    .eq("user_id", user.id)
    .eq("target_mentor_type", "storybreaker_mentor")
    .eq("processed", true)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1);
  
  if (recentHandoff?.[0]?.voice_context?.flow === 'transmutation_pattern_discovery') {
    isTransmutationSession = true;
    transmutationSessionStart = new Date(recentHandoff[0].created_at);
    transmutationLifeEvent = recentHandoff[0].voice_context.userInput;
  }
}
```

### 2. Filter Chat History for Transmutation Sessions

When in transmutation mode, only use messages from AFTER the handoff started:

```typescript
// Modify chat history query for transmutation sessions
let chatHistory;
if (isTransmutationSession && transmutationSessionStart) {
  // Only get messages from THIS transmutation session
  const { data } = await supabaseClient
    .from("chats")
    .select("role, content, created_at")
    .eq("user_id", user.id)
    .eq("mentor_type", mentorType)
    .gte("created_at", transmutationSessionStart.toISOString())  // Only recent
    .order("created_at", { ascending: true })
    .limit(20);
  chatHistory = data;
} else {
  // Standard query
  const { data } = await supabaseClient
    .from("chats")
    // ... existing query
  chatHistory = data;
}
```

### 3. Skip Cross-Mentor Memory for Transmutation

When in transmutation mode, skip the allRecentChats query entirely:

```typescript
// Skip cross-mentor memory for focused transmutation sessions
let allRecentChats = null;
if (!isTransmutationSession) {
  const { data } = await supabaseClient
    .from("chats")
    .select("mentor_type, role, content, created_at")
    .eq("user_id", user.id)
    .neq("mentor_type", mentorType)
    .order("created_at", { ascending: false })
    .limit(50);
  allRecentChats = data;
}
```

### 4. Add Transmutation Focus to System Prompt

When continuing a transmutation session, inject focus context:

```typescript
if (isTransmutationSession && transmutationLifeEvent) {
  systemPrompt += `

=== TRANSMUTATION FOCUS ===
You are in a PATTERN DISCOVERY session about a specific life event.
STAY FOCUSED on this event and IGNORE any unrelated topics from other mentors.

LIFE EVENT TO EXPLORE:
"${transmutationLifeEvent}"

YOUR MISSION:
1. Keep asking questions ONLY about this specific life event
2. Extract: Emotion, Fear/Old Story, Trigger, Life Moment
3. When you have enough, output [PATTERN_READY] JSON block
4. DO NOT reference other mentors or unrelated topics

FORBIDDEN:
- Do NOT mention job hunting, memes, or other unrelated topics
- Do NOT say "you mentioned with the Creative Visionary..."
- ONLY focus on the life event above
=== END TRANSMUTATION FOCUS ===
`;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/chat-mentor/index.ts` | Add transmutation session detection, filter chat history, skip cross-mentor memory, add focus prompt |

---

## Expected Result

### Before (current behavior):
```
Storybreaker: "What strikes me is this thread about the 'difficulty of finding 
a good job' that you mentioned with the Creative Visionary mentor..."
```

### After (fixed):
```
Storybreaker: "Thank you for sharing more. When you were alone with your broken 
leg in Australia, what fear came up most strongly? What did you tell yourself 
about what this meant?"
```

---

## Summary

The fix ensures that when the Storybreaker is in a **transmutation pattern discovery session**, it:

1. Only uses chat history from the current session (after the handoff)
2. Ignores cross-mentor memory completely
3. Stays laser-focused on extracting pattern data from the specific life event
4. Never references unrelated topics from other mentor conversations

This preserves the alchemy flow:
- **Transmutation Council** → Shares life event
- **Storybreaker** → Extracts pattern (Emotion, Fear, Trigger, Life Moment) → Unlocks Pattern Map
- **Phoenix** → White Phase (Shift, Lesson, Protection)
- **Stoic** → Gold Phase (Creation, New Belief, Strength)
