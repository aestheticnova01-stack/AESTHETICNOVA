# AESTHETICNOVA — EJS Templating Guide

## 1. Templating Overview
AESTHETICNOVA uses Embedded JavaScript (EJS) templates rendered by Express on the server.

### View Directory Hierarchy
Templates are organized into:
1. `views/partials/`: Universal blocks included in every page (head, header, navbar, footer, scripts, consent banner).
2. `views/components/`: Reusable standalone UI components (product cards, cart drawer, search panel).
3. `views/pages/`: Dedicated top-level page templates.
4. Preserved subfolders (`views/account/`, `views/admin/`, `views/info/`, `views/legal/`, `views/shop/`, `views/cart/`, `views/checkout/`) for backwards compatibility.

---

## 2. Partials & Components

### 2.1 `views/partials/head.ejs`
Included at the very top of each page.
- Establishes `<!DOCTYPE html>`, charset, and viewport.
- Binds `<title>` and `<meta name="description">` from `res.locals`.
- Links `/css/app.css` (which contains design tokens and section styles).
- Includes `partials/scripts.ejs`.
- Renders optional JSON-LD structured data (`structuredData`) when provided.

### 2.2 `views/partials/header.ejs`
- Topbar announcing free shipping thresholds and return policies.
- Brand logo: `AESTHETIC<span>NOVA</span>`.
- Includes `views/partials/navbar.ejs` for category links.
- Utility buttons: search toggle, wishlist icon, account link, bag count pill (`[data-cart-count]`).
- Includes `views/components/search-panel.ejs`.
- Includes `views/components/cart-drawer.ejs`.

### 2.3 `views/partials/navbar.ejs`
Renders primary desktop navigation links with accessibility attribute `aria-current="page"`.

### 2.4 `views/partials/footer.ejs`
- Brand summary and accepted payment method badges (UPI, Cards, Net banking, COD).
- Categorized navigation columns: Shop, Help, Privacy & Legal, and Contact.
- Business details (address, phone, email, support hours, GSTIN, grievance officer).
- Cookie settings modal trigger (`data-consent-open="footer"`).

### 2.5 `views/components/product-card.ejs`
Reusable card included across home, shop, and wishlist pages:
```ejs
<%- include('../partials/product-card', { p: product, wishlistIds: wishlistIds }) %>
```
- Image with fallback alt text.
- Out of stock / New arrival flags.
- Product name and formatted INR price.
- Verified review stars and review count.
- Accessible wishlist button with `aria-pressed`.

### 2.6 `views/partials/consent-banner.ejs`
- Cookie consent banner compliant with DPDP Act 2023.
- Equal visual weight for "Accept all" and "Strictly necessary only".
- Modal preference panel for individual category toggles (Functional, Analytics, Marketing).

---

## 3. Global Variables in Views
Every template automatically receives these variables via `res.locals`:
- `biz`: Business identity object (`tradingName`, `email`, `phone`, `address`, `gstin`, `grievanceOfficer`).
- `businessConfigured`: Boolean flag checking whether real merchant details are set.
- `user`: Signed-in customer session object (`id`, `full_name`, `email`), or `null` for guests.
- `inr(paise)`: Formats amounts in paise as Indian Rupee strings (e.g. `149900` -> `₹1,499`).
- `fmtDate(iso)` / `fmtDateTime(iso)`: Formats timestamps in Indian English format (e.g. `10 Nov 2026`).
- `cartCount`: Total item count in customer's bag.
- `wishlistIds`: Array of product IDs saved by the current customer.
- `codEnabled`: Boolean indicating if Cash on Delivery is currently active.
- `freeShipLabel`: Formatted threshold string (e.g. `₹1,499`).
- `csrf`: Current session's CSRF token for forms.
