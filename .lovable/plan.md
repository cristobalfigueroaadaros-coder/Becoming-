

# Creator Map — Implementation Plan

## Overview

Add a **Map** view to the Creators section, toggled via a `Wall | Map` switch below the header. The map shows creator pins on a stylized SVG world map, with tap-to-preview and tap-again-to-expand interactions.

## Approach

Use an **inline SVG world map** (simplified continent outlines) with absolutely-positioned creator dots — no external map library needed. This keeps it lightweight, fast, and visually consistent with the app's calm aesthetic.

Seed post locations are mapped to approximate `[x%, y%]` coordinates on the SVG viewport.

## Files to create/modify

| File | Change |
|------|--------|
| `src/pages/CreatorsWall.tsx` | Add `Wall \| Map` toggle state, conditionally render wall or map view |
| `src/components/creators/CreatorMap.tsx` | **New** — SVG world map with positioned pins, preview cards, expanded cards |
| `src/components/creators/CreatorMapPin.tsx` | **New** — Individual pin component with pulse animation |
| `src/components/creators/CreatorPreviewCard.tsx` | **New** — Lightweight popup on first tap (name, location, statement) |
| `src/components/creators/CreatorDetailCard.tsx` | **New** — Full card on second tap (goal, next step, resonance buttons) |

## Layout change in CreatorsWall

```text
Header + Mission + Counter
┌─────────────────────────┐
│   [ Wall ]  [ Map ]     │  ← new toggle
├─────────────────────────┤
│  activeView === "wall"  │  → current feed + composer
│  activeView === "map"   │  → CreatorMap component
└─────────────────────────┘
```

The toggle uses two simple buttons styled like tabs with `bg-primary` for the active state.

## CreatorMap component

- Renders a simplified SVG world map (continent paths as a static inline SVG, styled with `fill-muted stroke-border`)
- Overlays creator pins as absolutely-positioned dots using percentage coordinates
- Each seed post gets a hardcoded `{ x: number, y: number }` coordinate (e.g., Toronto → `{ x: 22, y: 32 }`, Berlin → `{ x: 51, y: 28 }`)
- Real DB posts with a `location` field also get approximate coordinates via a simple city-to-coordinate lookup map
- Pins have a subtle pulse animation and use the seed post's gradient color

## Pin interaction flow

1. **Tap pin** → small preview card appears near the pin (name, location, one-line statement)
2. **Tap preview card** → bottom sheet / modal with full creator detail (goal, next step, resonance buttons, Connect/Save actions)
3. **Tap elsewhere** → dismisses preview

## Clustering

For MVP: if pins overlap (within ~3% distance), show a cluster bubble with count. Tapping the cluster zooms the view (CSS transform scale) to spread them out.

## Filters (lightweight MVP)

A small horizontal scrollable row of filter chips above the map:
- **Category**: All, Family, Education, Healing, Community, Environment, Art, Tech for Good
- Filters seed posts by a new `category` field added to the `SeedPost` type

## Data additions

Add `coords` and `category` fields to each seed post in the `SEED_POSTS` array:

```typescript
{
  id: "seed-1",
  name: "James",
  location: "Toronto",
  coords: { x: 22, y: 32 },
  category: "family",
  // ...existing fields
}
```

## Design

- Map background: subtle dark/light themed SVG with soft continent fills
- Pins: 10px colored circles with glow matching the post gradient
- Preview card: floating card with `shadow-lg`, appears on tap
- Detail card: bottom drawer (using Vaul `Drawer`) with full post info + resonance buttons + Connect button
- Everything feels clean, minimal, calm, hopeful — no clutter

