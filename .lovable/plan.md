

# Surface Compression and Flow Optimization

## Overview

This is a prompt engineering pass across 3 edge functions and 1 utility function. No UI changes. No architecture changes. The goal: reduce word density, enforce directness, and tighten every mentor and council output.

## Changes

### 1. `supabase/functions/chat-mentor/index.ts` -- Global + Mentor Compression

**A. HUMAN_CONVERSATION_RULES (lines 19-77) -- Add Global Compression Rule**

Insert a new block before the existing rules:

```
GLOBAL COMPRESSION RULE (APPLY TO EVERY RESPONSE):
- Reduce response length by 20-30% compared to your instinct.
- Remove one explanatory sentence before every question.
- No double validation (e.g., "That's powerful... that takes courage..." -- pick ONE).
- No abstract phrasing. Replace "Led to the development of..." with "You learned..."
- Shorter. Direct. Human.
- In 1-to-1: Maximum 2 sentences of reflection + 1 question or CTA.
- Never pad. Never repeat yourself in different words.
```

Update the LENGTH RULE to be stricter:
- 1-to-1 sessions: "1 short reflection + 1 sharp question or CTA. No double framing."
- Transmutation: "2-3 sentences max. Let silence work."

**B. Phoenix Mentor (lines 1488-1650) -- White Phase Compression**

Strip the distillation flow from 6 steps to 3:
1. Acknowledge the emotion
2. Clarify the pattern's role
3. Surface the shift/learning

Remove:
- "Normalize the experience" step (redundant with acknowledgment)
- "Surface life skills" step (skill extraction is Gold Phase territory)
- "Converge and pause" step (replaced by mandatory CTA)

Add explicit rule:
```
WHITE PHASE COMPRESSION (CRITICAL):
- Focus ONLY on answering the preset White Phase questions.
- No skill extraction. No early redemption. No philosophical reframing. No meta commentary.
- White Phase is excavation. Not interpretation.
- Priority: cleanly auto-populate the pattern name and core wound over extracting psychological nuance.
- Maximum 3 core questions total across the entire White Phase.
```

Update win condition: Remove "life skill" language. Replace with "shift" and "learning" only.

**C. Gold Phase / Stoic (lines 2590-2608) -- Remove Over-celebration**

Add:
```
GOLD PHASE TONE:
- No over-celebration. No inflated praise.
- Grounded tone. Example: "You reclaimed self-respect." then "What action proves it this week?"
- Clean. Stable. Strong.
```

**D. Release Mentor (lines 2563-2588) -- Already tight, add tone reinforcement**

Add one line:
```
- No abstract or poetic language. No metaphors. Embodied over conceptual.
```

### 2. `supabase/functions/council-meeting/index.ts` -- Council Surface Compression

**A. Council Insight prompt (lines 696-721)**

Change line 720 from:
```
Generate 1-2 sentences MAX. No restatement. New perspective only.
```
To:
```
Generate 1-2 sentences MAX (under 120 words). No restatement. No layered metaphors. No poetic expansion. Maximum clarity. The Council sets tone -- it does not analyze deeply.
```

**B. Banter already limited to Q1 only** -- no change needed (already implemented).

**C. Mentor micro-perspectives** -- add compression instruction to the perspective generation prompt to keep each perspective under 40 words.

### 3. `supabase/functions/inner-self-council/index.ts` -- Inner Self Council Compression

Add compression rules to the system prompt:
```
COMPRESSION RULES:
- Council Insight: under 120 words. No layered metaphors. No poetic expansion.
- Mentor perspectives: 2-3 sentences each, under 40 words each.
- Banter: 3-4 lines max (already enforced).
- No double validation across mentors.
```

### 4. `supabase/functions/extract-superpowers/index.ts` -- Superpower Description Rule

Update the prompt (line 64-120) to enforce human, embodied descriptions:

Change the description instruction from:
```
"One sentence about how this was gained from this event"
```
To:
```
"One short embodied sentence. Human and empathetic. NOT corporate. Examples of good descriptions: 'You stopped shrinking.', 'You pause before saying yes.', 'You choose yourself.' Avoid: 'Demonstrates newfound capacity...' or 'Led to the development of...'"
```

### 5. Transmutation Tone Discipline -- Already Enforced

The `TRANSMUTATION_TONE_RULES` in council-meeting and the `TRANSMUTATION LANGUAGE FIREWALL` in chat-mentor already forbid business language. No changes needed here -- this is already locked.

### 6. Momentum Protection -- Already Enforced

Handoff continuity is handled by the handoff system and `processedHandoffIds` guard (just fixed). The existing `conversationContext` injection already carries prior context. No changes needed.

## Files Summary

| File | Change | Purpose |
|------|--------|---------|
| `supabase/functions/chat-mentor/index.ts` | Add global compression rule, strip Phoenix to 3 steps, tighten Gold tone, reinforce Release | 20-30% shorter mentor responses, no skill extraction in White Phase |
| `supabase/functions/council-meeting/index.ts` | Cap council insight at 120 words, add compression to perspective prompts | Sharper council output |
| `supabase/functions/inner-self-council/index.ts` | Add compression rules to system prompt | Consistent compression across all councils |
| `supabase/functions/extract-superpowers/index.ts` | Update description prompt to embodied language | Human superpower descriptions |

## What This Does NOT Change

- No UI changes
- No database changes
- No routing changes
- No architecture changes
- Transmutation tone firewall already in place
- Handoff continuity already fixed
- Banter already limited to Q1 only

