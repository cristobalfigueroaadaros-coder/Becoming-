

## Pre-Launch Readiness Audit — Bcoming

I researched your codebase, security scan results, edge functions, configuration, and SEO setup. Here's what I found.

---

### 🔴 BLOCKERS (must fix before launch)

**1. Realtime data leak — CRITICAL security issue**
The security scan flagged: *Any authenticated user can subscribe to any Realtime channel and receive row-change events for other users' private data.* Tables published to Realtime include `chats`, `shadow_encounters`, `mentor_daily_outreach`, and `creator_chat_messages` — all sensitive. Fix: add RLS policies on `realtime.messages` to scope subscriptions by `auth.uid()`.

**2. Build error — TypeScript failure in edge function**
`supabase/functions/suggest-block-activity/index.ts` line 66: `error.message` on an `unknown` type. Currently breaking builds. One-line fix: `error instanceof Error ? error.message : String(error)`.

**3. Creator-images storage bucket — unprotected uploads**
Any authenticated user can upload to any path in the `creator-images` bucket, including paths owned by other users. Need to add path-ownership check in the INSERT policy: `(storage.foldername(name))[1] = auth.uid()::text`.

**4. Premium waitlist table — missing UPDATE/DELETE policies**
Users can never manage their own waitlist entries. Add policies scoped by `email = auth.email()`.

---

### 🟡 SHOULD FIX (recommended before public launch)

**5. Leaked Password Protection disabled**
Supabase Auth setting. Enable in auth settings — protects against users picking compromised passwords.

**6. Public bucket allows file listing**
`creator-images` bucket lets anyone list all files. Restrict the SELECT policy to specific paths or add user-scoping.

**7. SEO / social sharing incomplete**
- No `og:image` tag → ugly link previews on social media
- No `twitter:image` tag
- No canonical URL
- No structured data
- `robots.txt` allows all crawling but there's no `sitemap.xml`

**8. Project not yet published**
`is_published: false`. You need to click **Publish** (top right on desktop, ⋯ menu on mobile) to deploy. Frontend changes require manual Update; backend deploys automatically.

**9. Custom domain**
Currently only `*.lovable.app`. After publishing, connect a custom domain via Project Settings → Domains for brand credibility.

---

### 🟢 NICE TO HAVE (post-launch is fine)

**10. Console logging cleanup** — ~300 console.log/error calls across `src/`. Not breaking, but noisy in production.

**11. Error handling pattern** — ~48 edge functions use the unsafe `error.message` pattern (same as the build error). Wrap them all in `error instanceof Error` checks for safer error responses.

**12. Analytics & monitoring** — No analytics tool detected. Consider adding Plausible, PostHog, or similar.

**13. Legal pages** — `PrivacyPolicy.tsx` and `TermsOfService.tsx` exist; verify content is current and accurate for your jurisdiction (especially given user data, AI processing, and payments).

**14. Payment flow** — Stripe is wired (`STRIPE_SECRET_KEY` set, `create-checkout` and `check-subscription` functions exist). Verify with a real test transaction end-to-end before launch.

---

### What I propose to do (in implementation mode)

If you approve, I'll execute a **Pre-Launch Hardening Pass** in this order:

1. Fix the build error in `suggest-block-activity` (1 line)
2. Migration: add RLS policies on `realtime.messages` for safe per-user channel subscriptions
3. Migration: tighten `creator-images` storage INSERT/SELECT policies with folder ownership
4. Migration: add UPDATE/DELETE policies on `premium_waitlist`
5. Enable Leaked Password Protection in auth config
6. Add `og:image`, `twitter:image`, canonical link, and a basic `sitemap.xml`
7. (Optional) Sweep all edge functions to safely narrow `error.message` usage

Items 8–14 are user-driven (publish click, domain purchase, legal review, payment test) — I'll guide you through them after the hardening pass lands.

