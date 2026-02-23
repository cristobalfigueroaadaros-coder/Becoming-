

# Fix: Reduce Questions + Fix Project Name Extraction

## Problem 1: Too Many Questions (5 turns instead of 2-3)

The BUILD acceleration block is being added to the prompt but isn't overriding the AI's behavior because it's buried after hundreds of lines of exploration instructions. The AI keeps asking follow-up questions at every turn.

**Fix:** Move the BUILD/GROW override to the TOP of the system prompt (right after the mentor identity), not the bottom. AI models weight earlier instructions more heavily. Also add an explicit "TURN COUNT" reminder that gets injected with the conversation depth.

### File: `supabase/functions/chat-mentor/index.ts`

**Change 1 — Move BUILD/GROW acceleration to top of strategist prompt**

Currently the acceleration blocks are appended after line ~784. Move them to be injected BEFORE the general `DISCOVERY_QUESTIONS` and `HUMAN_CONVERSATION_RULES` sections — specifically right after the strategist identity/persona block. This ensures the AI sees the execution constraints before any exploration instructions.

**Change 2 — Add turn-count pressure to each exchange**

After the convergence threshold check (line ~2314), inject an explicit turn reminder into the system prompt:

```
=== TURN STATUS ===
This is exchange ${conversationDepth} of ${convergenceThreshold + 2} maximum.
${conversationDepth >= convergenceThreshold + 1 ? 'YOU MUST propose a project name and milestone NOW. No more questions.' : ''}
=== END TURN STATUS ===
```

This gives the AI a concrete countdown, making it harder to ignore.

## Problem 2: "Client Results: Before" — False Name Extraction

The `titleCasePattern` regex matched a sentence fragment. The colon-subtitle pattern is too greedy.

**Fix (3 changes):**

**Change 3 — Add fragment words to blocklist in `isValidProjectName`**

Add these words to the invalid patterns check so names ending with common sentence fragments are rejected:

```typescript
// Block names that end with incomplete fragments
/\b(Before|After|About|Through|Between|During|Against|Beyond|Without)\s*$/i,
```

**Change 4 — Require minimum 3 words AFTER colon for subtitle pattern**

In the `titleCasePattern` regex, change the colon-subtitle part from:
```
(?::\s*[A-Z][a-z]+(?:\s+[A-Za-z]+)*)?
```
to:
```
(?::\s*[A-Z][a-z]+(?:\s+[A-Za-z]+){1,})?
```

This requires at least 2 words after the colon (e.g., "Project: Group Pilot" works, but "Results: Before" does not).

**Change 5 — Add "Before" and similar words to the invalid-start-after-colon check**

Add a post-extraction validation: if the name contains a colon, the part after the colon must be at least 2 words. Otherwise strip the colon portion and re-validate.

## Summary

| File | Change | Why |
|------|--------|-----|
| `chat-mentor/index.ts` | Move BUILD/GROW acceleration to top of strategist prompt | AI weights early instructions more heavily |
| `chat-mentor/index.ts` | Add turn-count pressure with explicit countdown | Makes convergence deadline impossible to ignore |
| `chat-mentor/index.ts` | Add fragment words (Before, After, About...) to name blocklist | Prevents false extractions from sentence fragments |
| `chat-mentor/index.ts` | Require 2+ words after colon in titleCase regex | Stops "Results: Before" from matching as a subtitle |
| `chat-mentor/index.ts` | Post-extraction colon validation | Strips invalid colon suffixes |

## Expected Outcome

- BUILD mode: Project proposal by turn 2-3 (under 5 minutes)
- No more false project names from sentence fragments
- Names like "4-Week Group Pilot" will be properly extracted when the AI proposes them (because the acceleration rules force the AI to propose a name earlier and more explicitly)

