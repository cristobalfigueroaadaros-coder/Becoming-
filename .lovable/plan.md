
# Plan: Delete "Your Vision" from Onboarding + Update Phoenix Mentor Instructions

## Summary

This plan addresses two changes:
1. **Delete** the "Your Vision" / "Future Lifestyle" section from OnboardingStep1
2. **Replace** the Phoenix Mentor prompt with the comprehensive new instructions provided

---

## Part 1: Remove "Your Vision" from Onboarding Step 1

**File:** `src/pages/OnboardingStep1.tsx`

### What Will Be Removed

The following section (lines 236-261) contains "Your Vision" and "Future Lifestyle" fields:

```jsx
<div className="pt-4 border-t">
  <div className="mb-4">
    <h3 className="font-medium mb-1">Your Vision</h3>
    <p className="text-sm text-muted-foreground">
      Let's paint a light picture of where you're heading.
    </p>
  </div>
  
  <FormField
    control={form.control}
    name="future_lifestyle"
    render={...}
  />
</div>
```

### Changes

1. Remove the entire "Your Vision" section (lines 236-261)
2. Remove `future_lifestyle` from the form schema (line 24)
3. Remove `future_lifestyle` from default values (line 41)
4. Remove `future_lifestyle` from the database upsert (line 63)

The onboarding flow will now only collect:
- Birth name
- Birth date
- Birth location
- Birth time (optional)

---

## Part 2: Complete Phoenix Mentor Prompt Replacement

**File:** `supabase/functions/chat-mentor/index.ts`

### Current Phoenix Mentor (lines 1305-1364)

The current prompt focuses on:
- Extracting "practical learnings"
- Asking 6 specific questions in rotation
- 3-4 sentence responses
- Forbidden abstract concepts

### New Phoenix Mentor Philosophy

Based on the detailed instructions provided, the Phoenix Mentor needs to be:

| Aspect | Current | New |
|--------|---------|-----|
| Core Role | Extract practical learnings | Distillation and learning extraction stage |
| Focus | Surface "lessons, boundaries, wisdom, growth" | Detected PATTERN over surface story |
| Approach | Question rotation (6 questions) | Adapt to emotional weight (light vs. heavy) |
| Flow | 3-4 exchanges then summarize | Natural progression through Black → White → Gold |
| Trauma Handling | Brief acknowledgment, move to learning | Heavy trauma: prioritize safety, never force lessons |
| Output | User says "I learned X" | System auto-populates shift statements, lessons, insights |

### New Prompt Structure

The new Phoenix Mentor prompt will include:

1. **Role and Purpose** - Distillation and learning extraction stage
2. **Core Focus** - Pattern over surface story
3. **Emotional Posture** - Human, warm, empathetic, grounded
4. **Adaptation to Emotional Weight**:
   - Lighter situations: reframe, highlight effort, guide to learning
   - Heavy/traumatic situations: safety first, no forced lessons
5. **Distillation Flow** - Internal logic for every response
6. **Learning Extraction** - Learnings, values, strengths, sensitivities
7. **Phase Connection** - Black (awareness), White (distillation), Gold (integration)
8. **Auto-Population Logic** - Cards emerge naturally, not explicitly asked
9. **Conversation Style** - Guides reflection, never interrogates

### Key Behavioral Changes

**Forbidden (NEW):**
- Implying trauma was "good" or "necessary"
- Rushing reframing for heavy experiences
- Clinical or diagnostic language
- Explicitly asking to "unlock" or "complete" phases

**Required (NEW):**
- Reference the detected pattern (from transmutation context)
- Adapt tone based on emotional intensity
- Create conditions for insight (system auto-populates)
- Connect past experiences to future identity

---

## Part 3: Update Transmutation Handoff Opening

**Current Opening (White Phase):**
```
"${patternName}" — you named it. That takes guts.
Now let's extract the wisdom from it.
**What did you LEARN from this experience?** What's one thing you know now that you didn't know before?
```

**New Opening (aligned with philosophy):**
```
You've named what you're working through — "${patternName}".

That takes courage.

This isn't about finding silver linings or pretending it was "good."

It's about understanding what this experience shaped in you.

Looking back, what shifted? Was there a moment, a conversation, or a realization that changed how you saw this?
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/OnboardingStep1.tsx` | Remove "Your Vision" section, update schema/defaults |
| `supabase/functions/chat-mentor/index.ts` | Replace Phoenix Mentor prompt (lines 1305-1364) and update White phase handoff opening |

---

## Technical Details

### OnboardingStep1.tsx Changes

1. **Schema update** (line 24):
   - Remove: `future_lifestyle: z.string().optional()`

2. **Default values update** (line 41):
   - Remove: `future_lifestyle: ""`

3. **Database upsert** (line 63):
   - Remove: `future_lifestyle: data.future_lifestyle || null`

4. **Form UI** (lines 236-261):
   - Remove entire "Your Vision" div block

### chat-mentor/index.ts Changes

1. **Phoenix Mentor prompt** (lines 1305-1364):
   - Complete replacement with new comprehensive prompt

2. **Transmutation handoff** (lines ~1580-1604):
   - Update White phase opening to align with new philosophy
   - Ensure pattern name and shadow are referenced with appropriate tone

---

## Success Criteria

1. OnboardingStep1 no longer shows "Your Vision" or "Future Lifestyle" fields
2. Phoenix Mentor adapts tone based on emotional weight of the topic
3. Phoenix Mentor references the detected pattern naturally
4. Heavy trauma receives validation, not forced reframing
5. Cards/insights emerge through natural conversation, not explicit asks
6. The flow connects past experiences → present identity → future self
