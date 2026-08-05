# PRD: Temporary Anonymous Test Sessions

## Purpose

Allow internal Bcoming play-tests to begin at the name and birth-data onboarding step without creating an email account. This removes email-provider friction while the team iterates rapidly on Atlas, mentors, and the Life Timeline.

## Experience

- A `Start a test session` button appears only when `VITE_ENABLE_TEST_SESSION=true` at build time.
- Selecting it creates an anonymous Supabase Auth session and routes the tester to `/onboarding`.
- The tester completes the normal profile and Atlas journey, with their data kept separate through their authenticated user ID and existing RLS rules.

## Safeguards

- The button is disabled by default in production builds.
- It is an internal, temporary tool and must be removed or left disabled before public launch.
- Email/password sign-up remains unchanged for real users.
- Supabase Anonymous Sign-Ins must be enabled in Authentication > Providers while this test mode is active.
