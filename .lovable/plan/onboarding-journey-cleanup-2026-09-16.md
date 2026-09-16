# Onboarding journey cleanup

## Goal

Make the existing onboarding journey run in one reliable order:

1. Registration and five opening questions.
2. Land on the user’s Atlas.  
trigger the explanation card of atlas 
3. After four seconds, show the Atlas introduction card.
4. Accept the introduction and begin the first quest.
5. Complete the quest, select Atlas Dots, and return to the Atlas to see them.
6. Start the second quest and repeat the same completion loop.
7. After two completed quests, prompt the user to add a Lifetime Event and return to see it on the Atlas. Remember to trigger the explanatio life time event card 
8. Make the Cris/founder map control pulse; opening it starts the founder journey from the beginning. create an exaplantion card saying something i am cris this is my map on everything that happen into my life until i build Bcoming, is an example for you ... somehting like this 
9. “Continue quest” resumes the next normal quest in the existing ordered sequence.

## Investigation

- Trace every route, saved completion marker, delayed popup, and redirect involved.
- Identify legacy founder-first and walkthrough behavior that conflicts with this order.
- Confirm how quest completion, dot selection, Lifetime Events, and founder progress are persisted and resumed.

## Implementation

- Establish one authoritative onboarding stage resolver from persisted progress: introduction, quest one, quest two, Lifetime Event, founder journey, then normal quest continuation.
- Make each action advance exactly one stage and prevent duplicate clicks or remounts from skipping stages.
- Remove or bypass conflicting redirects and stale browser flags for this journey.
- Return to the user’s Atlas after each selected Dot and after the Lifetime Event, showing the newly added item before the next action is offered.
- Pulse the Cris’s Map control only after the Lifetime Event has been added; opening it starts the founder journey at its first moment.
- Preserve normal Atlas use after onboarding is complete.

## Verification

- Exercise the journey in order for a new account/state.
- Check refresh/resume behavior at the Atlas intro, quest return, Lifetime Event, and founder journey stages.
- Confirm Dots and Lifetime Events appear before the next prompt is shown.