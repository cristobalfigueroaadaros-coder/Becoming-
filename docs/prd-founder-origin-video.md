# PRD: Founder Origin Atlas Video

## Purpose

Replace the first-visit founder letter on Cris's Map with a short visual origin video that teaches the core Atlas logic before the user starts building their own map.

The video should make one idea immediately clear:

Life events create dots. Dots open deeper meaning. Dots connect across clusters. Those connections become projects, direction, and eventually Bcoming.

## Placement

- Appears on the first visit to the `Cris's Map` tab on `/atlas`.
- Uses the existing `founders_popup_seen` localStorage flag so it appears once.
- After completion or skip, the user sees the full founder Atlas map and timeline.
- The former `Your map is waiting` CTA card is replaced by the same origin video embedded in the page, so the final call to action lives inside the video experience.
- The video CTA sends the user to `My Map`, where the Atlas walkthrough and first quest can continue.
- The full Cris's Map remains accessible from the Atlas tab toggle.

## Duration

- Target runtime: about 20 seconds.
- The first version is an in-app animated prototype using existing React and Framer Motion.
- A future version can be rendered to MP4 with Remotion after the motion language and script are approved.

## Visual Story

1. Start with a quiet empty Atlas field and a lifetime timeline underneath.
2. Timeline moments appear quickly: grandfather, Chile, Germany, Mauer Park, broken leg, Family Squad, Bcoming.
3. Each moment creates dots in relevant clusters.
4. Mini dots appear around selected dots to show deeper meaning.
5. One cluster opens briefly to reveal collected dots.
6. Gold lines connect dots and clusters across the map.
7. The connected map converges into Bcoming.
8. End with a single glowing user dot and the message that their map starts with one dot.

## Interaction

- Primary action: `Start my map`
- Secondary action: `Skip`
- If the animation reaches the end, keep the final state visible and let the user continue.
- Motion should respect reduced-motion preferences.

## Design Requirements

- Use the existing Bcoming cosmic background, violet/blue/gold palette, glass surfaces, Sora/Inter type, and Atlas dot language.
- No heavy video asset on first prototype.
- No horizontal overflow on mobile.
- Avoid long text. Animation carries the meaning.

## Success Criteria

1. The old long founder letter no longer appears first.
2. A short animated founder origin sequence appears once on first Cris's Map visit.
3. The sequence shows timeline moments creating dots, mini dots, and gold cross-cluster connections.
4. User can skip or continue into Cris's Map.
5. Typecheck/build passes.
