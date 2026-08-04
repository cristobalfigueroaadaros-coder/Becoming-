# Future Self Intelligence Layer

## Purpose

Bcoming's intelligence layer is an invisible, persistent memory that helps a person see their lived experience as a connected story. Its visible voice is **Future Self**: a companion who appears in the Journey when there is a grounded reason to guide the user, while remaining available as a dedicated chat.

The user should feel understood, hopeful, clearer, and able to take one meaningful next step. The system's long-term outcome is to help someone turn their experience, skills, values, and insights into purposeful work that can create positive impact and support them financially.

## Product principles

- **Evidence before interpretation.** Never invent a connection. A visible insight must point to the user's own Atlas dots, saved reflections, completed actions, or explicitly stated words.
- **Trust over frequency.** A quiet system is better than a generic or weak recommendation. The system should only surface high-confidence guidance.
- **User agency.** Future Self can recommend, route, and explain; the user chooses the action. Every created connection can be edited, deleted, or marked as not useful.
- **Relevant context, not a data dump.** Each mentor gets the smallest useful set of recent, relevant, evidence-backed memories for its perspective.
- **Learning is transparent.** When a user ignores a recommendation, Future Self may ask why it was not useful and use that feedback to improve future guidance.

## Existing foundation

- `atlasSignalEngine` extracts deterministic signals from Atlas quest choices.
- `atlasConnectionEngine` detects shared signals and gold moments between compatible clusters.
- `atlas_analysis_snapshots` stores past pattern analysis and emerging direction.
- `atlas_journey_events` is an append-only record for key events.
- `future_self_messages` and `useFutureSelfOmnipresence` support proactive Future Self messages.
- `journey-compass` and `JourneyCompassCard` already produce an actionable next-step recommendation in Journey.

## First release: Future Self in Journey

### Trigger

Journey asks the existing intelligence for guidance when opened. It should use a clear, user-facing Future Self voice rather than a generic system label.

### Guidance card

The card contains:

1. A short, specific observation grounded in the user's Atlas or current project.
2. One recommended next move.
3. Two alternatives on different surfaces.
4. A visible explanation of why the recommendation was made.
5. A small “Not useful?” action that records feedback without blocking the user.

### Actions

- Atlas action opens the relevant cluster/quest.
- Mentor action opens the selected mentor with a concise handoff.
- Project/design-thinking action opens the relevant project surface.
- Future Self never completes a task, adds a dot, or changes a project without a user action.

## Connection confidence

Automatic connections may be created only when the evidence meets at least one high-confidence rule:

- a deterministic signal pattern crosses its configured threshold;
- two or more independent user inputs support the same theme;
- a user explicitly saved or repeated the related insight; or
- a gold-moment rule is met between an appropriate difficulty/shadow and strength/action cluster.

The connection must retain its evidence IDs. It is shown as a proposed/AI-created connection with edit, delete, and “not me” controls. User corrections become negative feedback for future matching.

## Mentor context strategy

The intelligence builds a context pack per mentor request:

- current user question and current surface;
- the active project and latest explicit progress;
- up to a few relevant, evidence-backed Atlas patterns/dots;
- recent saved mentor insights relevant to the mentor's specialty;
- previous explicit feedback or rejected guidance, if relevant.

Do not send a user's entire history by default.

## Feedback events

Store lightweight recommendation events in `atlas_journey_events`:

- `future_self_guidance_shown`
- `future_self_guidance_followed`
- `future_self_guidance_not_useful`

Metadata records the recommendation surface/target, its evidence summary, and optional user feedback. This supports adaptation without treating a skipped button as a rejection.

## Delivery phases

1. **Future Self Journey card** — name/voice the existing Journey Compass as Future Self, make its evidence and recommendation clear, and record shown/followed/not-useful events.
2. **Trustworthy Atlas connections** — persist evidence-backed automatic links and allow correction/deletion/negative feedback.
3. **Mentor context packs** — give each mentor relevant context from the shared memory rather than unrelated full history.
4. **Adaptive rhythm** — use explicit feedback and engagement to decide when Future Self should surface guidance; avoid noise.

## Success signals

- More users follow a Future Self recommendation than dismiss it as unhelpful.
- Users return to Journey/Atlas after a guidance moment.
- Mentor responses cite relevant personal context without feeling repetitive or invasive.
- Fewer incorrect Atlas connections remain uncorrected.
