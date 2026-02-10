

# Console-Based Mode Enforcement: PROJECT vs PATTERN

## Overview

This change enforces strict separation between **Project Mode** (Standard Council, Builders Team, standard 1-to-1 mentors) and **Pattern Mode** (Transmutation Council, Transmutation Console, Storybreaker/Phoenix/Stoic). The system currently mixes behaviors -- project detection logic runs during pattern sessions, and pattern-like reflective loops happen during project sessions.

---

## Current Problems

1. **Project detection runs everywhere**: The coherence/project detection code (engagement analysis, project name extraction, commitment card logic) executes for ALL mentor types, including Storybreaker, Phoenix, and Stoic during transmutation sessions
2. **No question limit in Project Mode**: Mentors in project conversations can ask unlimited reflective questions without converging toward a proposal
3. **Pattern extraction can leak into Project Mode**: If a user shares emotional content with a standard mentor, there's no guardrail preventing the mentor from going into deep reflective/pattern territory
4. **No explicit mode tracking**: The system detects transmutation sessions via handoff records, but has no formal `current_mode` flag that governs behavior

---

## Implementation Plan

### 1. Define Mode Constants and Detection

**File**: `supabase/functions/chat-mentor/index.ts`

Add a formal mode detection right after the `mentorType` is known (around line 1650, after auth):

```typescript
// === MODE ENFORCEMENT ===
const PATTERN_MENTORS = ['storybreaker_mentor', 'phoenix_mentor', 'stoic_mentor'];
const PROJECT_MENTORS = [
  'creative_visionary', 'strategist_mentor', 'business_mentor', 
  'discipline_mentor', 'marketing_mentor', 'quantum_inventor',
  'scientific_mentor', 'heart_mentor', 'ancient_sage', 
  'alignment_mentor', 'oracle_mother', 'future_self',
  'perspective_mentor', 'challenger_mentor', 
  'design_thinking_mentor', 'ux_mentor', 'gamification_mentor',
  'problem_mentor', 'inner_clarity_mentor', 'release_mentor'
];

const currentMode = PATTERN_MENTORS.includes(mentorType) ? 'PATTERN' : 'PROJECT';
console.log("[MODE]", currentMode, "| mentor:", mentorType);
```

---

### 2. Skip Project Detection Logic in Pattern Mode

**File**: `supabase/functions/chat-mentor/index.ts`

Wrap the entire project coherence detection section (lines ~2533-3163) with a mode guard:

```typescript
// === PDR v2.2: COHERENCE DETECTION ===
// ONLY run in PROJECT mode - never in PATTERN mode
let projectCoherence = null;

if (currentMode === 'PROJECT') {
  // ... all existing project detection, engagement analysis,
  //     mentor-initiated project fast path, coherence prompt, etc.
}
```

This prevents:
- Project name extraction during Storybreaker sessions
- Commitment card triggers during transmutation
- Engagement analysis noise during pattern work

---

### 3. Add Question Limit + Convergence Enforcement in Project Mode

**File**: `supabase/functions/chat-mentor/index.ts`

After building the system prompt (around line 2072) and before sending to AI, inject a convergence rule when the conversation is deep enough:

```typescript
if (currentMode === 'PROJECT' && conversationDepth >= 3 && !isTransmutationSession) {
  systemPrompt += `

=== PROJECT CONVERGENCE RULE (MANDATORY) ===
You have asked ${conversationDepth} questions already. You MUST now:
1. STOP asking open-ended exploratory questions
2. DO one of the following:
   a) Propose a clear project idea or direction based on what you've heard
   b) Restate the user's project/idea clearly and ask for confirmation
   c) Suggest a concrete next step or action

You may ask ONE more narrowing question MAX, but it must be paired with a proposal.

FORBIDDEN after 3+ exchanges:
- "Tell me more about..."
- "What does that mean to you?"
- Open-ended reflective questions without proposals
- Staying in exploration mode

The user came here to BUILD something. Guide them toward it.
=== END CONVERGENCE RULE ===
`;
}
```

---

### 4. Add Emotional Content Guardrail in Project Mode

**File**: `supabase/functions/chat-mentor/index.ts`

Add to the PROJECT mode system prompt injection:

```typescript
if (currentMode === 'PROJECT') {
  systemPrompt += `

=== PROJECT MODE ACTIVE ===
You are in PROJECT MODE. Your purpose is to help the user build, create, or refine a project.

TONE: Business-focused, action-oriented, future-directed.

If the user shares emotional or personal content:
1. Acknowledge it briefly (1 sentence max)
2. Return to project convergence immediately
3. Do NOT dive into pattern extraction, trauma work, or deep reflection
4. If they need deeper emotional work, suggest: "This sounds like something worth exploring in the Transmutation space."

NEVER in Project Mode:
- Extract patterns, fears, triggers, or old stories
- Ask about childhood memories or life events
- Enter reflective loops about emotions
- Output [PATTERN_READY] or pattern JSON
=== END PROJECT MODE ===
`;
}
```

---

### 5. Enforce Pattern Mode Boundaries

**File**: `supabase/functions/chat-mentor/index.ts`

The existing `TRANSMUTATION FOCUS` block (lines 2117-2203) already handles Pattern Mode well. Add a complementary guard that prevents project logic from leaking in:

```typescript
if (currentMode === 'PATTERN') {
  systemPrompt += `

=== PATTERN MODE ACTIVE ===
You are in PATTERN MODE. Your purpose is to help the user explore a life event, extract a pattern, and complete the transmutation journey.

NEVER in Pattern Mode:
- Suggest creating a project
- Discuss business strategy, marketing, or product ideas
- Trigger commitment cards or project proposals
- Reference project-related conversations from other mentors
=== END PATTERN MODE ===
`;
}
```

---

### 6. Apply Mode to Council Meeting Edge Function

**File**: `supabase/functions/council-meeting/index.ts`

The council already receives `councilType`. Add mode-specific behavior to the council insight and banter generation:

In the mentor perspective generation (around line 695), add mode-aware instructions:

```typescript
// For standard council, add convergence instruction
if (councilType !== 'transmutation') {
  systemPrompt += `\nYou are in PROJECT MODE. Focus on helping crystallize a project, idea, or action. Be specific and constructive. Avoid open-ended philosophical exploration.`;
}
```

---

### 7. Skip Handoff Signals and Value Map Detection in Pattern Mode

**File**: `supabase/functions/chat-mentor/index.ts`

Wrap handoff signal detection (line 2491) and value map detection (line 2501) with mode guard:

```typescript
// === DETECT HANDOFF SIGNALS ===
let suggestedHandoff = null;
if (currentMode === 'PROJECT' && conversationDepth >= 4 && message !== "__HANDOFF_INIT__") {
  // ... existing handoff logic
}

// === DETECT VALUE MAP INSIGHTS ===
let valueMapDetection = null;
if (currentMode === 'PROJECT') {
  // ... existing value map detection
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/chat-mentor/index.ts` | Add mode detection, wrap project logic with PROJECT guard, add convergence rule, add emotional guardrail, skip handoff/valuemap in PATTERN mode |
| `supabase/functions/council-meeting/index.ts` | Add project-focused instruction for standard council mentors |

---

## What This Does NOT Change

- The existing transmutation session detection and context isolation (already working)
- The pattern discovery flow (Storybreaker, `[PATTERN_READY]`, fallback detection)
- The user confirmation interceptor
- The Builders Team meeting flow
- Any frontend components or routing
- The onboarding/Gravity flow

---

## Expected Outcomes

| Scenario | Before | After |
|----------|--------|-------|
| User talks to Creative Visionary about ideas | May loop in reflective questions indefinitely | After 3 exchanges, mentor converges toward a project proposal |
| User shares emotional content with Strategist | Mentor may dive into pattern extraction | Brief acknowledgment, then return to project focus |
| Storybreaker session active | Project detection logic still runs | Project detection fully skipped |
| User in Transmutation Council | Value map detection and handoff signals fire | Both skipped entirely |
| Standard Council Q3 | May suggest open-ended reflection | Pushes toward actionable next step |

