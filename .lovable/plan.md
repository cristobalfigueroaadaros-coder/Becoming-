

## Three Fixes: Build Error, Phase-Aware Future Self Tone, Keywords

### 1. Build Error Fix — `NodeJS.Timeout` in DailyRitualModal

**File: `src/components/DailyRitualModal.tsx`** (lines 74, 92)

Replace `NodeJS.Timeout` with `ReturnType<typeof setInterval>` — standard browser-compatible typing.

### 2. Phase-Aware Future Self Introduction in `startIntakeFlow` and `transitionToIntake`

The intake flow currently uses the same generic introduction regardless of phase. Need to add phase-specific introductions per the user's spec.

**File: `src/pages/ConsoleThread.tsx`**

Add a helper function for phase-specific intro messages:

```typescript
const getPhaseIntroMessages = (state: string): string[] => {
  if (state === "BUILD") return [
    "It sounds like you're already building something.",
    "Before we dive in, I want to understand your project and where you are right now so I can assemble the right mentor council to help you move forward.",
    "I'll ask you three quick questions.",
  ];
  if (state === "GROW") return [
    "It sounds like you already have an idea or direction you're interested in exploring.",
    "Before we take the next step, I want to understand your idea a bit better so I can bring in the right mentors to help you develop it.",
    "I'll ask you three questions.",
  ];
  // DISCOVER
  return [
    "Right now it sounds like you're still exploring what direction might feel meaningful for you. That's completely fine.",
    "Before we decide what to build, I'd like to understand a bit more about you, your experiences, and what naturally interests you.",
    "I'll ask you three questions.",
  ];
};
```

Update `startIntakeFlow` (line 287-306): Replace the generic "Before we begin..." messages with `getPhaseIntroMessages(state)`.

Update `transitionToIntake` (line 511-524): Replace generic transition text with phase-aware intro. The first message becomes "Now that I understand your strengths..." followed by the phase-specific intro messages.

**Questions remain unchanged.** Only the framing/introduction adapts to the phase.

### 3. Keywords in Creative Space

The `useEffect` at line 71 already depends on `projectId` and loads keywords correctly. The secondary issue is that `fetchKeywordSuggestions` sends `tiles` which may be empty at load time.

Add a second `useEffect` that re-runs `fetchKeywordSuggestions` when `tiles` change and keywords are already loaded (if not already present from previous edit). Will verify and ensure it's there.

### Files to Edit
- `src/components/DailyRitualModal.tsx` — Fix `NodeJS.Timeout` type (2 lines)
- `src/pages/ConsoleThread.tsx` — Add `getPhaseIntroMessages`, update `startIntakeFlow` and `transitionToIntake`
- `src/components/creative-space/CreativeSpace.tsx` — Verify tiles-dependent keyword suggestion effect

