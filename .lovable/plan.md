
## Two Changes Needed

### 1. Reorder the page: Feed first, then "Share" prompt at the bottom

Currently: Header → CreatePostForm → Feed  
New order: Header → Feed (with seed posts) → Sticky/bottom "Share" CTA that appears after scrolling

**UX flow:**
- User lands → sees the counter, mission, and immediately starts scrolling posts
- After scrolling through a few posts (or at bottom of feed), a CTA appears: "What are you creating for a better world?" with a button to expand the form
- The `CreatePostForm` stays hidden until the user taps "Share your creation" at the bottom

### 2. Add 10 seed posts with AI-generated images

The 10 example posts need to be injected as static "seed" data shown alongside real DB posts. Since we can't write to DB directly, we'll render them as **static mock posts** in the UI — displayed exactly like real posts but hardcoded, with AI-generated images from the Lovable AI image endpoint.

**Approach:** 
- Create a `SEED_POSTS` constant array in `CreatorsWall.tsx` with the 10 posts
- Each seed post gets a matching thematic image (generated via AI image generation at build time — we'll use placeholder gradient images with emoji covers per topic as a reliable fallback since AI image generation happens at runtime in edge functions, not at component render time)
- Actually: use **themed gradient placeholder images** via CSS (styled divs) for the 10 seed posts — each with unique gradient + icon/emoji, clean and fast
- Seed posts show at the TOP of the feed, real user posts show after them

**Seed post images — themed CSS gradients (no network dependency):**
1. Podcast → warm orange gradient + 🎙️
2. Garden → green gradient + 🌱
3. Men's Circle → deep blue + 🤝
4. Ocean Cleanup → cyan/teal + 🌊
5. Meditation Teens → lavender + 🧘
6. Emotional Intelligence Kids → yellow/pink + 🎮
7. Farming → earthy green + 🌾
8. Art Healing → purple/rose + 🎨
9. Kindness → warm amber + 💛
10. Startup Accelerator → indigo + 🚀

**Seed post cards** use the exact same `CreatorPostCard` structure but with `isSeed: true` — no resonance interaction (or dummy counts), no expand/collapse needed for MVP.

Actually, simpler: render seed posts EXACTLY like real posts using a `SeedPostCard` that mirrors `CreatorPostCard` but with static resonance counts and a themed image div instead of `<img>`.

### Files to modify

| File | Change |
|------|--------|
| `src/pages/CreatorsWall.tsx` | Reorder layout (feed first, share CTA at bottom), add seed posts array |
| `src/components/creators/SeedPostCard.tsx` | New — static post card for seed data with themed image |

### Layout structure (new)

```
┌─────────────────────────┐
│  Header + Counter       │ ← stays at top
│  Mission statement      │
├─────────────────────────┤
│  Seed Post 1 (Podcast)  │ ← users see the wall immediately
│  Seed Post 2 (Garden)   │
│  ...10 seed posts...    │
│  Real user posts...     │
├─────────────────────────┤
│  "Share your creation"  │ ← appears at bottom, tapping expands form
│  [CreatePostForm]       │
│  (collapsed by default) │
└─────────────────────────┘
```

The "Share" section at the bottom uses a chevron-expand pattern: a prominent card saying "What are you creating for a better world?" with a `+` button. Tapping reveals the full `CreatePostForm`.
