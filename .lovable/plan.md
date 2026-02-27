

# Fix: Remove "Assembling Council" Message + Fix Edge Function Crash

## Root Cause of Broken Flow

The `council-meeting` edge function **crashes on startup** because line 643 declares `const entryState` which conflicts with the `entryState` already destructured from the request body at line 419. In Deno (strict ES modules), this causes a runtime error, which is why the function returns "Failed to fetch" and "Council meeting failed" appears.

## Changes

### 1. `supabase/functions/council-meeting/index.ts`
- **Line 643**: Rename the shadowing variable from `const entryState` to `const profileEntryState` (or simply use the `entryState` from the request body, falling back to profile). Replace:
  ```typescript
  const entryState = (profile as any)?.entry_state || null;
  ```
  with:
  ```typescript
  const resolvedEntryState = entryState || (profile as any)?.entry_state || null;
  ```
  Then update all references in lines 645-680 and 1486-1489 to use `resolvedEntryState`.

### 2. `src/pages/ConsoleThread.tsx`
- **Line 258-259**: Remove the "Processing your answers... Let me assemble your Council" message. The flow should go directly from intake Q3 answer to the personalized council assembly message (line 274) without the intermediate "processing" text.

## Expected Result
- No more "assembling council" message after intake Q3
- Edge function stops crashing, so perspectives, banter, and follow-up question all appear after council acceptance

