

# Inner Self Console - Onboarding PDR Implementation

## Summary

This plan implements two distinct onboarding states for the Inner Self Console based on the user's transmutation history:

1. **State 1 (First Time User)** - Life Event Focus - Safe, inviting entry point
2. **State 2 (Returning User)** - Deeper Emotional Exploration - For users who have completed at least one transmutation cycle

---

## Part 1: Detecting User State

**Logic for determining which onboarding state to show:**

A user is considered a "Returning User" (State 2) if:
- They have at least one `inner_patterns` record with `status = 'transmuted'` OR `transformed_at IS NOT NULL`

Otherwise, they see State 1 (First Time User).

**Implementation:**
- Add a new state variable: `hasCompletedTransmutation`
- Query `inner_patterns` on mount to check for transmuted patterns
- Use this to conditionally render the appropriate onboarding copy

---

## Part 2: UI Changes - Council Introduction Card

**File:** `src/pages/InnerSelfCouncil.tsx`

### Current Introduction (Lines 368-401):

The current introduction card shows generic copy about the Inner Self Council. This will be replaced with state-aware onboarding.

### New State 1 Copy (First Time User):

```
Let's pause for a moment and look inward.

This is a safe space. You're in control of what you share.

To begin, think about a life event that challenged you, changed you, or marked a turning point for you.

It doesn't have to be dramatic or traumatic.
It could be a big decision, a transition, a failure, a loss, or a moment when life pushed you in a new direction.

Share what feels meaningful to you right now.
```

### New State 2 Copy (Returning User):

```
You've already worked through something important here.

If you feel ready, this space can hold something deeper this time.

You might choose a life moment that still carries emotional weight for you.
Something that shaped you in a lasting way.

Or, if that doesn't feel right today, you can share another meaningful experience instead.
You're always in control.
```

---

## Part 3: Placeholder Examples

### State 1 Placeholder (Lighter examples):

```
For example:
"I left my business and moved to another country."
"I ended a long relationship and had to rebuild myself."
"I failed at something I deeply cared about."
```

### State 2 Placeholder (Heavier examples):

```
For example:
"I was bullied for years and it affected how I see myself."
"One of my parents left when I was young."
"I lost someone important and never fully processed it."
```

---

## Part 4: Implementation Details

### New State Variable:

```typescript
const [hasCompletedTransmutation, setHasCompletedTransmutation] = useState(false);
const [isLoadingState, setIsLoadingState] = useState(true);
```

### Query on Mount:

```typescript
useEffect(() => {
  const checkTransmutationHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoadingState(false);
      return;
    }
    
    // Check for any completed transmutation cycles
    const { data: transmutedPatterns, error } = await supabase
      .from("inner_patterns")
      .select("id")
      .eq("user_id", user.id)
      .or("status.eq.transmuted,transformed_at.not.is.null")
      .limit(1);
    
    if (!error && transmutedPatterns && transmutedPatterns.length > 0) {
      setHasCompletedTransmutation(true);
    }
    
    setIsLoadingState(false);
  };
  
  checkTransmutationHistory();
}, []);
```

### Conditional Rendering in Introduction Card:

```tsx
{!hasActiveThread && stage === 'input' && !isLoadingState && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
      <CardContent className="pt-6 space-y-4">
        {/* Mentor icons row */}
        <div className="flex flex-wrap gap-4">
          {INNER_SELF_MENTORS.map((mentor) => (
            <div key={mentor} className="flex items-center gap-2">
              <span className="text-xl">{mentorIcons[mentor]}</span>
              <span className="text-sm font-medium">{mentorNames[mentor]}</span>
            </div>
          ))}
        </div>
        
        {/* State-aware onboarding copy */}
        {hasCompletedTransmutation ? (
          // STATE 2: Returning User
          <div className="space-y-3 pt-2">
            <p className="text-base font-medium text-foreground">
              You've already worked through something important here.
            </p>
            <p className="text-sm text-muted-foreground">
              If you feel ready, this space can hold something deeper this time.
            </p>
            <p className="text-sm text-muted-foreground">
              You might choose a life moment that still carries emotional weight for you.
              Something that shaped you in a lasting way.
            </p>
            <p className="text-sm text-muted-foreground">
              Or, if that doesn't feel right today, you can share another meaningful experience instead.
              <strong> You're always in control.</strong>
            </p>
          </div>
        ) : (
          // STATE 1: First Time User
          <div className="space-y-3 pt-2">
            <p className="text-base font-medium text-foreground">
              Let's pause for a moment and look inward.
            </p>
            <p className="text-sm text-muted-foreground">
              This is a safe space. You're in control of what you share.
            </p>
            <p className="text-sm text-muted-foreground">
              To begin, think about a life event that challenged you, changed you, or marked a turning point for you.
            </p>
            <p className="text-sm text-muted-foreground">
              It doesn't have to be dramatic or traumatic.
              It could be a big decision, a transition, a failure, a loss, or a moment when life pushed you in a new direction.
            </p>
            <p className="text-sm font-medium text-foreground">
              Share what feels meaningful to you right now.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
)}
```

### Conditional Placeholder in Textarea:

```tsx
<Textarea
  placeholder={hasActiveThread 
    ? "Continue exploring what you're feeling..." 
    : hasCompletedTransmutation
      ? `For example:\n"I was bullied for years and it affected how I see myself."\n"One of my parents left when I was young."\n"I lost someone important and never fully processed it."`
      : `For example:\n"I left my business and moved to another country."\n"I ended a long relationship and had to rebuild myself."\n"I failed at something I deeply cared about."`
  }
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  rows={5}
  disabled={loading || stage === 'complete' || stage === 'seeking_clarity'}
/>
```

---

## File Summary

| File | Changes |
|------|---------|
| `src/pages/InnerSelfCouncil.tsx` | Add state detection, conditional introduction copy, conditional placeholders |

---

## Design Principles Maintained

- Never ask directly for trauma
- Always invite, never demand
- Life events come first, patterns come later
- Depth is progressive, not forced
- User autonomy is always respected

---

## Flow Alignment

This implementation ensures the Inner Self Console properly feeds the system:

```
Life Event (captured here) → 
Pattern Detection (Black Phase via Inner Clarity Mentor) →
Understanding and Learning (Phoenix, White Phase) →
Integration and Superpowers (Stoic, Gold Phase)
```

The quality of what the user shares in this onboarding directly affects pattern clarity and the depth of transmutation downstream.

