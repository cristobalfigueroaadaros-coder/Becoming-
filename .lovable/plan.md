

# Fix: Double Handoff Processing + Birth City Selector

## Issue 1: Strategist Mentor Loses Context (Handoff Fires Twice)

### Root Cause

When the Council navigates from the Project Council to a 1-to-1 mentor (e.g., `/council?view=strategist_mentor`), the Chat component **mounts twice** due to React re-rendering when switching from `CouncilMeetingPage` to `ChatPage`. Each mount resets `isHandoffProcessed` to `false`.

The sequence:
1. First mount: `processHandoff` fires, sends `__HANDOFF_INIT__` with handoffId -- gets correct contextual response
2. First call marks the handoff record as `processed: true` in the database
3. Component remounts (React key change), `isHandoffProcessed` resets to `false`
4. Second mount: `processHandoff` fires again with the **same handoffId**
5. Edge function queries `processed: false` -- finds **nothing** (already marked processed)
6. Without handoff context, the AI generates a generic "Welcome, could you bring me up to speed?" message
7. This generic message **overwrites** the good contextual one in the UI

### Fix

**File: `src/pages/Chat.tsx`**

Add a guard using a `useRef` to track processed handoff IDs that survives re-renders but not full unmount cycles. Also check the database to see if the handoff is already processed before invoking the edge function.

Specifically:
- Add a `processedHandoffIds` ref (`useRef<Set<string>>`) that persists across re-renders
- In `processHandoff`, check if the handoffId is already in the set before proceeding
- Add the handoffId to the set immediately before making the API call
- Also query the handoff record first to verify `processed: false` before invoking the edge function

This prevents the second call entirely without affecting the first.

## Issue 2: Birth City Should Be a Searchable Selector

### Current State

The birth city field is a plain text input. The user wants it to be selectable like the country field.

### Fix

**File: `src/pages/OnboardingStep1.tsx`**

Convert the city input to a searchable combobox (same pattern as country) with a curated list of major cities per country. Since a complete city database would require an external API, we'll use a curated list of ~500 major world cities grouped by country, and keep a "type to search" input that also allows custom entry (the user can type a city not in the list).

**File: `src/data/cities.ts`** (new file)

Create a data file with major cities organized by country code/name, covering the most common birth locations. The combobox will filter cities based on the selected country, and still allow free-text entry for cities not in the list.

Approach:
- Add a `cityOpen` state for the popover
- Use `Command` with `CommandInput` for search
- Filter cities by selected country
- Include a "Use custom city" option at the bottom so users can still type any city
- When country changes, reset city selection

## Summary

| File | Change | Why |
|------|--------|-----|
| `src/pages/Chat.tsx` | Add `useRef` guard + DB check to prevent double handoff processing | Stops the second call that generates a generic welcome and overwrites the contextual one |
| `src/pages/OnboardingStep1.tsx` | Convert city input to searchable combobox with custom entry fallback | Makes city selectable while still allowing unlisted cities |
| `src/data/cities.ts` (new) | Curated list of major cities grouped by country | Data source for the city combobox |

