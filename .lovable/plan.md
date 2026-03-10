

## Starter Quest (Builder DNA First Win)

A pre-intake interaction layer in ConsoleThread that runs once for new users, asking 3 quick "builder DNA" questions, generating 2 capabilities via the existing `seed-initial-capabilities` edge function, and showing results in-thread before continuing to the normal onboarding flow.

### Changes

**1. Edit `src/pages/ConsoleThread.tsx`**

- Add new phases to the `Phase` type: `"starter_q1" | "starter_q2" | "starter_q3" | "starter_processing" | "starter_win" | "starter_return"`
- Add state: `starterAnswers: string[]`, `starterCapabilities: any[]`
- **Init logic change**: Before showing the normal opening messages, check if user has already completed the starter quest (check `momentum_capabilities` with `acquisition_channel = 'onboarding_inferred'` or a profile flag). If not completed → start starter quest flow. If completed → skip to normal intake.
- **Starter opening messages** (Future Self, short chat style):
  1. "Hey [Name] 👋"
  2. "Before we begin building something meaningful, I want to understand how you naturally think and solve problems."
  3. "It only takes a moment, and it helps me personalize the experience for you."
  4. Ask Question 1
- **3 Starter Questions** with reflections between them (reuse `generateReflection` pattern):
  - Q1: "What kind of problems do you naturally enjoy solving?"
  - Q2: "What do people usually come to you for help with?"
  - Q3: "When you're working on something exciting, what role do you naturally take?"
- **After Q3 answered** (`starter_processing` phase): Call `seed-initial-capabilities` edge function with the 3 starter answers as `intakeAnswers` and entry state as `workContext`. Extract the first 2 capabilities from the response.
- **Starter Win display**: Show Future Self reflection → "✨ Starter Quest Complete" message → In-thread card component showing the 2 unlocked capabilities with a "See Your Capabilities" button linking to `/momentum` (capabilities tab).
- **Return mechanism**: After user views capabilities and returns (or presses a "Continue" button in the card), Future Self sends: "Now that I understand your strengths, let's build something meaningful around them." → then the normal intake flow begins (existing `intake_q1` phase).
- **`handleSend` updates**: Add handlers for `starter_q1`, `starter_q2`, `starter_q3` phases that mirror the intake question pattern with reflections.

**2. New in-thread card component: `src/components/console-thread/StarterQuestWinCard.tsx`**

- Shows "Your first capabilities unlocked" heading
- Lists 2 capabilities with category icons (reuse `CATEGORY_CONFIG` from CapabilityMapTab)
- "See Your Capabilities" button → `navigate("/momentum")` with state hint to open capabilities tab
- "Continue Your Journey" button → triggers transition to normal intake flow

**3. Edit `supabase/functions/seed-initial-capabilities/index.ts`**

- Minor prompt adjustment: accept starter quest answers (which are about problem-solving style, not work background) gracefully — the current prompt already handles varied input, but tweak the prompt template to also work well with builder-DNA style answers. Change `intakeAnswers` mapping to be more generic.

**4. Profile flag for persistence**

- Use `starter_quest_completed` field on profiles. Since we can't modify DB schema instructions say, we'll use the existing check in `seed-initial-capabilities` (it already checks for `acquisition_channel = 'onboarding_inferred'` rows) to determine if starter quest was already done. No DB migration needed.

### Flow Summary

```text
New user opens New Conversation
  → Starter Q1, Q2, Q3 (builder DNA)
  → Call seed-initial-capabilities with starter answers
  → Show 2 capabilities in-thread card
  → User explores or continues
  → Normal intake flow begins (existing logic, unchanged)

Returning user (capabilities already exist)
  → Skip starter quest entirely
  → Normal intake flow as before
```

### Files
- `src/pages/ConsoleThread.tsx` — add starter phases, questions, win flow
- `src/components/console-thread/StarterQuestWinCard.tsx` — new card component
- `supabase/functions/seed-initial-capabilities/index.ts` — minor prompt flexibility

