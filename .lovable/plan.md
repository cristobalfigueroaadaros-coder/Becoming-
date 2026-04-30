# Loading Time Audit — Bcoming

## What's actually slow (and why)

I inspected the bundle, the landing page, the Council page, and the routing layer. Here's what's making things slow:

### 1. Landing page (bcoming.app) — heavy on first paint
- `public/hero-bg.mp4` = **1.6 MB**, `public/creators-bg.mp4` = **2.7 MB** → ~**4.3 MB of video** loaded on first visit.
- Hero video is also `<link rel="preload" as="video">` in `index.html`, forcing the browser to start downloading it before anything else, blocking the critical path.
- Both videos use `preload="auto"` (download the whole file immediately) instead of lazy-loading the second one.
- No poster image → the user sees a black box while the video downloads.

### 2. Initial JS bundle is massive
- `src/App.tsx` eagerly `import`s **60+ page components**. Every page (Council, CreationLab, MomentumDashboard, ProjectEngine, Pattern Map, Superpower Map, all the onboarding screens, etc.) ships in the **first JS chunk**, even when the user only needs the landing page.
- Heavy dependencies always loaded up-front: `recharts`, `jspdf` + `jspdf-autotable`, `@xyflow/react`, `react-simple-maps`, `@tsparticles/*`, `framer-motion`, `embla-carousel-react`, `canvas-confetti`, `dompurify`. Most are only used in 1–2 pages.
- `vite.config.ts` has **no manualChunks / code-splitting** config → one giant chunk.

### 3. Council "loading to mentor perspective" lag
- `src/pages/Council.tsx` synchronously imports `CouncilMeeting` (**1,081 lines**), `Chat`, `ConsoleThread`, and `BuilderTeamThread`. Switching mentors mounts the full conversation tree even before any data arrives.
- Mentor switch refetches last 50 messages + profile + user_mentors on every change instead of caching.
- The "Unmasked Practice Kit" structure block in `ProjectEngine` / design-thinking blocks renders the entire structure tree at once with framer-motion animations on every node.

### 4. Bottom-nav tab taps (Home / Atlas / Chats / Projects / Creators) feel slow
- Each tab routes to a page that does **multiple sequential** Supabase queries on mount (profile, atlas, dots, clusters, mentors, notifications, etc.). No parallelization, no `Promise.all`, no shared cache between tabs.
- `AtlasPage` does its own `supabase.auth.getUser()` + profile fetch + clusters + dots + opportunity detection + `useAtlasQuests`, all sequentially.

### 5. Misc
- `App.tsx` blocks the entire app behind `loading || !authReady` with just "Loading..." text — feels like a dead page for ~300–700ms.
- `<FloatingDots>` runs on most landing sections (5 instances, 20–45 dots each, 60fps animations) — minor CPU drain on slower devices.

---

## The Plan — what I'll change

### Phase A — Landing page speed (biggest win, fastest)
1. **Compress the videos** server-side and replace the originals:
   - hero-bg.mp4: re-encode to ~400–600 KB (h.264, CRF 30, 720p) and add a `.webm` AV1/VP9 sibling.
   - creators-bg.mp4: same treatment, target ~600–900 KB. Or replace with a static blurred image — it sits below the fold.
2. Remove `<link rel="preload" as="video" href="/hero-bg.mp4">` from `index.html`. It blocks LCP without helping (the `<video>` element triggers its own request).
3. Add a `poster` image (small JPEG) on the hero `<video>` so users see the scene immediately.
4. Change the second video (`creators-bg.mp4`) to `preload="none"` and only load it once it scrolls into view (IntersectionObserver) — or replace with a still frame.
5. Trim `<FloatingDots>` instances from 5 → 2, lower counts, and pause when off-screen.

### Phase B — Code-split the bundle (huge win for everyone past landing)
6. Convert every page import in `src/App.tsx` to `React.lazy(() => import(...))` and wrap `<Routes>` in `<Suspense fallback={...}>`. Landing page (`Index`) stays eager. Result: first load drops from one mega-chunk to ~10 small per-route chunks.
7. Add `manualChunks` in `vite.config.ts` to split heavy vendors into their own chunks so they're only fetched when needed:
   - `recharts` → its own chunk (only Momentum / Insights pages)
   - `jspdf` + `jspdf-autotable` → its own chunk (only export/report pages)
   - `@xyflow/react`, `react-simple-maps` → its own chunks
   - `@tsparticles/*` → its own chunk
   - `framer-motion` → shared chunk (used everywhere)
8. Lazy-load `CouncilMeeting`, `Chat`, `ConsoleThread`, `BuilderTeamThread` inside `Council.tsx` so switching mentors doesn't pay the cost of all four conversation engines up-front.

### Phase C — Faster perceived load on tab taps
9. Replace the "Loading..." text in `App.tsx` with a lightweight skeleton matching the page shell so taps feel instant.
10. In `AtlasPage` (and the same pattern in Council, Dashboard, CreationLab): batch the on-mount Supabase calls with `Promise.all` instead of awaiting them sequentially. Lift the `auth.getUser()` result into a tiny shared context so it isn't re-fetched on every navigation.
11. Bump react-query `staleTime` for atlas / profile / mentors to ~60 s so re-entering a tab uses cached data instantly while it revalidates in the background.

### Phase D — Council mentor-switch latency
12. When a mentor is selected, render the mentor header + skeleton **immediately**, then fetch messages in the background (today the page waits for the fetch before rendering anything).
13. Cache the last 50 messages per mentor in react-query keyed by `[mentorType, userId]` so re-opening the same mentor is instant.
14. Defer the heavy `mentorConfig` icon set and avoid recomputing `userMentors` ordering on every render (memoize).

### Phase E — "Unmasked Practice Kit" structure block (the section you flagged as slow)
15. Find the component rendering this 7-section structure (likely in `src/components/project-engine/` or `design-thinking-lab/`) and:
    - Replace per-node `framer-motion` mount animations with a single fade on the container.
    - Render the section list eagerly but lazy-mount the inner bullet trees only when a section is expanded.
    - Memoize the structure parser so it doesn't re-run on every keystroke / save.
16. If the slowness is the AI generation itself (not render), add an immediate skeleton with the section titles and stream the body in.

---

## Technical notes (for the build phase)

- Code-splitting pattern:
  ```tsx
  const Council = lazy(() => import("./pages/Council"));
  // ...
  <Suspense fallback={<PageSkeleton />}>
    <Routes>...</Routes>
  </Suspense>
  ```
- Vite manualChunks example:
  ```ts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          pdf: ["jspdf", "jspdf-autotable"],
          flow: ["@xyflow/react", "react-simple-maps"],
          particles: ["@tsparticles/engine", "@tsparticles/react", "@tsparticles/slim"],
        },
      },
    },
  }
  ```
- Video re-encode (run inside the build container, not committed manually):
  ```bash
  ffmpeg -i hero-bg.mp4 -vf scale=1280:-2 -c:v libx264 -crf 30 -preset slow -an hero-bg.mp4
  ffmpeg -i hero-bg.mp4 -c:v libvpx-vp9 -crf 35 -b:v 0 -an hero-bg.webm
  ```

## Expected impact (rough)

| Area | Before | After |
|---|---|---|
| Landing page initial transfer | ~5 MB | ~800 KB |
| Landing JS chunk | ~2–3 MB | ~400–600 KB |
| Time to interactive (landing) | 3–6 s | <1.5 s |
| Tab tap (Home/Atlas/Chats/Projects/Creators) | 800–1500 ms blank | <200 ms (skeleton instant) |
| Council mentor switch | 1–2 s blank | <300 ms (skeleton + cached) |

## What I will NOT change
- Visual design, copy, or any onboarding flow logic.
- Backend / edge function behavior (only cache durations on the client).
- Existing routing structure or auth flow.

Approve and I'll implement Phases A → E in that order, verifying each with the dev-server log and a quick browser check before moving on.