# PRD: Atlas Quest Voice Input

## Purpose
Let users answer reflective Atlas quest prompts with their voice, matching the existing microphone flow already available in chat threads. This reduces friction in the final quest moments where writing can feel slow or interruptive.

## Scope
- Add voice recording to Atlas quest interactions that require typed responses.
- Reuse the existing `VoiceRecorder` component, Supabase voice storage, and transcription edge function.
- Insert the transcribed text into the same answer fields used for typed responses.

## Included Interactions
- Reflection prompts
- Sentence completion prompts
- Memory flash prompts
- Then vs Now prompts, with separate recorders for each answer

## Acceptance Criteria
- Users can type, record, or combine both in written quest answers.
- Recording transcription appends into the active answer without replacing existing writing.
- Existing quest submit behavior remains unchanged.
- The feature builds without TypeScript or production bundle errors.
