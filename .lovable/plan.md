

# Fix: Superpowers, Mentor Buttons, and Win Cards

## Root Cause Analysis

There are TWO places where the Transmutation Map is rendered:
1. **`BecomingTransmutation.tsx`** (inside the Creation Lab) -- has all the fixes (mentor buttons, superpowers, win cards)
2. **`PatternMap.tsx`** (standalone page) -- is MISSING all of these features

The user is likely interacting via `PatternMap.tsx`, which was never updated with the new logic. This explains all three broken behaviors.

---

## Fix 1: Add Mentor Button to PatternMap.tsx TransmutationNodeEditModal

**File**: `src/pages/PatternMap.tsx`

The `TransmutationNodeEditModal` at line 482-491 does NOT pass `onNavigateToMentor`. Add the prop so the "Talk to Phoenix Mentor" / "Talk to Stoic Mentor" button appears.

This requires adding a `navigateToMentorWithHandoff` function to PatternMap.tsx (similar to the one in BecomingTransmutation.tsx) that creates a handoff record and navigates to the mentor chat.

---

## Fix 2: Add Superpower Extraction to PatternMap.tsx Gold Completion

**File**: `src/pages/PatternMap.tsx`

The `handleTransmutationNodeSave` (line 152-180) completes the gold phase but never calls `extractSuperpowers`. The `TransmutationCelebration` at line 521-528 is rendered without `superpowers` or `goldenSummary` props.

Changes:
- Import and use `useSuperpowers` hook
- Call `extractSuperpowers` when gold phase completes
- Pass `superpowers` and `goldenSummary` to the `TransmutationCelebration` component
- Generate the golden summary using `generateGoldenSummary` before saving

---

## Fix 3: Add White Phase Win Card to PatternMap.tsx

**File**: `src/pages/PatternMap.tsx`

Currently, completing the white phase in PatternMap just shows a toast. Add:
- Import `WhitePhaseWinCard`
- Track `showWhiteWinCard` state
- Detect white phase completion in `handleTransmutationNodeSave` and show the win card
- On confirm, set `phase_completed: 'white'` and unlock Gold

---

## Fix 4: Add Superpower Map Navigation After Celebration

**File**: `src/pages/PatternMap.tsx`

After the gold celebration is dismissed ("Save Gold Insight"), optionally navigate to the Superpower Map so the user can see their new badges.

---

## Fix 5: Handle Return from Mentor Chat in PatternMap.tsx

**File**: `src/pages/PatternMap.tsx`

Add the same `useEffect` for detecting `location.state?.transmutationComplete` that exists in `BecomingTransmutation.tsx`, so when a user finishes with Phoenix/Stoic and returns, the data is merged and the win card triggers.

---

## Technical Details

### navigateToMentorWithHandoff function (PatternMap.tsx)
```typescript
const navigateToMentorWithHandoff = async (mentorType: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !pattern) return;

  const { data: recentMessages } = await supabase
    .from("chats")
    .select("role, content, mentor_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const phase = whiteComplete ? 'gold' : 'white';
  const transmutationContext = {
    phase,
    patternId: pattern.id,
    patternName: pattern.pattern_name,
    shadow: transmutationData.shadow || pattern.pattern_description,
    existingTransmutationData: transmutationData,
  };

  const { data: handoff } = await supabase
    .from("conversation_handoffs")
    .insert({
      user_id: user.id,
      source_mentor_type: "transmutation_map",
      target_mentor_type: mentorType,
      source_messages: recentMessages?.reverse() || [],
      journey_topic: `Transmutation ${phase} Phase: ${pattern.pattern_name}`,
      voice_context: transmutationContext,
      processed: false,
    })
    .select()
    .single();

  if (handoff) {
    navigate(`/council?view=${mentorType}`, {
      state: { handoffId: handoff.id, transmutationContext }
    });
  }
};
```

### Updated TransmutationNodeEditModal in PatternMap.tsx
```tsx
<TransmutationNodeEditModal
  ...existing props...
  onNavigateToMentor={navigateToMentorWithHandoff}  // ADD THIS
/>
```

### Updated TransmutationCelebration in PatternMap.tsx
```tsx
<TransmutationCelebration
  ...existing props...
  goldenSummary={transmutationData.golden_summary || ''}
  superpowers={celebrationSuperpowers}  // ADD THIS
/>
```

---

## Files Summary

| File | Change |
|------|--------|
| `src/pages/PatternMap.tsx` | Add mentor handoff, superpower extraction, white win card, golden summary, return-from-mentor detection |

Only one file needs changes since all the component infrastructure already exists.

