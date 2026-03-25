

# PDR 18 — Atlas Intelligence Bridge

## Summary

Connect Atlas data to the thread system so Future Self opens with a personalized multi-message reflection based on the user's Atlas dots instead of generic starter questions. Four changes: (1) signal extraction edge function, (2) unlock trigger notification on Atlas page, (3) replace starter quest + generic intro with Atlas-based Future Self reflection in ConsoleThread, (4) pass Atlas signals to Council creation for richer mentor context.

## 1. Signal Extraction Edge Function

**Create: `supabase/functions/extract-atlas-signals/index.ts`**

Reads the user's Atlas dots and compresses them into structured signals:
- Identity Signals (max 5): derived from dot names the user selected, cluster patterns
- Motivational Signals (max 3): from values, passions, vision clusters
- Behavioral Patterns (max 2): from experiments, skills, frustrations clusters
- Direction Signals (optional): from Gold Moments, service clusters
- Inspiration Signals (optional): from inspirations cluster

Rules:
- Only use dots where `user_validated = true` OR `original_title IS NOT NULL` (user-confirmed)
- Prioritize Gold Moment dots and evolved dots
- Do NOT pass raw quest answers or descriptions — only compressed signal labels
- Uses AI (gemini-2.5-flash) to synthesize dot titles into signal labels
- Returns: `{ identitySignals, motivationalSignals, behavioralPatterns, directionSignals, inspirationSignals, signalDepth: "early"|"growing"|"rich" }`

## 2. Unlock Trigger on Atlas Page

**Edit: `src/pages/AtlasPage.tsx`**

After quests load, check if user has:
- ≥ 3 completed quests AND ≥ 2 dots across ≥ 2 different clusters
- AND `console_intake_completed` is NOT true (thread not yet started)

If conditions met, show a styled notification card at the top of the Atlas page:
- "Hey, I've been looking at what you've been sharing..."
- "I'm starting to see something interesting."
- Two buttons: "Start Your Journey" (navigates to `/console`) and "New Quest" (starts another quest)
- Additional encouraging text: "The more you explore, the clearer this becomes."

**Edit: `src/hooks/useAtlas.tsx`**

Add a `threadUnlockReady` boolean to the hook return, computed from dot count + cluster spread.

## 3. Replace Starter Quest with Atlas Reflection

**Edit: `src/pages/ConsoleThread.tsx`**

This is the core change. The current flow is:
1. Starter quest (3 questions about problem-solving style)
2. Capability generation
3. Intake questions (3 phase-based questions)
4. Council creation

New flow:
1. **Skip starter quest entirely** when Atlas signals are available
2. Future Self sends 7-9 short messages (WhatsApp-style) using Atlas signals
3. User confirms/adjusts
4. Transition to existing phase questions (unchanged)
5. Council creation with enriched inputs

Implementation:
- In the `init` useEffect, after checking starter quest status, call `extract-atlas-signals`
- If signals are returned with sufficient depth (≥ 2 identity signals): skip starter quest, go to new `atlas_reflection` phase
- New phases: `"atlas_reflection"` and `"atlas_confirmation"`

**Atlas reflection message sequence** (each sent with typing delay):
1. `"Hey [Name] 👋"`
2. `"I've been looking at what you've been sharing..."`
3. `"I'm starting to see something interesting."`
4. Message 4-6: AI-generated from signals (identity, motivational, behavioral) — call `extract-atlas-signals` which returns pre-formatted reflection messages
5. Synthesis message
6. `"Does that feel right to you?"`

**User response handling:**
- YES/confirm → `"Got it. That helps me see it more clearly."` → transition to phase questions
- NO/disagree → `"Tell me more. What feels off?"` → user explains → Future Self adjusts → re-confirm
- New info → `"That's useful. I'm keeping that in mind."` → store as additional signal → proceed

Add signal detection in `handleSend` for the `atlas_confirmation` phase using simple keyword matching (yes/yeah/exactly/right → confirm, no/not really/off → adjust).

**Edit: `supabase/functions/extract-atlas-signals/index.ts`**

Add a `generateReflectionMessages` mode that takes the compressed signals and generates the 7-9 message sequence following the WhatsApp rule (max 2 sentences per message). Language rules enforced in prompt:
- Never say: "Based on your Atlas data", "Your capabilities show", "The system detected"
- Say instead: "I've been watching what you share", "You seem to be someone who", "It feels like"
- Progressive depth based on signal count (early: tentative, rich: confident)

## 4. Council Enhancement with Atlas Signals

**Edit: `src/pages/ConsoleThread.tsx`**

In `processIntake` and `runCouncilMeeting`:
- Include Atlas signals in the body sent to `council-meeting`
- Store signals in a state variable after extraction

**Edit: `supabase/functions/council-meeting/index.ts`**

- Accept optional `atlasSignals` in request body
- If present, inject into each mentor's system prompt as invisible context using the Two-Layer Rule:
  - Layer 1 (all mentors): top 3 identity signals + top 1-2 motivational signals
  - Layer 2 (per mentor): domain-filtered signals based on mentor type matrix from PDR
- Add explicit instruction: "Use these signals as invisible context. Never reference Atlas, data, dots, or profiles explicitly."

**Mentor signal matrix** (added as a mapping constant):
- `creative_visionary`: + passions, creative patterns
- `strategist_mentor`: + behavioral patterns, direction signals
- `business_mentor`: + direction signals, experiments, skills
- `challenger_mentor`: + shadow signals, frustrations
- `perspective_mentor`: + vision signals, inspiration signals
- `marketing_mentor`: + external reflection signals
- `design_thinking_mentor`: + experiments, behavioral patterns

## 5. OnboardingRouter Update

**Edit: `src/components/OnboardingRouter.tsx`**

After Atlas onboarding quests are complete, check if thread unlock conditions are met. If so, route to `/atlas` (where unlock notification appears) rather than directly to dashboard, so user sees the invitation.

## Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/extract-atlas-signals/index.ts` | Create — signal extraction + reflection message generation |
| `src/pages/ConsoleThread.tsx` | Edit — new atlas_reflection phase, skip starter quest when signals available, pass signals to council |
| `src/pages/AtlasPage.tsx` | Edit — unlock trigger notification card |
| `src/hooks/useAtlas.tsx` | Edit — add threadUnlockReady computed boolean |
| `supabase/functions/council-meeting/index.ts` | Edit — accept atlasSignals, inject per-mentor filtered context |
| `src/components/OnboardingRouter.tsx` | Edit — route to Atlas after quest completion for unlock flow |

