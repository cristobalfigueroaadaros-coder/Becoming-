

# Fix: Superpowers Not Showing -- Root Cause Found

## The Actual Problem

The `extract-superpowers` edge function uses the **wrong AI gateway**. Every other edge function in this project calls `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`, but `extract-superpowers` calls `https://api.openai.com/v1/chat/completions` with the `chatgpt` secret.

The OpenAI call fails silently (likely invalid/expired key), returning no AI response. The code then falls back to `content = "[]"` (empty array), so **zero superpowers are extracted and zero are stored**. The Superpower Map page then correctly loads from the database -- which is empty.

**Evidence from network logs:**
- POST to `extract-superpowers` returned status 200
- Response body: `{"superpowers":[]}`
- The transmutation data was sent correctly (pattern, emotion, gold insight, brave step all present)

## The Fix

**File: `supabase/functions/extract-superpowers/index.ts`**

1. Replace the OpenAI API call with the Lovable AI gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`)
2. Replace `Deno.env.get("chatgpt")` with `Deno.env.get("LOVABLE_API_KEY")`
3. Change model from `gpt-4o-mini` to `google/gemini-2.5-flash` (consistent with other functions)
4. Add console logging for the AI response so failures are visible in logs
5. Improve the fallback: if parsing fails OR returns empty, generate a guaranteed default superpower based on the transmutation data rather than returning empty

## Technical Details

```text
BEFORE (broken):
  API Key:  Deno.env.get("chatgpt")          --> likely invalid
  Endpoint: api.openai.com/v1/chat/completions
  Model:    gpt-4o-mini
  Fallback: content = "[]" --> empty array --> nothing saved

AFTER (fixed):
  API Key:  Deno.env.get("LOVABLE_API_KEY")   --> auto-configured
  Endpoint: ai.gateway.lovable.dev/v1/chat/completions
  Model:    google/gemini-2.5-flash
  Fallback: if empty, generate default superpower from pattern name
```

### Changes in the edge function

- Line 55-61: Replace `chatgpt` key check with `LOVABLE_API_KEY`
- Line 121-132: Change fetch URL, auth header, and model
- Line 135-161: Add logging and improve empty-result fallback
- Add a guaranteed fallback: if AI returns empty or parsing fails, create one "Identity Upgrade" superpower derived from the pattern name

Only one file needs to change: `supabase/functions/extract-superpowers/index.ts`

