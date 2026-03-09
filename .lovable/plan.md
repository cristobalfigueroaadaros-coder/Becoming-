
# Creator Wall Post Composer — Implementation Plan

We will create a new, aesthetically pleasing `PostComposer` component and position it at the top of the Creators Wall (right below the header), replacing the old bottom-positioned `CreatePostForm`. The new design will be cleaner, minimal, and follow the structure of modern social post inputs.

### 1. Create `src/components/creators/PostComposer.tsx`
We will build a sleek, horizontally-oriented composer card:
- **Left Side:** A circular avatar container with a subtle user icon.
- **Right Side (Input Area):** A minimal, borderless textarea with the placeholder: `"What are you creating for a better world?"`.
- **Helper Text:** Small, calm hints immediately below the input (`Examples: starting a community project • building a purpose-driven business • healing myself`).
- **Expandable Optional Fields:** A clean "Details" toggle that reveals borderless inputs for **Goal**, **Next Step**, and **Location** with small leading icons.
- **Action Bar:** A minimal row containing:
  - A dropdown menu to select the post type (`Creating`, `Working on self`, etc.).
  - An image upload button.
  - The "Share" button.
- **Design Style:** We will use `bg-card`, rounded corners, `shadow-sm`, and `border-0` on inputs to keep it feeling light and encouraging rather than bulky.

### 2. Update `src/pages/CreatorsWall.tsx`
- **Import:** Import the new `PostComposer` component.
- **Guidance Message:** Add the requested guidance text just below the mission statement:
  > *"This space is for sharing positive impact, supporting each other, and building a better world together."* (Styled as a subtle, center-aligned message box).
- **Positioning:** Render the `PostComposer` directly beneath the guidance message, before the `SEED_POSTS` feed.
- **Cleanup:** Remove the old `shareExpanded` state, the bottom "Share your creation" button, and the `CreatePostForm` logic from the bottom of the page since the composer is now persistent at the top.

This approach resolves the sizing issues, aligns the visual style with standard post cards, and ensures the composer is immediately visible without needing an extra click to expand.
