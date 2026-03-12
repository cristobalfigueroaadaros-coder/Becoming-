
I found the root cause and it explains why this keeps happening:

1) The intake thread is being mounted twice on desktop (one visible, one hidden), so two flows run in parallel and race each other.  
2) The first intake question can still be generated from a stale default state (`DISCOVER`) in resume/transition paths, while later questions use updated state (`GROW`), creating the mixed behavior you saw.

### What I will implement

## 1) Stop duplicate intake flow execution
**File:** `src/pages/Council.tsx`

- Render only one conversation component at runtime (not both desktop + mobile trees at once with CSS hiding).
- Keep the same UI layout, but ensure only the active layout mounts `ConsoleThread`.

This removes duplicate message inserts and race conditions.

## 2) Make intake phase state deterministic in all paths
**File:** `src/pages/ConsoleThread.tsx`

- Add a normalized resolver for phase state (`DISCOVER | GROW | BUILD`) from profile/local storage.
- Store latest resolved state in a ref so async callbacks never use stale defaults.
- Update intake entry points to always use explicit resolved state:
  - `startIntakeFlow(...)`
  - `transitionToIntake(...)`
  - first question generation
  - second/third intake question generation
  - intake context labels sent to backend
- Keep onboarding structure exactly the same.
- Keep question sets exactly the same; only fix which set is chosen.

## 3) Auto-heal already-broken saved threads
**File:** `src/pages/ConsoleThread.tsx`

- On restore, detect mismatch between:
  - expected first question for resolved phase, and
  - persisted `intake_q1` first question.
- If mismatch is found, reset only the intake segment (not starter quest), then replay correct phase intro + correct Q1.

This ensures users already stuck with wrong first question are fixed immediately without manual reset.

## 4) Validate all three phases explicitly
I’ll verify phase routing against exact first-three questions:

- **DISCOVER**: background / curiosity / 5-year meaningful work
- **GROW**: idea/project / problem to solve / intended impact
- **BUILD**: what building now / biggest challenge / 90-day progress

### Technical details
- No database schema changes.
- No onboarding question text changes.
- No flow restructuring (Starter Quest → Intake → Council remains intact).
- Main code touchpoints:
  - `src/pages/Council.tsx`
  - `src/pages/ConsoleThread.tsx`
