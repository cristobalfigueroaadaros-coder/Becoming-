

## Fix Council Context Labels to Match Intake Questions

The council mentors are responding to the wrong context because the `fullIntakeContext` string (line 625 of `ConsoleThread.tsx`) uses hardcoded generic labels — "Background", "Story", "What they're building" — regardless of which entry state (DISCOVER/GROW/BUILD) the user is in.

For example, in GROW mode:
- Q1 asks "Tell me about the idea or project" → mislabeled as "Background"
- Q2 asks "What problem are you solving?" → mislabeled as "Story"
- Q3 asks "What impact would it create?" → mislabeled as "What they're building"

This causes the council AI to interpret a project description as "background" and ignore the actual project details.

### Fix

**File: `src/pages/ConsoleThread.tsx`** (lines ~622-625)

Replace the hardcoded labels with phase-aware labels:

```typescript
const getIntakeLabels = (state: string): string[] => {
  if (state === "BUILD") return [
    "What they're building or working on",
    "Biggest challenge right now",
    "90-day progress goal",
  ];
  if (state === "GROW") return [
    "Their project idea",
    "The problem they're solving",
    "The impact they envision",
  ];
  return [
    "Background and experiences",
    "Problems and topics that pull their attention",
    "Five-year vision of meaningful work",
  ];
};

// In runCouncilMeeting:
const labels = getIntakeLabels(entryState);
const fullIntakeContext = `${labels[0]}: ${intakeAnswers[0] || "Not shared"}\n\n${labels[1]}: ${intakeAnswers[1] || "Not shared"}\n\n${labels[2]}: ${intakeAnswers[2] || "Not shared"}`;
```

This ensures the council-meeting edge function receives properly labeled context that matches what the user was actually asked, so mentors focus on the project/business instead of treating everything as personal background.

One file changed. No edge function or database changes needed.

