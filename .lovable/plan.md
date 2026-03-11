

## Three Fixes

### 1. Intake answers mixing with starter quest answers on restore

**Problem**: Line 209 in `ConsoleThread.tsx` restores intake answers by taking the first 3 user messages. But if the starter quest ran first, those first 3 user messages are the *starter quest* answers (builder DNA), not the intake answers. The real intake answers are messages 4-6.

**Fix in `src/pages/ConsoleThread.tsx`** (line ~206-210):
- When restoring from saved messages, check the saved phase. If the phase is past `starter_return` (i.e., intake or later), find user messages that were persisted *after* the starter quest phases.
- Use the persisted `phase` field on each message to distinguish: starter answers have phase `starter_q1/q2/q3`, intake answers have phase `intake_q1/q2/q3`.
- Update the restore logic to filter user messages by phase prefix:
```typescript
const starterUserMsgs = savedMessages.filter((m: any) => m.role === "user" && m.phase?.startsWith("starter_"));
const intakeUserMsgs = savedMessages.filter((m: any) => m.role === "user" && m.phase?.startsWith("intake_"));
setStarterAnswers(starterUserMsgs.map((m: any) => m.content));
setIntakeAnswers(intakeUserMsgs.map((m: any) => m.content));
```

Also fix line 506 (`processIntake`) which sends hardcoded labels to `process-user-foundation`:
```typescript
// Change from hardcoded:
const storyText = `Work background: ${answers[0]}\n\nMy story: ${answers[1]}\n\nWhat I'm building: ${answers[2]}`;
// To phase-aware:
const labels = getIntakeLabels(entryState);
const storyText = `${labels[0]}: ${answers[0]}\n\n${labels[1]}: ${answers[1]}\n\n${labels[2]}: ${answers[2]}`;
```

Move `getIntakeLabels` from inside `runCouncilMeeting` to module scope so both functions can use it.

### 2. Blinking/pulsing CTA buttons to guide user

**Problem**: Key action buttons (Accept Your Council, Continue Your Journey, Build Something With These Strengths, See Your Capabilities) don't visually stand out enough for users to know they need to click.

**Fixes**:
- **`src/components/console-thread/MentorRevealCard.tsx`** — Add `animate-pulse` class to the "Accept Your Council" button
- **`src/components/console-thread/StarterQuestWinCard.tsx`** — Add `animate-pulse` to both CTA buttons
- **`src/components/momentum/CapabilityMapTab.tsx`** — Add `animate-pulse` to the "Build Something With These Strengths" button
- Use a subtle pulse animation (the existing Tailwind `animate-pulse` or a custom gentle glow) on all primary action buttons in the onboarding flow

### 3. Keywords not showing in Creative Space

**Problem**: The `loadKeywords` `useEffect` in `CreativeSpace.tsx` (line 71-90) has an empty dependency array `[]`, but it calls `fetchKeywordSuggestions(data)` which references `tiles` from the hook. Since `tiles` isn't loaded yet when the effect runs on mount, the suggestions call may send empty tile data. But more critically — the keywords query itself looks correct.

Let me check: the `useEffect` at line 71 has `[]` deps and queries `user_keywords` directly. The query looks fine. The issue is likely that the `user_keywords` table has RLS policies that may be blocking reads, or the keywords were never created for this user.

Actually, re-reading the code: the keywords load on mount with `[]` deps, which is correct. The `fetchKeywordSuggestions` call uses `tiles` from closure which will be empty at mount time — but that only affects AI suggestions, not the keyword list itself. The keyword list should show if there are rows in `user_keywords`.

The more likely issue: `user_keywords` table RLS. Let me verify by checking if there's a select policy.

**Fix**: Run a read query to check `user_keywords` RLS policies. If missing, add a select policy for authenticated users. Also add `tiles` as a dependency trigger for `fetchKeywordSuggestions` so AI suggestions work after tiles load.

**Files**:
- `src/pages/ConsoleThread.tsx` — Fix intake answer restoration, move `getIntakeLabels` to module scope, fix `processIntake` labels
- `src/components/console-thread/MentorRevealCard.tsx` — Add pulse animation to Accept button
- `src/components/console-thread/StarterQuestWinCard.tsx` — Add pulse animation to CTA buttons
- `src/components/momentum/CapabilityMapTab.tsx` — Add pulse animation to Continue button
- `src/components/creative-space/CreativeSpace.tsx` — Add `tiles` dependency for keyword suggestions re-fetch
- Possibly: database migration to add RLS select policy on `user_keywords` if missing

