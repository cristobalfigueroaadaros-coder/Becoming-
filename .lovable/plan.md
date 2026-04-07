

# Payments System — Stripe Integration for Validation Phase

## Summary

Implement a 3-tier optional payment system using Stripe Checkout, triggered after the user enters the Creation Lab and explores for ~10-15 seconds. No feature restrictions — purely validation.

## Stripe Products (Already Created)

| Tier | Product ID | Price ID | Amount |
|------|-----------|----------|--------|
| Early Supporter (one-time) | `prod_UHzhcGdvuvPpVH` | `price_1TJPhvGjv5uqp0k0kgyo2tSf` | $10 |
| Monthly | `prod_UHzhSkldNGK8DT` | `price_1TJPiMGjv5uqp0k0mc0G5c3x` | $12.99/mo |
| Yearly | `prod_UHzhxSbiD1qCQS` | `price_1TJPiTGjv5uqp0k0rqYLXTYH` | $99/yr |

## Database Changes

Add `payment_status` column to `profiles` table:
- Type: `text`, default `'free'`
- Values: `free`, `supporter`, `subscriber_monthly`, `subscriber_yearly`
- Also add `payment_completed_at` (timestamp, nullable)

## Edge Functions

### 1. `create-checkout` (new)
- Accepts `priceId` and `mode` (payment vs subscription) from frontend
- Looks up or creates Stripe customer by user email
- Creates Checkout session with appropriate mode
- Returns checkout URL

### 2. `check-subscription` (new)
- Verifies user's payment/subscription status via Stripe API
- Returns `{ subscribed, product_id, subscription_end }`
- Called on page load and after checkout return

### 3. `payment-webhook` (new)
- Handles `checkout.session.completed` events
- Updates `profiles.payment_status` based on which product was purchased

## Frontend Components

### 1. `PaymentModal.tsx` (new)
- Glassmorphism modal matching the cosmic design system
- Copy exactly as specified in the PDR
- 3 payment buttons + "Continue for free"
- Each payment button calls `create-checkout` with the appropriate price ID
- Opens Stripe Checkout in new tab
- Stores `localStorage` flag `payment_popup_shown` to avoid repeating

### 2. Payment trigger in `CreationLab.tsx`
- On mount, check if user has `payment_status === 'free'` AND `payment_popup_shown` not set
- Start a 12-second timer
- After timer, show `PaymentModal`
- If user dismisses, set localStorage flag — don't show again this session

### 3. Payment success page
- Simple `/payment-success` route
- Calls `check-subscription` to verify and update profile
- Shows thank-you message, then redirects to Creation Lab

## Files to Create/Edit

| File | Action |
|------|--------|
| DB migration | Add `payment_status` + `payment_completed_at` to profiles |
| `supabase/functions/create-checkout/index.ts` | Create — handles both one-time and subscription modes |
| `supabase/functions/check-subscription/index.ts` | Create — verifies payment status |
| `src/components/PaymentModal.tsx` | Create — the popup UI |
| `src/pages/CreationLab.tsx` | Edit — add 12s timer trigger for PaymentModal |
| `src/pages/PaymentSuccess.tsx` | Create — success redirect page |
| `src/App.tsx` | Edit — add `/payment-success` route |

## Key Rules

- No webhooks (per Stripe guide recommendation) — use `check-subscription` on return
- No feature blocking — all access remains free
- Popup shows only once per user (localStorage flag)
- Payment status stored in profiles for analytics

