

# Fix: Transmutation Tone Contamination and White Phase Question Density

## What's Wrong

### Issue 1: Business Language in Transmutation Phase

When you share something deeply personal like "I miss being chosen and deeply known," the system responds with product/market language ("leverage point," "market value of being chosen," "create something profitable"). This happens because:

- The Council uses a single set of "dimension lenses" designed for project discussions. These include lenses like "leverage," "market reality," "leadership maturity," and "short term action." When a Transmutation Council runs, mentors get assigned these business lenses and respond through them -- even during emotional processing.
- The Council Insight prompt has no instruction to stay in emotional/psychological territory during transmutation.
- The banter generation uses the same business-oriented dimensions.

### Issue 2: White Phase Has Too Many Probing Layers

The Storybreaker mentor prompt says "2-3 questions max," but it also includes generic discovery questions and human conversation rules that encourage additional exploration, reflection, and concept-explaining. This creates cognitive fatigue and shifts the user from feeling into thinking.

## Changes

### File: `supabase/functions/council-meeting/index.ts`

**Change 1 -- Add a transmutation-specific dimension pool**

Create a new pool of emotional/psychological dimensions alongside the existing project pool:

```
transmutation: [
  'emotional_truth -- what emotion is the user actually carrying',
  'identity_impact -- how this shaped who they became',
  'protective_pattern -- what this behavior was trying to protect',
  'hidden_cost -- what staying in this pattern costs them',
  'grief_or_loss -- what was lost or mourned in this experience',
  'strength_gained -- what resilience or skill emerged from this',
  'narrative_shift -- the story they told themselves vs what actually happened',
  'attachment -- what they were holding onto and why',
  'permission -- what they haven't given themselves permission to feel or do',
  'integration -- how this experience connects to their larger life arc',
]
```

Update `assignMentorDimensions` to accept and use the council type, selecting the correct pool.

**Change 2 -- Add transmutation guardrails to Council Insight prompt**

When `councilType === 'transmutation'`, inject explicit tone rules into the insight prompt:

```
TRANSMUTATION TONE RULES (MANDATORY):
- This is emotional processing, NOT a strategy session.
- FORBIDDEN: product, market, leverage, audience, scaling, positioning, value proposition, profitable, revenue, SaaS, framework, system, tool, business model, competitive, monetize.
- Stay in: emotion, identity, grief, attachment, protection, courage, loss, meaning, wound, strength, integration.
- Speak as if holding space for someone processing a life-defining moment.
- Maximum 1-2 sentences. Warm. Grounded. Human.
```

**Change 3 -- Add the same guardrails to mentor perspective prompts for transmutation**

In the standard mentor prompt block (line ~1002), when `councilType === 'transmutation'`, append the same forbidden-words list and emotional-only instruction to each mentor's system prompt. This prevents any mentor from using business framing during a transmutation council.

**Change 4 -- Add transmutation guardrails to banter prompt**

When `councilType === 'transmutation'`, modify the banter generation prompt to explicitly forbid business language and require emotional/psychological dimensions only.

### File: `supabase/functions/chat-mentor/index.ts`

**Change 5 -- Remove `${DISCOVERY_QUESTIONS}` from Storybreaker prompt**

The Storybreaker mentor currently ends with `${DISCOVERY_QUESTIONS}`, which injects 12+ generic exploration questions. These are project-oriented and dilute the focused 2-3 question extraction flow. Remove this injection entirely.

**Change 6 -- Add a transmutation language firewall to all transmutation mentors**

Add a shared constant `TRANSMUTATION_LANGUAGE_FIREWALL` that gets injected into Phoenix, Stoic, Release, and Storybreaker prompts:

```
=== TRANSMUTATION LANGUAGE FIREWALL (ABSOLUTE) ===
You are in an emotional processing space. This is identity work, not strategy.

FORBIDDEN WORDS (never use in any form):
product, market, leverage, audience, scaling, positioning, value proposition, 
profitable, revenue, SaaS, framework, business model, competitive, monetize, 
client, customer, offer, pricing, launch, MVP, funnel, conversion, growth hack

REQUIRED TONE:
- Slower. Shorter. Softer. More human. Less abstract.
- Maximum 2-3 sentences per response.
- No strategic reframing. No entrepreneurial metaphors.
- Stay in: emotion, identity, grief, attachment, protection, courage, wound, strength.
=== END FIREWALL ===
```

**Change 7 -- Tighten White Phase (Storybreaker) to exactly 3 core questions**

Update the Storybreaker's TRANSMUTATION CONSOLE ROLE to enforce a strict 3-question-max structure:

```
WHITE PHASE QUESTION LIMIT (MANDATORY):
Maximum 3 core questions before pattern naming:
1. "What emotion rises most strongly?"
2. "What fear sits underneath it?"  
3. "When does this usually get triggered?"

That is enough. Do NOT add:
- Behavior analysis
- Belief extraction
- Narrative framing
- Pattern pre-analysis
- Additional probing layers

Surface the wound. Do not dissect it.
```

Remove or replace the current 4-item extraction list (Emotion, Fear, Trigger, Life Moment) with the streamlined 3-question version. Life Moment is already known from the council handoff.

## Summary

| File | Change | Why |
|------|--------|-----|
| `council-meeting/index.ts` | Add `transmutation` dimension pool | Stops business lenses (leverage, market) from being assigned during emotional processing |
| `council-meeting/index.ts` | Add forbidden-words list to Council Insight prompt for transmutation | Prevents "market value of being chosen" type responses |
| `council-meeting/index.ts` | Add forbidden-words to mentor perspective prompts for transmutation | Ensures every mentor stays in emotional territory |
| `council-meeting/index.ts` | Add forbidden-words to banter prompt for transmutation | Keeps banter psychologically clean |
| `chat-mentor/index.ts` | Remove `${DISCOVERY_QUESTIONS}` from Storybreaker | Stops 12+ generic exploration questions from diluting the focused extraction |
| `chat-mentor/index.ts` | Add `TRANSMUTATION_LANGUAGE_FIREWALL` constant to all transmutation mentors | Hard separation: no business language can leak into emotional processing |
| `chat-mentor/index.ts` | Tighten Storybreaker to 3 core questions max | Reduces cognitive fatigue, preserves emotional intensity, moves faster to pattern naming |

## Expected Outcome

- Transmutation phase becomes emotion-only territory with zero business language contamination
- White Phase surfaces the wound in 3 focused questions instead of 5-7 analytical probes
- The system feels like "I see your wound" instead of "Let's leverage this insight"
- No architectural changes -- only prompt guardrails and dimension pool separation
