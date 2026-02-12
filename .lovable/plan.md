

# Project Council Introduction Page

## Overview

Insert a new static transitional page between the "One more thing" (Work Context) page and the existing Council Story page (GravityCouncilIntro). This page greets the user by name, explains their stage, shows their 7 auto-assembled mentors, and has a single "Next" button.

## Current Flow

```text
... -> Quest -> Work Context (/onboarding/work-context) -> Dashboard (redirects via OnboardingRouter to /gravity/transition -> /gravity/council-intro -> ...)
```

## New Flow

```text
... -> Quest -> Work Context -> NEW: Project Council Intro (/gravity/council-introduction) -> Council Story (/gravity/council-intro) -> Council Welcome -> First Project -> Dashboard
```

## Changes

### 1. Create New Page: `src/pages/ProjectCouncilIntroduction.tsx`

A static informational page with:

- **Dynamic greeting**: "Hello, {User Name}." fetched from the profiles table (`birth_name`)
- **Title**: "This is your Project Council."
- **Stage-aware description**: Reads `entry_state` from the profiles table and renders the appropriate paragraph (DISCOVER / GROW / BUILD)
- **Mentor roster**: Reads the 7 mentors from `user_mentors` table, displays each with name and a short role descriptor
- **Closing message**: "We are here to think with you, challenge you, and support you as you move forward. This is not random advice. This is about building something meaningful together."
- **CTA**: Single "Next" button that navigates to `/gravity/council-intro`

Mentor role descriptors (hardcoded map):

| Mentor ID | Short Descriptor |
|-----------|-----------------|
| strategist_mentor | Clarity and structured planning |
| creative_visionary | Imagination and expansion |
| business_mentor | Leverage and execution |
| problem_mentor | Clear problem definition |
| discipline_mentor | Focus and ownership |
| perspective_mentor | Systems thinking |
| challenger_mentor | Exposes blind spots |
| alignment_mentor | Values and direction alignment |
| design_thinking_mentor | Iterative experimentation |
| inner_clarity_mentor | Self-awareness and inner patterns |
| marketing_mentor | Positioning and reach |

### 2. Update Work Context Navigation

**File**: `src/pages/OnboardingWorkContext.tsx`

Change both `navigate("/dashboard")` calls (continue and skip) to `navigate("/gravity/council-introduction")`.

### 3. Add Route to App.tsx

**File**: `src/App.tsx`

Add a new protected route for `/gravity/council-introduction` pointing to the new `ProjectCouncilIntroduction` component, placed alongside the other gravity routes.

### 4. Update OnboardingRouter

**File**: `src/components/OnboardingRouter.tsx`

No changes needed. The router checks `council_introduction_completed` which is set by the existing GravityCouncilIntro page. The new page sits before that checkpoint and does not set any flags -- it is purely transitional.

## Files Summary

| File | Change |
|------|--------|
| `src/pages/ProjectCouncilIntroduction.tsx` | New file: static intro page |
| `src/pages/OnboardingWorkContext.tsx` | Change navigation target from `/dashboard` to `/gravity/council-introduction` |
| `src/App.tsx` | Add route for `/gravity/council-introduction` |

## What Does NOT Change

- OnboardingRouter logic
- Council interaction system
- Mentor handoff logic
- GravityCouncilIntro page (the story page)
- Database schema
- Edge functions
