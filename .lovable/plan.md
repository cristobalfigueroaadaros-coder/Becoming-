

# Creators Wall — Full Implementation Plan

## Overview
A new "Creators" section added to the bottom navigation between Home and Council. It serves as the community entry layer where users share what they're creating, follow each other's journeys, and connect through meaningful resonance reactions.

## Database Tables (Migration)

### `creator_posts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK profiles | |
| statement | text NOT NULL | Main "what are you creating" |
| post_type | text NOT NULL | `creating`, `working_on_self`, `looking_for_help`, `offering_help` |
| goal | text | Optional |
| next_step | text | Optional |
| location | text | Optional |
| image_url | text | Optional |
| created_at | timestamptz | |

### `creator_updates`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| post_id | uuid FK creator_posts | |
| user_id | uuid FK profiles | |
| content | text NOT NULL | Progress update |
| created_at | timestamptz | |

### `creator_resonances`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| post_id | uuid FK creator_posts | |
| user_id | uuid FK profiles | |
| resonance_type | text NOT NULL | `inspires_me`, `creating_similar`, `want_to_help`, `needed_this` |
| created_at | timestamptz | |
| UNIQUE(post_id, user_id, resonance_type) | | One per type per user |

### `creator_comments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| post_id | uuid FK creator_posts | |
| user_id | uuid FK profiles | |
| content | text NOT NULL | |
| created_at | timestamptz | |

### Storage bucket
- `creator-images` (public) for post image uploads

### RLS Policies
- All tables: authenticated users can SELECT all rows
- INSERT/UPDATE/DELETE: only own rows (user_id = auth.uid())
- Enable realtime on `creator_posts`, `creator_resonances`, `creator_comments`

## New Files

### `src/pages/CreatorsWall.tsx`
Main page with:
- **Header**: "Creators" title, mission message, dynamic counter (count of creator_posts), mission statement about 144,000
- **Post creation prompt** at top: "What are you creating for a better world?" with example chips, post type selector, optional fields (goal, next step, location, image upload)
- **Feed**: Chronological list of `CreatorPostCard` components
- **Integration prompt**: After posting, show "Want help growing this?" → link to Creation Lab

### `src/components/creators/CreatorPostCard.tsx`
Displays a single post thread:
- Creator name + location + post type badge
- Statement, goal, next step, image
- Resonance buttons with counts
- Expand to show progress updates + comments
- "Add Update" button for post owner

### `src/components/creators/CreatePostForm.tsx`
Form component with:
- Textarea for statement
- Post type selector (4 pill buttons)
- Optional fields: goal, next step, location
- Image upload to `creator-images` bucket
- Example prompts shown as subtle chips

### `src/components/creators/ResonanceButtons.tsx`
Four reaction buttons:
- "This inspires me" (Sparkles icon)
- "I'm creating something similar" (Users icon)
- "I want to help" (HandHeart icon)
- "I needed to see this today" (Heart icon)
- Each shows count, toggles on click
- "Creating similar" or "Want to help" triggers connection suggestion

### `src/components/creators/ProgressThread.tsx`
Shows timeline of updates under a post. Owner can add new updates.

### `src/components/creators/CommentSection.tsx`
Comment list + input. Note above input: "This space is for positive support, collaboration, and encouragement."

### `src/hooks/useCreatorPosts.tsx`
Hook for CRUD on posts, updates, resonances, comments. Uses react-query.

## Modified Files

### `src/components/layout/BottomNavigation.tsx`
Add "Creators" nav item between Home and Council:
```
{ icon: Globe, label: "Creators", path: "/creators", matchPaths: ["/creators"] }
```
Now 5 items — icons will be slightly smaller to fit.

### `src/App.tsx`
Add route: `/creators` → `<AppLayout><CreatorsWall /></AppLayout>`

## AI Moderation
Comments will use a simple client-side content filter (block obvious profanity/negativity patterns). Full AI moderation is Phase 2.

## Visual Design
- Post cards: Card component with subtle left border colored by post type
- Creating = blue, Working on self = purple, Looking for help = amber, Offering help = green
- Resonance buttons: ghost variant, icon + label + count
- Header counter: large animated number with "Creators connected" label
- Feed: simple chronological scroll, no algorithm

