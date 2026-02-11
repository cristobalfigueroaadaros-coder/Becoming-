

# Life Domains Context + Convergence Enforcement + Authority Boundaries

## What Changes

Two edge functions get prompt updates. No UI changes. No database changes.

---

## 1. council-meeting/index.ts

### A. Fetch Life Domains (after line 394, alongside existing profile fetch)

Add a query to fetch `life_domains` for the user:
```
SELECT domain_name, current_score, future_score FROM life_domains WHERE user_id = ?
```

Format as context string and append to `fullUserContext` at line 608.

### B. Life Domains Usage Rule

Add to the council system prompt:
```
Life Domains are context only. Use them to personalize synthesis and prioritization.
Do not ask follow-up questions about Life Domains unless the user explicitly references them.
```

### C. Authority Boundary (line 742)

Replace the current PROJECT MODE instruction:

**Before:**
> "Push toward convergence: propose names, directions, or next steps."

**After:**
> "Narrow possibilities and prepare context for mentor handoff. You MUST NOT propose final project names, ask for commitment, or trigger project creation. Only the Creative Mentor or Strategist Mentor may name projects and ask for confirmation."

---

## 2. chat-mentor/index.ts

### A. Fetch Life Domains (inside entry state block, around line 2082)

Add a query to fetch `life_domains` and format as silent context appended to the PROJECT MODE prompt.

### B. Life Domains Usage Rule

Add the same instruction as council-meeting:
```
Life Domains are context only. Use them to personalize synthesis and prioritization.
Do not ask follow-up questions about Life Domains unless the user explicitly references them.
```

### C. Strengthen DISCOVER Block (lines 2092-2104)

Add to the existing DISCOVER synthesis instructions:
- "This is synthesis, not brainstorming."
- "One option is preferred if synthesis is strong. Never exceed three."
- "Each option must reference specific user details."

### D. BUILD Acceleration (lines 2120-2136)

Add to the existing BUILD block:
- "Do not dive into feature architecture. Feature depth belongs to Builders Team."
- "Converge faster: once stage and friction are known, propose milestone within 2-3 turns."

### E. Convergence Tightening (lines 2166-2188)

Add to the existing convergence rule:
- "Each question must reduce ambiguity. If a question does not reduce ambiguity, it must not be asked."
- "Do not add extra clarification after user confirms. Create project immediately."
- Turn limit guidance: DISCOVER/GROW 4-6 turns, BUILD 2-3 turns after stage identification.

---

## Files Modified

| File | Nature of Change |
|------|-----------------|
| `supabase/functions/council-meeting/index.ts` | Add life_domains fetch, usage rule, authority boundary |
| `supabase/functions/chat-mentor/index.ts` | Add life_domains fetch, usage rule, strengthen convergence + branch rules |

## What Does NOT Change

- No UI files touched
- No database migrations
- Life Domains onboarding page untouched
- Pattern Mode / Transmutation logic untouched
- Builders Team meeting logic untouched
- OnboardingStep2/3/4 untouched

