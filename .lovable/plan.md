

# Becoming Guide — Floating Knowledge Hub

## Overview
Create a floating "Becoming Guide" button and a Sheet panel that serves as an in-app reference manual. The guide contains expandable sections explaining the system's philosophy, tools, and workflow with a dynamic "Start Here" section.

## Architecture

### New Files
- `src/components/BecomingGuide.tsx` — Main component with floating button + Sheet panel

### Modified Files
- `src/components/layout/AppLayout.tsx` — Add `<BecomingGuide />` inside the layout

## Component Design

### Floating Button
- Fixed position: `bottom-24 right-4` (above bottom nav)
- Small pill button with `BookOpen` icon + "Guide" label
- Uses `Sheet` component (side="right") to open the panel

### Sheet Panel Content

**Header**: "Becoming Guide" title with a short welcome line

**"Start Here" section** (always visible at top, not collapsible):
- Dynamically checks user state via existing hooks (`useIntegratorProjects`)
- No project → "Share an idea with the Council" → links to `/council`
- Has project → "Continue building" → links to `/creation-lab`
- Highlight box: "You do not need to understand everything before starting. Just share an idea with the Council and begin."

**Accordion sections** (using existing `Accordion` component):

1. **Foundation** (icon: `Compass`)
   - "What is Becoming" — 4-5 lines from PDR
   - "Message from the Founder" — Cristobal's message
   - "Example Journey" — The flow steps
   - "The Becoming Loop" — Insight → Build → Test → Learn cycle

2. **Creation Lab** (icon: `FlaskConical`)
   - Sub-items: Project, Daily Goals, Design Thinking, Creative Space, Map, Purpose to Value
   - Each with 3-4 line explanation from PDR

3. **Becoming Path** (icon: `Sparkles`)
   - Sub-items: Becoming Exercises, Pattern Discovery, Transmutation, Superpowers

4. **Council** (icon: `Users`)
   - Council explanation + Save Button explanation

5. **Momentum** (icon: `TrendingUp`)
   - Weekly Sprint, Accumulated Work, Capabilities

### Implementation Details
- Each section uses nested `Accordion` for sub-topics
- Important callouts use a styled div with `bg-primary/10 border-l-2 border-primary` 
- All text comes from the PDR content (hardcoded strings, no DB needed)
- Sheet can be closed instantly via X or overlay click
- No localStorage tracking needed — this is always available

### Visual Examples Placeholder
The PDR requests before/after screenshots for each major section. Since we don't have these images yet, each section will include a subtle placeholder note: "Visual examples coming soon" that can be replaced with actual images later.

## Files Summary

| File | Change |
|------|--------|
| `src/components/BecomingGuide.tsx` | New — floating button + Sheet with all guide content |
| `src/components/layout/AppLayout.tsx` | Add `<BecomingGuide />` alongside `<BottomNavigation />` |

