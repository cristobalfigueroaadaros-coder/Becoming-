
# Fix Plan: Mentor Visibility, Flow Logic, and UI Refinements

## Issues Summary

| # | Issue | Root Cause |
|---|-------|------------|
| 1 | Phoenix, Stoic, Storybreaker not in mentor picker | Not added to `OnboardingStep4.tsx` mentor list |
| 2 | Council → Strategist flow broken | Handoff navigation redirects to council instead of staying in chat |
| 3 | Keywords showing extra text | CreativeSpace shows description text under keywords |
| 4 | Pattern discovery too early | Council detects pattern on Q1 complete, not after mentor redirect |
| 5 | Pattern Map not auto-populated | Pattern created before extracting life event details |
| 6 | Transmutation Map CTA text | May be in node edit modal or other location |

---

## Fix 1: Add Transmutation Mentors to Onboarding Selection

**File:** `src/pages/OnboardingStep4.tsx`

Add 3 new mentors to the `mentors` array:

```typescript
// Transmutation Council
{
  id: "storybreaker_mentor",
  name: "The Storybreaker Mentor",
  description: "Cleans narrative, rewrites beliefs",
  icon: BookOpen, // or existing icon
  color: "bg-rose-600",
  category: "Transmutation",
},
{
  id: "phoenix_mentor",
  name: "The Phoenix Mentor",
  description: "Turns pain into power",
  icon: Flame,
  color: "bg-orange-500",
  category: "Transmutation",
},
{
  id: "stoic_mentor",
  name: "The Stoic Mentor",
  description: "Brings grounded action",
  icon: Scale,
  color: "bg-stone-600",
  category: "Transmutation",
},
```

Add "Transmutation" to the category render list with icon 🔥.

---

## Fix 2: Fix Council to Mentor Handoff Flow

**File:** `src/pages/Council.tsx`

The issue is in `handleSelectMentor` (lines 213-283). When creating a handoff and navigating with `replace: true`, the component re-renders but doesn't properly set the selected mentor view.

**Solution:** After navigation with handoff, ensure the URL params are updated correctly and don't trigger a second navigation:

```typescript
// In handleSelectMentor, after handoff creation:
if (handoff && !handoffError) {
  // Use setSearchParams FIRST to ensure view is set
  setSearchParams({ view: mentorType });
  // Then navigate with state (but not replace)
  navigate(`/council?view=${mentorType}`, { 
    state: { handoffId: handoff.id }
  });
  // ...
  return;
}
```

Alternatively, simplify by just setting search params and passing handoff context through state without using `replace: true`.

---

## Fix 3: Simplify Keyword Display in Creative Space

**File:** `src/components/creative-space/CreativeSpace.tsx`

Remove the description text under keywords. Change lines 228-251:

**Current:**
```tsx
{showKeywords && (
  <>
    <div className="flex flex-wrap gap-2 mt-2">
      {keywords.map(kw => (...))}
    </div>
    <p className="text-xs text-muted-foreground mt-2">
      Click keywords to add them as tiles you can move and connect
    </p>
  </>
)}
```

**Fix:** Remove the `<p>` description and simplify the header to just show "Your Keywords":

```tsx
<div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
  <Tag className="w-4 h-4" />
  <span>Your Keywords</span>
</div>
```

---

## Fix 4: Add "Read Full Insight" Option to InsightActionSheet

**File:** `src/components/InsightActionSheet.tsx`

Currently, insight text is truncated to 150 characters (line 193-195). Add a "Read more" toggle:

```typescript
const [showFullText, setShowFullText] = useState(false);
const isLong = insightText.length > 150;
const displayText = showFullText ? insightText : (isLong ? insightText.substring(0, 150) + '...' : insightText);

// In render:
<div className="p-3 rounded-lg bg-muted/50 border-l-4 border-accent text-sm text-muted-foreground italic">
  "{displayText}"
  {isLong && (
    <button 
      onClick={() => setShowFullText(!showFullText)}
      className="ml-2 text-primary hover:underline"
    >
      {showFullText ? "Show less" : "Read more"}
    </button>
  )}
</div>
```

---

## Fix 5: Delay Pattern Discovery Until After Mentor Redirect

**File:** `supabase/functions/inner-self-council/index.ts`

The issue is the `detectedPattern` is returned too early on Q1 complete. According to the PDR:

> "Pattern discovery should only happen after the user speaks with the council, gets redirected to the Inner Self Mentor (inner_clarity_mentor) for 1:1 exploration"

**Solution:** Remove pattern detection from Inner Self Council edge function. Pattern detection should happen in `chat-mentor` when `inner_clarity_mentor` is active and has the `life_event_exploration` context.

**Changes:**
1. In `inner-self-council/index.ts`: Remove the `detectedPattern` return. Only return `suggestMentorRedirect: true` after 2-3 exchanges.
2. In `InnerSelfCouncil.tsx`: Remove the pattern detection UI trigger from council responses. Only show pattern card after user returns from 1:1 mentor chat with extracted pattern data.

**File:** `supabase/functions/inner-self-council/index.ts`

Update the system prompt and response structure:
- Remove `detectedPattern` from the response JSON template
- Focus on suggesting redirect to inner_clarity_mentor after 2-3 exchanges
- The mentor handoff will carry the conversation context

**File:** `src/pages/InnerSelfCouncil.tsx`

Remove lines 154-157 (pattern detection on council complete):
```typescript
// REMOVE THIS:
// Check for detected pattern
if (data.detectedPattern) {
  setDetectedPattern(data.detectedPattern);
  setShowPatternCard(true);
}
```

Pattern card should only appear when user returns from 1:1 mentor session (tracked via navigation state or context).

---

## Fix 6: Ensure Pattern Map Auto-Population

**File:** `supabase/functions/chat-mentor/index.ts`

The `inner_clarity_mentor` Pattern Naming Mode already extracts structured data. Ensure the extraction includes all Pattern Map fields:

```typescript
// In PATTERN_READY extraction:
{
  "patternName": "...",
  "patternType": "...",
  // Pattern Map fields:
  "triggerEvent": "What triggers this pattern",
  "oldStory": "The narrative/belief behind it",
  "mentalLoop": "The repeating thought pattern",
  "cost": "What this pattern costs them",
  "protectiveRole": "Why this pattern exists (protection)",
  "lifeEvent": "The original life event"
}
```

**File:** `src/hooks/useInnerPatterns.tsx`

When `createPattern` is called with extracted data, ensure `life_events` field is populated:

```typescript
life_events: {
  trigger_event: extractedData.triggerEvent,
  old_story: extractedData.oldStory,
  mental_loop: extractedData.mentalLoop,
  cost: extractedData.cost,
  protective_role: extractedData.protectiveRole,
  life_event: extractedData.lifeEvent,
}
```

---

## Fix 7: Update Transmutation Node Edit Modal CTAs

**File:** `src/components/transmutation-map/TransmutationNodeEditModal.tsx`

If this modal still has "Talk to Transmutation Team", change to:
- White phase nodes: "Talk to Phoenix Mentor"
- Gold phase nodes: "Talk to Stoic Mentor"

Check the existing modal and update CTA text based on `phase` prop.

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/OnboardingStep4.tsx` | MODIFY | Add 3 Transmutation mentors to selection |
| `src/pages/Council.tsx` | MODIFY | Fix handoff navigation flow |
| `src/components/creative-space/CreativeSpace.tsx` | MODIFY | Simplify keyword display |
| `src/components/InsightActionSheet.tsx` | MODIFY | Add "Read more" toggle |
| `supabase/functions/inner-self-council/index.ts` | MODIFY | Remove early pattern detection |
| `src/pages/InnerSelfCouncil.tsx` | MODIFY | Remove pattern card from council response |
| `supabase/functions/chat-mentor/index.ts` | MODIFY | Ensure full Pattern Map extraction |
| `src/hooks/useInnerPatterns.tsx` | VERIFY | Pattern Map auto-population on create |
| `src/components/transmutation-map/TransmutationNodeEditModal.tsx` | MODIFY | Update CTA to mentor-specific text |

---

## Success Criteria

1. Phoenix, Stoic, and Storybreaker appear in "Choose Your Mentor Council" under "Transmutation" category
2. Clicking a mentor in Council sidebar opens 1:1 chat without redirecting back to council
3. Keywords in Creative Space show only the keyword name in green (no description text)
4. "Read more" option appears for long insights
5. Pattern discovery card only appears after redirect to Inner Clarity Mentor and 2-3 exchanges with extracted data
6. Pattern Map is auto-populated with life_events fields when pattern is created
7. Transmutation node modals show "Talk to Phoenix Mentor" for White phase, "Talk to Stoic Mentor" for Gold phase
