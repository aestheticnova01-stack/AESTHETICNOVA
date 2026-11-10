# AESTHETICNOVA — CSS Design System & Styling Guide

## 1. Architecture & Design Tokens
All styling is written in pure CSS without preprocessor dependencies. The design system enforces WCAG 2.2 AA accessibility across all light and dark sections.

The CSS is organized into modular section files under `public/css/`:
- **`public/css/variables.css`**: Design tokens, color palette, fluid typography, spacing.
- **`public/css/header.css`**: Topbar, desktop navigation, search overlay, mobile menu drawer.
- **`public/css/footer.css`**: Dark footer grid, payment badges, legal disclaimers.
- **`public/css/homepage.css`**: Hero banner, editorial split, marquee ticker, category highlights.
- **`public/css/products.css`**: Product cards, grids, PDP image gallery, zoom, reviews.
- **`public/css/cart.css`**: Bag table, summary card, free shipping bar, slide-over bag drawer.
- **`public/css/checkout.css`**: Checkout form steps, address selectors, payment option cards.
- **`public/css/components.css`**: Buttons, form inputs, validation alerts, consent banner, modals.
- **`public/css/responsive.css`**: Breakpoint adjustments for tablets and mobile devices.
- **`public/css/main.css`**: Master stylesheet importing all modular CSS files in cascade order.
- **`public/css/app.css`**: Preserved complete bundle for 100% backward compatibility and contrast testing.

---

## 2. Core Custom Properties (`variables.css`)

### 2.1 Color Palette
```css
:root {
  /* Surfaces */
  --bg: #F7F7F5;              /* Page canvas */
  --surface: #FFFFFF;         /* Card & modal surface */
  --dark: #191919;            /* Editorial dark surface */

  /* Text & Ink */
  --ink: #111111;             /* Primary text (17.6:1 on --bg) */
  --body: #595959;            /* Secondary text (6.5:1 on --bg, 7.0:1 on white) */
  --muted: #595959;           /* Accessible muted text */
  --muted-on-dark: #C9C9C6;   /* Accessible secondary on #191919 (10.6:1) */

  /* Borders & Rules */
  --line: #DEDEDA;
  --line-strong: #111111;
  --line-dark: #333333;

  /* State & Feedback Colors */
  --focus: #0B5CD5;           /* Accessible blue focus ring (5.6:1 on --bg) */
  --focus-on-dark: #8FC1FF;   /* Accessible focus ring on dark (9.4:1 on #191919) */
  --danger: #A32020;          /* Error red (7.5:1 on white) */
  --danger-bg: #FBEDED;
  --success: #1D5B33;         /* In-stock green (8.1:1 on white) */
  --success-bg: #EDF6F0;
  --warn: #6E4B00;            /* Pending yellow/brown (7.9:1 on white) */
  --warn-bg: #FDF6E7;
  --info: #1B4B87;            /* Informational blue (7.8:1 on white) */
  --info-bg: #EEF3FA;
}
```

### 2.2 Fluid Typography Tokens
Typography scales smoothly between viewports using CSS `clamp()`:
- `--step--1`: `clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)` (Small tags/notes)
- `--step-0`: `clamp(0.9375rem, 0.9rem + 0.2vw, 1rem)` (Body text)
- `--step-1`: `clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)` (Subheadings)
- `--step-2`: `clamp(1.375rem, 1.2rem + 0.9vw, 1.875rem)` (Section titles)
- `--step-3`: `clamp(1.75rem, 1.4rem + 1.8vw, 2.75rem)` (Display titles)
- `--step-4`: `clamp(2.25rem, 1.5rem + 3.6vw, 4.25rem)` (Hero display)
- `--step-5`: `clamp(2.75rem, 1.2rem + 7vw, 7rem)` (Editorial hero display)

---

## 3. Section Styling Guidelines

### 3.1 Button Hierarchy
- `.btn`: Solid ink button (`background: var(--ink); color: #fff;`).
- `.btn--ghost`: Bordered outline button (`background: transparent; border: 1px solid var(--ink);`).
- `.btn--small`: Compact padding for inline actions.
- `.btn--block`: Full-width button for cart and checkout primary actions.

### 3.2 Responsive Breakpoints
- **Tablet (`@media (max-width: 900px)`)**:
  - Main navigation collapses into mobile hamburger button.
  - Two-column product grid converts to single or 2-column compact.
  - Cart and checkout summaries stack below line items.
- **Mobile (`@media (max-width: 640px)`)**:
  - Padding reduces to `--gutter: 1.125rem`.
  - Category grid shifts from multi-column grid to vertical stacking.
