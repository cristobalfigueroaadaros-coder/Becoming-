
# UX Fixes and Surface Improvements

## 1. Birth Location -- Searchable City/Country Selector

### Current
A plain text input where users type freeform text like "London, UK" or "new york."

### Change
Replace with two searchable dropdown selectors (Country first, then City) using the existing Popover + Command (cmdk) components already in the project. No external API needed -- we'll use a curated list of ~250 countries and a text input with autocomplete feel for city.

**Approach:** Use a Country combobox (searchable dropdown with ~250 countries) and a separate City text input. A full city database would require an external API and add complexity. Instead, the Country selector standardizes the most important piece, and the City field stays as a clean text input with better placeholder guidance. The combined value is saved as `"City, Country"` to maintain backward compatibility with the existing `birth_location` column.

### Files
- **`src/pages/OnboardingStep1.tsx`**
  - Split `birth_location` into two form fields: `birth_country` (combobox) and `birth_city` (text input)
  - Country field uses Popover + Command for searchable dropdown
  - On submit, combine as `"${city}, ${country}"` before saving to the database
- **`src/data/countries.ts`** (new file)
  - Export a sorted array of country names for the combobox

## 2. Council Interaction -- Remove Extra Navigation Options

### Current
After council insight, users see multiple action buttons:
- **CouncilMeeting**: "Add this insight to my project" + "Reflect more" + "Start new topic" (3 options)
- **TransmutationCouncil**: "Continue Exploring" + "Start New Topic" (2 options)
- **BuildersTeam**: "Continue Building" + "New Build Session" (2 options)

Plus `suggestedNextQuestion` appears separately above these buttons.

### Change
When a `suggestedNextQuestion` exists, show ONLY that as the single forward action. Hide "Add insight to project," "Reflect more," "Start new topic," etc. When no suggested question exists (e.g., Q3 / final exchange), show only a minimal "Start new topic" reset button.

### Files
- **`src/pages/CouncilMeeting.tsx`** (lines 1025-1101)
  - Wrap the "Thread Continuation Options" block in a condition: only show when there is NO `suggestedNextQuestion`
  - Remove "Add this insight to my project" and "Reflect more" buttons entirely
  - Keep only "Start new topic" as a subtle ghost button for reset
- **`src/pages/TransmutationCouncil.tsx`** (lines 856-875)
  - When `suggestedNextQuestion` exists, hide the "Continue Exploring" + "Start New Topic" action buttons
  - Show only the suggested question card
  - When no suggested question, show only "Start New Topic" as a ghost button
- **`src/pages/BuildersTeam.tsx`** (lines 696-715)
  - Same pattern: hide action buttons when `suggestedNextQuestion` exists
  - Show only "New Build Session" as ghost button when no suggestion

## 3. "One More Thing" Page -- Rewrite for Professional Background

### Current
The page asks: "What are you currently working on, or what kind of work have you done that feels most relevant now?" -- which sounds like it's asking about a current project.

### Change
Rewrite the copy to clearly ask about professional background, education, and skills.

### File
- **`src/pages/OnboardingWorkContext.tsx`**
  - Title: "One More Thing..." (stays the same)
  - Subtitle: Change to "This helps us understand your professional background"
  - Question: Change to "What kind of work have you done? Do you have any degrees, certifications, or specialized training?"
  - Helper text: "This isn't about your current project. It's about your experience and skills."
  - Placeholder: Update examples to focus on experience/education (e.g., "I've worked in marketing for 5 years," "I have a degree in engineering," "I've built and launched SaaS products")

## Summary

| Area | Change | Impact |
|------|--------|--------|
| Birth Location | Country combobox + City text input | Standardized data, less friction |
| Council Actions | Single suggested question as only forward action | Eliminates decision friction, keeps momentum |
| Work Context Page | Rewritten copy for professional background | Removes confusion, improves skill mapping |
