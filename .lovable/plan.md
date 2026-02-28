

# Fix: Banter Identity, Pacing, Project Name, Timeframe Flow, Future Self Guidance

## Issues Found

### 1. Banter bubbles have no mentor name/color
**Root cause**: Edge function (`council-meeting/index.ts` line 1201) pushes `mentor: mentorName` (display name like "Strategist Mentor") into `banterLines`. But `ConsoleThread.tsx` line 371 passes `line.mentor` to `addSystemMessage` as `mentorType`, which expects a key like `strategist_mentor`. The config lookup fails silently, so no name/color is attached.
**Fix**: Edge function should push `mentor: mentorKey` (the internal key) instead of `mentorName`. Keep `mentorName` as a separate field for reference.

### 2. Banter tone not human enough
**Fix**: Update the banter prompt in the edge function to instruct mentors to talk about the user in third person — discussing their abilities, dreams, challenging them ("Do you think they can pull this off?"), while another defends ("We'll be there to push them"). Make it feel like mentors talking in the back room about the user, supportively.

### 3. Perspectives and banter sent too fast
**Fix**: Increase typing delays:
- Perspectives: `showTyping(mentorType, 3000 + Math.random() * 2000)` (~3-5s each)
- Banter: `showTyping(line.mentor, 2500 + Math.random() * 2500)` (~2.5-5s each)
- 2nd round perspectives: `showTyping(mentorType, 2000 + Math.random() * 1500)` (~2-3.5s each)

### 4. "Project Name" shown in FirstWinNamingCard
**Root cause**: The AI in `chat-mentor` sometimes returns a literal "Project Name" as the project name. 
**Fix**: In `ConsoleThread.tsx`, before passing to `FirstWinNamingCard`, validate that `projectName` is not a generic placeholder. If it is, fall back to a name derived from the user's project idea (intake Q3).

### 5. Timeframe selection doesn't create project
**Root cause**: The `CreationLab` project setup flow works correctly — `handleCreateProject` calls `integrator-setup`. The issue is likely that when navigating from ConsoleThread, the `first_project_id` is not set (we removed it in the last diff), so the system may not recognize the project afterward.
**Fix**: In `CreationLab.handleCreateProject`, after successful creation, also update `first_project_id` in the profile with the new project ID.

### 6. Future Self needs more guidance context
**Fix**: 
- **Q1 intro**: Add "I'm going to ask you a few questions so I can recommend a customized team of mentors based on your journey."
- **Post-council message**: Add "Now you're going to interact with your mentor council. They'll help you define a project to work on. Write 'let's go' when you're ready."

## Changes

### `supabase/functions/council-meeting/index.ts`
- **Line 1201**: Change `mentor: mentorName` to `mentor: mentorKey` so the frontend can look up config
- **Banter prompt**: Update to instruct mentors to talk about the user in third person — discussing abilities, dreams, challenging and supporting

### `src/pages/ConsoleThread.tsx`
- **Line 49**: Update Q1 intro to include guidance about what's coming
- **Lines 359-361**: Increase perspective typing delay to ~3-5s
- **Lines 369-371**: Increase banter typing delay to ~2.5-5s
- **Lines 424-426**: Increase 2nd round perspective delay to ~2-3.5s
- **Lines 430-432**: Increase 2nd round banter delay to ~2.5-5s
- **handleCouncilAccept (line 326-330)**: Add a "let's go" prompt from Future Self after council is accepted, before running council meeting
- **Lines 441-450**: Add validation for project name — if it's generic ("Project Name", "Untitled", etc.), derive from intake Q3
- **handleFirstWinAccept**: No change needed — CreationLab handles project creation

### `src/pages/CreationLab.tsx`
- **handleCreateProject (~line 178)**: After successful `integrator-setup`, update profile with `first_project_id` from the returned data

## Files

| File | Change |
|------|--------|
| `supabase/functions/council-meeting/index.ts` | Fix banter mentor key, update banter prompt for human tone |
| `src/pages/ConsoleThread.tsx` | Pacing delays, Future Self guidance text, project name validation |
| `src/pages/CreationLab.tsx` | Set `first_project_id` after project creation |

