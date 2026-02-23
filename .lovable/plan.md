

# Fix: Strategist Mentor — Too Many Questions, Too Slow to First Win

## Problem

The Strategist Mentor in Grow/Build mode still asks too many questions and takes too long to deliver value because:

1. **Exploratory prompts override execution directives** — `DISCOVERY_QUESTIONS`, `PROACTIVE_PROJECT_RULES`, and `HUMAN_CONVERSATION_RULES` are all injected into the strategist prompt. These contain language like "Ask questions, understand deeply", "STAGE 1 - EXPLORATION", and 12+ discovery questions. The BUILD entry state says "converge in 2-3 turns" but is drowned by 100+ lines of exploration instructions.

2. **Convergence rule only activates at depth 3+** — The first 3 exchanges have zero convergence pressure. In BUILD mode, the system should be converging from exchange 1.

3. **Commentary density** — `HUMAN_CONVERSATION_RULES` says "6-8 sentences" for general responses. For BUILD mode this should be 3-4 sentences max.

4. **Over-facilitation** — The prompt says "Sometimes: Reflect back what you heard and check understanding" and "Sometimes: Share a longer thought with explanation and context". In BUILD mode these create drag.

## Changes

### File: `supabase/functions/chat-mentor/index.ts`

**Change 1 — Add BUILD-mode override block to strategist prompt (after line 784)**

Insert a new block that activates when `entryState === "BUILD"` and `mentorType === "strategist_mentor"`. This block overrides the general exploration instructions:

```
=== BUILD MODE ACCELERATION (OVERRIDES EXPLORATION RULES) ===
You are in EXECUTION mode. The user already knows what they're building.

RULES:
- First response: Detect stage (idea/MVP/live/revenue) + identify primary bottleneck. ONE question max.
- Second response: Propose a concrete, time-bound milestone. No exploration.
- Third response: If user agrees, trigger project creation. If not, adjust milestone once.
- Maximum 3 exchanges before proposal. No exceptions.

RESPONSE LENGTH: 3-4 sentences max. No restatement. No reflection loops.
TONE: Direct, structured, outcome-focused. No philosophical framing.
FORBIDDEN in BUILD mode:
- "Tell me more about..."
- "What does that mean to you?"
- Reflection, reframing, or emotional acknowledgment beyond 1 sentence
- Discovery questions from the exploration bank
- Commentary between user answers
=== END BUILD MODE ACCELERATION ===
```

**Change 2 — Lower convergence threshold for BUILD mode (line ~2276)**

Currently: `if (conversationDepth >= 3 && !isTransmutationSession)`

Add a BUILD-specific earlier trigger:

```typescript
const convergenceThreshold = (entryState === "BUILD" && mentorType === "strategist_mentor") ? 1 : 3;
if (conversationDepth >= convergenceThreshold && !isTransmutationSession) {
```

This means BUILD+strategist gets convergence pressure from the very first exchange.

**Change 3 — Add GROW-mode compression block**

For GROW mode with the strategist, add a similar but slightly softer block:

```
=== GROW MODE COMPRESSION ===
The user has an emerging direction. They need refinement, not exploration.

RULES:
- First response: Acknowledge direction. Ask ONE sharpening question.
- Second response: Propose elevated scope or stretch direction.
- Third response: Confirm and create project.
- Maximum 4 exchanges before proposal.

RESPONSE LENGTH: 4-5 sentences max.
TONE: Structured, forward-moving. Minimal reflection.
Skip discovery questions — the user already has direction.
=== END GROW MODE COMPRESSION ===
```

**Change 4 — Reduce Council Insight length in council-meeting function**

In the council-meeting edge function, update the Q1 prompt to cap insight length:

- Change `councilInsight` instruction from "2-3 sentences" to "1-2 sentences max"
- Change individual mentor perspectives from "2-3 sentences" to "1-2 sentences max"
- Add: "Do NOT restate what the user already said. Add new perspective only."

### File: `supabase/functions/council-meeting/index.ts`

Update the response format instructions to enforce shorter output:

- `councilInsight`: "1-2 sentences. New perspective only. Do not restate user input."
- `mentorPerspectives`: "1-2 sentences each. No overlap. No restating."
- `suggestedNextQuestion`: "One short, direct question. No preamble."

## Summary

| File | Change |
|------|--------|
| `supabase/functions/chat-mentor/index.ts` | Add BUILD acceleration override, GROW compression override, lower convergence threshold to 1 for BUILD+strategist |
| `supabase/functions/council-meeting/index.ts` | Reduce insight and perspective text length by 20-30%, add "no restatement" rule |

## What This Achieves

- BUILD mode: First win (milestone proposal) within 2-3 exchanges (under 5 minutes)
- GROW mode: Proposal within 3-4 exchanges
- Council insights: 20-30% shorter, no restating user input
- Tone matches execution energy in BUILD mode
- No architectural changes — only prompt and threshold tuning

