

# Fix: Every Mentor Response Must End With a Prompt or CTA

## Problem

The Phoenix Mentor (and potentially other mentors) sometimes end responses without a question or clear call-to-action, leaving the user stranded with no direction. Two specific cases:

1. **Opening message**: Phoenix acknowledges the pattern but doesn't always ask a clear engaging question
2. **Closing message**: Phoenix summarizes the learning but doesn't ask "Are you ready for the next step?" as required by its own rules

This is a prompt enforcement issue -- the rules exist but the AI doesn't consistently follow them.

## Changes

### 1. `supabase/functions/chat-mentor/index.ts` -- Strengthen HUMAN_CONVERSATION_RULES

In the `CLOSE LOOPS` section (around line 52), upgrade from suggestion to **mandatory rule**:

Current:
```
CLOSE LOOPS - End with:
- A question to go deeper, OR
- An action suggestion, OR
- An invitation to commit
```

Replace with:
```
MANDATORY CLOSING RULE (NEVER VIOLATE):
Every single response you send MUST end with exactly ONE of:
- A direct question to the user, OR
- A clear call-to-action (e.g., "Say 'let's go' when you're ready"), OR
- An invitation to commit or decide

If your response does not end with a question or CTA, it is INCOMPLETE.
NEVER end with a summary, reflection, or statement alone.
The last sentence of every message must invite the user to respond.
```

### 2. `supabase/functions/chat-mentor/index.ts` -- Reinforce Phoenix Closing

In the Phoenix mentor prompt (around line 1587), add explicit enforcement after the closing structure:

After the existing Step 5 ("Are you ready for the next step?"), add:

```
CRITICAL: If you reach the win condition and summarize the learning,
you MUST still end with "Are you ready for the next step?" or similar CTA.
A summary without a forward question is an INCOMPLETE response.
```

### 3. `supabase/functions/chat-mentor/index.ts` -- Reinforce Phoenix Mission Block

In the PHOENIX MISSION section (around line 2548-2553), update:

Current:
```
4. When complete, celebrate the reframe and guide toward Red Phase
```

Replace with:
```
4. When complete, celebrate the reframe, then ALWAYS ask: "Are you ready for the next step?" to guide toward Red Phase. NEVER end without this question.
```

## Impact

- All 19 mentors will be bound by the stronger closing rule in HUMAN_CONVERSATION_RULES
- Phoenix specifically gets double reinforcement in both its personality prompt and mission block
- No architecture changes, no UI changes -- purely prompt engineering
- The AI will be explicitly told that a response without a closing question/CTA is incomplete

