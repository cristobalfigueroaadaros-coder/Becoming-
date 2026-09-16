# Onboarding journey cleanup

## Goal
Make the existing onboarding journey run in one reliable order:

1. Registration and five opening questions.
2. Land on the user’s Atlas.
3. After four seconds, show the Atlas introduction card.
4. Accept the introduction and begin the first quest.
5. Complete the quest, select Atlas Dots, and return to the Atlas to see them.
6. Start another quest and repeat the same completion loop.
7. When prompted, add a Lifetime Event and return to see it on the Atlas.
8. Make the Cris/founder map control pulse; opening it starts the founder journey from the beginning.
9. Continue into and complete the final quest.

## Investigation
- Trace every route, saved completion marker, delayed popup, and redirect involved.
- Identify legacy founder-first and walkthrough behavior that conflicts with this order.
- Confirm how quest completion, dot selection, Lifetime Events, and founder progress are persisted and resumed.

## Implementation
- Establish one authoritative onboarding stage resolver from persisted progress.
- Make each action advance exactly one stage and prevent duplicate clicks or remounts from skipping stages.
- Remove or bypass conflicting redirects and stale browser flags for this journey.
- Preserve normal Atlas use after onboarding is complete.

## Verification
- Exercise the journey in order for a new account/state.
- Check refresh/resume behavior at the Atlas intro, quest return, Lifetime Event, and founder journey stages.
- Confirm Dots and Lifetime Events appear before the next prompt is shown.
