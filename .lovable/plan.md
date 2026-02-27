

# Console Thread: Flow Fixes, Save Button, Intake UX, Entry-State Routing

## Issues Found

### 1. Save button outside bubble
`ChatBubble.tsx` renders `InsightActionButton` after the bubble div. Move it inside the bubble div, bottom-right aligned.

### 2. "Assembling your council" appears before 5 questions
The OnboardingRouter sends users to dashboard after birth_name entry. The console thread starts the 3 intake questions. But the user sees "Processing your answers... Let me assemble your Council" right after intake Q3. This is correct flow — the issue is that onboarding quest (5 questions) data isn't being loaded and passed to the council. The entry_state and quest answers need to be fetched and included in the context sent to council-meeting.

### 3. Q2 needs more conversational prompts
The second intake question ("Tell me about your story — who are you becoming?") is too vague. Add suggestions: dreams, struggles, what excites you, what keeps you up at night.

### 4. Council assembly text should be personalized
After intake Q3, before showing the council reveal card, add a personalized message that connects the user's entry_state and answers to WHY this specific council was assembled.

### 5. FLOW BROKEN: No follow-up question after perspectives
**Root cause**: `conversationHistory` passed to `council-meeting` contains all thread messages (user intake answers + mentor messages). The edge function counts user messages to get `questionNumber`. With 3 intake answers in history, `questionNumber = 4`, making `isQ1 = false`. Since `suggestedNextQuestion` is ONLY generated when `isQ1` (line 1244), no follow-up question is returned.
**Fix**: Pass `conversationHistory: []` for the first council call (it's the first council round, not a continuation). Or add a `isFirstCouncilRound: true` flag.

### 6. Handoff suggests alignment_mentor instead of entry-state-based mentor
**Root cause**: The mentor routing prompt (line 1468-1498) doesn't receive `entryState`. It freely picks any mentor.
**Fix**: Pass `entryState` to edge function. In the routing logic, enforce:
- DISCOVER → `creative_visionary`
- BUILD → `strategist_mentor`
- GROW → `creative_visionary` or `strategist_mentor`

### 7. handleUserReply skips 2nd round perspectives
After user replies to the follow-up question, `handleUserReply` calls council-meeting again. But if `handoffMentor` is already set (from the first call via `data.suggestedMentorFor1to1`), it immediately offers handoff without running a 2nd council round.
**Fix**: Don't set `handoffMentor` from the first council call. Only set it from the 2nd call (user_reply phase).

## Changes

### `src/components/console-thread/ChatBubble.tsx`
- Move `InsightActionButton` inside the bubble div (after the text, before closing the bubble container)
- Style it as a small icon button at bottom-right of the bubble

### `src/pages/ConsoleThread.tsx`
- **Q2 text**: Update intake Q2 to include prompts: "Tell me a bit about your story — your dreams, your struggles, what excites you, what keeps you up at night"
- **Council assembly text**: After processing intake, fetch entry_state and generate a personalized "Because you're exploring/building/growing..." message before the council reveal card
- **First council call**: Pass `conversationHistory: []` (empty) to ensure edge function treats it as Q1 and generates `suggestedNextQuestion`
- **Don't set handoffMentor from first council call**: Remove line 388-390 from `runCouncilMeeting`. Only set `handoffMentor` from `handleUserReply`'s response
- **Pass entryState to council-meeting**: Add `entryState` to the body of both council-meeting invocations
- **Fetch onboarding quest answers**: Load onboarding quest answers from DB and include them in the `fullIntakeContext`

### `supabase/functions/council-meeting/index.ts`
- Accept `entryState` parameter from request body
- In mentor routing (line 1468), use `entryState` to enforce:
  - DISCOVER → `creative_visionary`
  - BUILD → `strategist_mentor`
  - GROW → pick based on conversation analysis but limited to `creative_visionary` or `strategist_mentor`
- Ensure `suggestedNextQuestion` is generated when `isQ1` by making the incoming `conversationHistory` empty for first council round

## Correct Flow After Fix
1. Intake Q1: "What's your work experience?"
2. Intake Q2: "Tell me about your story — dreams, struggles, what excites you..."
3. Intake Q3: "What have you been working on or thinking about building?"
4. Personalized council assembly message → Council Reveal Card
5. Perspectives (mentor statements, no questions)
6. Banter (WhatsApp zig-zag)
7. **Follow-up question from Future Self** (guaranteed because conversationHistory=[] → Q1)
8. User replies
9. 2nd round perspectives
10. 1-to-1 mentor suggestion (entry-state aware: DISCOVER→Creative Visionary, BUILD→Strategist)
11. Mentor 1-to-1 conversation
12. Project suggestion → Project created

## Files

| File | Change |
|------|--------|
| `src/components/console-thread/ChatBubble.tsx` | Save button inside bubble |
| `src/pages/ConsoleThread.tsx` | Q2 text, personalized assembly, empty conversationHistory for first call, defer handoffMentor, pass entryState |
| `supabase/functions/council-meeting/index.ts` | Accept entryState, enforce entry-state-based mentor routing |

