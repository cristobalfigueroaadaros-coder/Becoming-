

## What's broken

The Business Mentor BUILD flow currently does this:

```text
Turn 1: Strong opener → proposes project name + 3-5 blocks (mentor-invented)
Turn 2: User says yes
Turn 3: Project triggers (or mentor over-asks and loses focus)
```

Two problems:
1. **Blocks are mentor-invented**, not co-created from the user's own strategic thinking
2. After confirmation, the mentor sometimes drills into execution instead of stopping → loss of focus, user drops off

## What you want (the corrected pattern)

```text
Turn 1: STRONG OPENER (keep exactly as-is)
        "Here's how I'd frame the next 30 days: '[Project Name]'.
         I'd break it into 3 blocks: [block 1] · [block 2] · [block 3].
         Does this match what you want to build?"

Turn 2: User confirms direction
        Mentor: "Fantastic. One question before we lock this in —
                 imagine the app is working perfectly and feedback is great.
                 What's the next move you'd want to focus on?"
        (ONE strategic forward-looking question — adapts to project)

Turn 3: User names next-step areas
        (e.g. "marketing, influencer outreach, content for social")

Turn 4: Mentor merges those into the block list and triggers project
        "Perfect. Locking this in: '[Project Name]' with [merged blocks].
         The structure is set."
        → project card appears → blocks include user's named areas
```

Hard cap: **4-5 turns max** before project trigger. After trigger: total stop, no execution coaching.

## Implementation

### 1. Rewrite the BUILD + business_mentor entry-state prompt (`supabase/functions/chat-mentor/index.ts`, lines 2743-2790)

Replace the current "propose name + blocks → confirm → done" flow with a 3-step structured arc:

```text
STEP 1 (opening message — UNCHANGED, the strong opener works):
   - Reflect what you heard (1 sentence)
   - Name the 30-day project in single quotes
   - Propose 3 starter blocks
   - Ask: "Does this match what you want to build?"

STEP 2 (after user confirms direction — NEW):
   - Acknowledge briefly: "Fantastic. Let's make this real."
   - Ask EXACTLY ONE forward-looking strategic question, adapted to their project. Examples:
     • App project → "Imagine the app is working perfectly and feedback is great. What's the next move?"
     • Service project → "Imagine your first 10 clients love it. What's the next move?"
     • Content project → "Imagine your first piece lands well. What's the next move?"
   - This question MUST surface the user's own strategic priorities (marketing, content, partnerships, hiring, etc.)
   - DO NOT ask anything else. ONE question only.

STEP 3 (after user lists their next-step areas):
   - Merge user's areas into 3-5 final blocks (combine with original starter blocks if helpful)
   - Re-state in EXACTLY this format:
     "Perfect. Here's the full play: '[Project Name]'.
      • [Block 1] — [one line]
      • [Block 2] — [one line]
      • [Block 3] — [one line]
      Locking this in."
   - The project name in single quotes triggers project creation
   - STOP. No more questions. The project card appears automatically.

ABSOLUTE BANS:
- More than 1 question per response
- Drilling into HOW to execute any block
- Continuing after the final structure is locked
```

### 2. Update convergence threshold

Currently `convergenceThreshold = 1` for BUILD + business_mentor (forces project trigger after 1 exchange). Change to `3` so the strategic forward-looking question fits naturally.

```ts
const convergenceThreshold = 
  (entryState === "BUILD" && mentorType === "business_mentor") ? 3 :
  // ...existing other conditions
```

`maxTurns` becomes `5` (3 + 2 buffer). Matches your requested "4-5 questions max."

### 3. Update the fast-path threshold (line 4099-4101)

Change BUILD + business_mentor fast-path from `1` to `3` so the project only triggers after the strategic question + user's blocks-input arrives:

```ts
const fastPathDepthThreshold =
  (entryState === "BUILD" && mentorType === "business_mentor") ? 3 :
  // ...
```

### 4. Inject user's named areas into the project blocks

When the project triggers, the user's "next-step areas" from Step 3 should become real blocks in `project_structure`, not just the mentor's original 3.

In the project-creation extraction logic, parse the final mentor message for the bullet list of blocks (after "Here's the full play"). Pass these as `initialBlocks` to the project-structure scaffolding so they appear in the Project Engine immediately.

This already partially works via `extract-project-structure` — we ensure it's invoked with the final mentor confirmation message (not the opener), so it captures the merged block list, not the starter list.

### 5. Reinforce the STOP rule (`business_mentor` system prompt, line 875-885)

Add one line: *"After Step 3 (locking the play), output ZERO questions. The project card auto-appears."*

## Files modified

- `supabase/functions/chat-mentor/index.ts` — entry-state prompt rewrite (lines 2743-2790), convergence threshold (line 2828), fast-path threshold (line 4099), business_mentor base prompt (line 875-885)

## Out of scope

- Not changing the opening message format (it's working — your direct quote confirms this)
- Not changing other mentors' BUILD flows (strategist_mentor stays at threshold 1)
- Not touching the project-card UI

