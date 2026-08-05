# PRD: Atlas Life Timeline

## Purpose

Give people a simple, rewarding way to add the important moments, skills, and realizations that shaped them. The timeline is the "Life Album" beneath the Atlas: the Atlas shows connections; the timeline makes it easy to add the lived evidence behind those connections.

## First Release Scope

- Add an Atlas entry point named **Life Timeline**.
- Reuse the existing private `lifetime_events` storage and event detail/edit flows.
- Let a user add, edit, view, and delete timeline moments by life chapter.
- Keep event entry neutral: a moment can be meaningful, difficult, joyful, or unfinished. It is never forced into a positive interpretation.
- Add three visible prompts: Life event, Skill earned, and Realization. These currently use the existing event record and category fields; deeper AI connection and transmutation automation remain future work.

## Experience

1. From My Map, user opens **Life Timeline**.
2. They see life chapters and existing cards.
3. They add one moment in a few words, optionally adding context and category.
4. The card appears in their personal timeline. They can revisit, edit, or remove it.
5. The event becomes available to the existing personal-growth and transmutation surfaces through the shared `lifetime_events` store.

## Non-goals

- No automatic psychological conclusions.
- No requirement to share timeline events publicly.
- No forced transmutation of hard experiences.
- No new database table for the first release.

## Acceptance Criteria

- Authenticated users can open the timeline from Atlas.
- They can create, view, edit, and delete a private event.
- They can choose Life Event, Skill Earned, or Realization during creation.
- Existing Atlas map, quests, and Founder Origin behavior remain unchanged.
- The project builds successfully.
