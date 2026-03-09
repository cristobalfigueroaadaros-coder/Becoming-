

## Add Life Assessment Page with 1-10 Sliders

The `LifeDomainsRadar` component shows an empty "Complete Your Life Assessment" card with no way to actually do it. We'll create a dedicated assessment page and add a "Start" button to the empty state.

### Life Domains (standard set)
Based on the existing data usage across edge functions:
- Health & Fitness
- Career & Work
- Relationships & Love
- Financial & Wealth
- Personal Growth
- Fun & Recreation
- Physical Environment
- Spiritual & Purpose

### Changes

**1. New page: `src/pages/LifeAssessment.tsx`**
- Two-step flow: first rate **Current State** (1–10 sliders per domain), then **Future Vision** (1–10 sliders)
- Clean, professional card-based layout with domain icons
- Uses `@radix-ui/react-slider` (already installed)
- On submit: upserts all 8 domains into `life_domains` table, then navigates back
- Progress indicator (Step 1 of 2 / Step 2 of 2)

**2. Edit: `src/components/LifeDomainsRadar.tsx`**
- Add a "Start Assessment" button (with link to `/life-assessment`) in the empty state card

**3. Edit: `src/App.tsx`**
- Add route `/life-assessment` → `LifeAssessment` page (protected)

Three files total. No database changes needed — the `life_domains` table already has the right schema.

