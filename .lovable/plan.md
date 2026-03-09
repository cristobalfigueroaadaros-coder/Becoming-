

## Add Contextual Engagement Prompts to Creator Posts

A small, post-type-aware prompt line inserted between the resonance buttons and the expand/comments area in both `SeedPostCard.tsx` and `CreatorPostCard.tsx`.

### Prompt Map by Post Type

| Post Type | Prompt |
|---|---|
| `creating` | "Are you building something similar or able to help?" |
| `working_on_self` | "Leave a supportive message or share if this resonates." |
| `looking_for_help` | "Do you have an idea, contact, or skill that could support this?" |
| `offering_help` | "Could you or someone you know benefit from this?" |
| fallback | "Leave a supportive message or share if this resonates." |

### Implementation

Define a shared constant `ENGAGEMENT_PROMPTS: Record<string, string>` (can live in a small shared file or duplicated in both card components).

Render it as a single `<p>` with classes `text-[11px] text-muted-foreground/60 italic` — visually subtle, positioned:

- **`CreatorPostCard.tsx`**: After `<ResonanceButtons>` (line 88), before the expand button (line 91).
- **`SeedPostCard.tsx`**: After the resonance buttons section, before the comment toggle button.

### Files Changed

- `src/components/creators/CreatorPostCard.tsx` — add prompt line
- `src/components/creators/SeedPostCard.tsx` — add prompt line

Two small edits, no new files or database changes needed.

