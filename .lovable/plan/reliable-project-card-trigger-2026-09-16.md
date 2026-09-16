# Reliable project-card trigger

## Confirmed cause

The mentor response correctly proposes **“The Creator’s Journey”** and tells the user to press Accept, but the system does not create an Accept card at that moment.

The current flow has a contract mismatch:

```text
Mentor proposes a name and says “press Accept”
  -> backend still requires a later typed agreement
  -> no card is returned
  -> user has nothing to press
```

The name itself is valid and matches the current extraction rules. The failure is caused by the project trigger requiring all of these at once: a detected name, a minimum conversation depth, no active project spine, and agreement language in the current user message. On the naming turn, the current user message came before the mentor proposed the name, so it cannot be an acceptance of that proposal.

The page only renders the naming card when `projectCoherence.isCoherent` is returned. Therefore, when the trigger rejects the naming turn, the mentor’s plain-text invitation appears without its promised card.

## Changes

### 1. Make the mentor proposal itself trigger the naming card

Update the project detection in the mentor function so a valid, explicit project proposal immediately returns the project name and description for the naming card.

Recognize the established proposal format:

```text
What if this became…
👉 "Project Name"
...
If this feels right, press Accept.
```

This turn should not require prior user agreement. The card is where the user gives that agreement.

### 2. Keep the acceptance boundary clear

The naming card remains the commitment step:

- Mentor proposes the project.
- Naming card appears immediately beneath the proposal.
- User can edit the name, accept it, or keep exploring.
- Only acceptance creates the project.
- After creation, show the concise project-ready card.
- Its action opens `/project/:id` and the project structure.

No project will be created merely because the mentor proposed a name.

### 3. Preserve typed acceptance as a fallback

Keep support for users who type “yes,” “I love it,” or similar instead of pressing the card. That fallback will use the latest valid mentor proposal, but it will no longer be the primary or required route.

### 4. Apply one deterministic rule across all phases

Use the same proposal-to-card contract for DISCOVER, GROW, and BUILD, while preserving each phase’s mentor and project-structure logic. Remove phase/depth conditions that can suppress a valid explicit proposal after the required mentor conversation has already occurred.

The safeguard remains strict: only an explicit mentor naming format with a valid project name can trigger the card; ordinary brainstorming must not.

### 5. Prevent duplicate or lost cards

Add guards so repeated responses, double submissions, or reloads cannot create duplicate projects. Persist enough proposal state to restore the naming card if the conversation reloads before acceptance, and keep the existing restoration of an already-created project card.

### 6. Make failures visible and recoverable

If project setup fails after acceptance, keep the accepted proposal available and show a retry action rather than leaving the user in a dead end.

## Technical scope

- `supabase/functions/chat-mentor/index.ts`: separate **proposal detected** from **user accepted**, return project coherence immediately for explicit naming responses, and retain typed-agreement fallback.
- `src/pages/ConsoleThread.tsx`: render and restore the naming card deterministically, prevent duplicate acceptance, and retain retry state if creation fails.
- `src/components/FirstWinNamingCard.tsx`: add acceptance locking/retry behavior only if needed by the page-level implementation.
- `src/components/console-thread/ProjectCreationCard.tsx`: verify the created-project action consistently opens the project structure.

## Verification

Test the complete path for DISCOVER, GROW, and BUILD:

1. Finish council perspectives and enter the selected 1-to-1 mentor conversation.
2. Mentor proposes an explicit name using the `👉 "Name"` format.
3. Confirm the naming card appears immediately on the same turn.
4. Confirm **Keep exploring** does not create a project.
5. Confirm **Accept** creates exactly one project.
6. Confirm the project-ready card appears and opens the correct project structure.
7. Reload before acceptance and confirm the naming card is restored.
8. Reload after creation and confirm the project-ready card is restored.
9. Confirm typed acceptance still works as a fallback.
10. Confirm ordinary mentor brainstorming never triggers a project card.
