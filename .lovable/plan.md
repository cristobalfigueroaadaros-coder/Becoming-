

# Fix PatternDiscoveryCard Being Blocked by Bottom Navigation

## Problem

The PatternDiscoveryCard overlay uses `z-50` (line 65), but the BottomNavigation also uses `z-50` (in `BottomNavigation.tsx` line ~62). Because the bottom nav is rendered later in the DOM tree, it visually sits on top of the card's CTA buttons ("Yes, that's it" / "Not yet"), making them unclickable. The user accidentally taps a nav button and loses the winning card.

## Fix

**File**: `src/components/pattern-map/PatternDiscoveryCard.tsx`

Change the overlay `z-index` from `z-50` to `z-[60]` so the card reliably renders above the bottom navigation.

**Line 65**: Change `className="fixed inset-0 z-50 ..."` to `className="fixed inset-0 z-[60] ..."`

This is a single-line change. No other files need modification.

