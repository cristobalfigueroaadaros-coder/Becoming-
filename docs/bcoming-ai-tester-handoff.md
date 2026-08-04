# Bcoming — AI Play-Test Handoff

## Why Bcoming exists

Bcoming helps a person turn the parts of their life that feel scattered — childhood memories, natural strengths, values, studies, challenges, books, conversations, projects, and dreams — into a visible story that can guide meaningful action.

The product is not a one-time self-assessment. It is a continuing loop:

1. **Atlas** helps a person discover and visually connect pieces of their story.
2. **Mentors and Future Self** give useful perspective at the right moment.
3. **Creative Space** holds and connects valuable ideas rather than losing them in chat.
4. **Creation Lab** turns insight into a project, small actions, learning, and iteration.
5. Progress, reflection, and real-world feedback return to the **Atlas**, making the person’s map more personal over time.

The long-term promise is: *nothing meaningful you have lived through is wasted; it can become part of what only you can build and contribute.*

## Core experience principles

- The user should feel understood, hopeful, capable, and gently supported — never analysed or judged.
- Keep the experience light on the surface: one clear next step, while the underlying system remains deep.
- A meaningful insight should become visible. New information should result in a dot, connection, saved idea, project progress, or clearer next action.
- The AI may suggest connections, but it must not invent facts. Suggestions should be grounded in the user’s inputs and be editable or removable.
- Future Self is the visible companion voice of the background intelligence layer. It may recommend; the user always chooses.
- Mentors should receive only context relevant to their perspective, not a raw dump of private history.
- Feedback is learning, not judgment. In Creation Lab, a project evolves through Define → Ideate → Prototype → Test → Empathize → Iterate.

## User stages

- **Discovery:** the person is unclear about what to do. Bcoming helps them find direction through Atlas questions and meaningful reflection.
- **Growth:** the person has an idea and needs to shape an MVP, prototype, and test it.
- **Build:** the person has something real and needs help improving, growing, or reaching the next business/project goal.

People should be able to start where they are; these are routes through one connected journey, not rigid categories.

## Test persona

Act as a real person, not an assistant. Use short, imperfect, human answers.

Example persona: a 28-year-old creative professional who feels capable but unclear. They care about meaningful work and want to build something, but are unsure how their past experiences, skills, and interests connect. They value creativity, empathy, learning, and positive impact. They have practical constraints such as limited time, fear of putting unfinished work in public, and uncertainty about who their project serves.

When a mentor asks a question, answer with specific experiences, emotions, preferences, and constraints. Do not write polished strategy documents unless the product explicitly asks for one.

## Full play-test path

Use a disposable test account if possible. Do not change production data, deploy code, or alter source files. Record findings as you go.

1. Start from the public site and onboarding.
2. Complete the initial questions and observe whether the next step is understandable.
3. In Atlas, complete several quests with different mechanics, including a text answer.
4. Let a new dot be created. Check whether:
   - My Map remains selected rather than returning to Cris’s Founder Origin;
   - the new dot/cluster is visible and understandable;
   - the next action feels meaningful rather than random;
   - the Future Self action gives a relevant next step.
5. Open a cluster, a dot, and a deeper/mini-dot interaction. Try manually adding a dot or insight.
6. Move to Council and try at least two distinct mentors. Verify that each has a genuinely different but relevant perspective.
7. Save one useful mentor insight. Check that it appears in Creative Space and remains useful later.
8. Create or open a project in Creation Lab. Examine Today’s Task, calendar, project structure, Design Thinking Lab, Creative Space, and Business Plan.
9. From at least one Design Thinking phase, choose “Explore this with [mentor].” Confirm it opens the exact stated mentor, who begins with relevant project/phase context.
10. Complete one task/reflection. Check whether the task is only marked done after a deliberate completion/save action.
11. Review how project notes, mentor messages, Atlas dots, and Future Self guidance appear to connect.

## What to evaluate

### Clarity and emotional experience

- At every point, can a first-time user say what this is, why it matters, and what to do next?
- Does the product feel personal without claiming things the user did not say?
- Does the system make progress visible and rewarding?
- Does any moment feel like a form, a generic chatbot, a blank workspace, or too much information?

### Loop integrity

- Does Atlas input improve mentor responses, project guidance, or Future Self suggestions?
- Do mentor insights and action results return to the user’s Atlas/Creative Space/project in a clear way?
- Does the user get one manageable next action rather than a feature menu?

### Technical and interaction quality

- Broken navigation, loading states, scroll resets, duplicate/repeated screens, missing mentor messages, incorrect labels, lost context, or actions that mark work complete too early.
- Note exact page, button/action, expected behavior, actual behavior, and reproduction steps.

## Known priorities and recently shipped improvements

- Founder Origin is intended to show only once; later Atlas visits should stay on **My Map**.
- Quest completion now shows a new-dot moment, highlights the changed cluster, and offers **Ask Future Self what comes next**.
- Journey’s Future Self guidance is live and must cite factual evidence rather than make vague claims.
- Design Thinking mentor buttons now resolve to the right mentor and pass a concise phase/project/reflection handoff.
- Mentor list scrolling was fixed; check it does not jump back to the top.

## Report format

Return a concise report with these sections:

1. **Overall verdict:** Does the loop feel coherent, personal, and motivating? Why?
2. **What worked:** three to five specific moments.
3. **Blocking issues:** only issues that stop or seriously confuse the journey. Include reproduction steps.
4. **High-value improvements:** ranked list, explaining expected user impact.
5. **Automation/intelligence gaps:** where the system should connect information, suggest a next action, or save a meaningful insight but does not.
6. **Retention assessment:** what would make this user return tomorrow, and what might make them leave?
7. **Suggested next build:** one focused improvement only.

Do not propose a giant redesign. Prioritize the smallest change that makes the Atlas → mentor → action → Atlas loop more reliable and meaningful.
