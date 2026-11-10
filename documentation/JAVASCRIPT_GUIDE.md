# AESTHETICNOVA — JavaScript Architectural Guide

## 1. Architecture Philosophy
The JavaScript in AESTHETICNOVA is structured according to strict separation of concerns:
- **Server-Side Application Logic**: Express controllers handle HTTP requests, responses, and view rendering.
- **Services Layer**: Pure business logic, database queries, and external APIs (payment gateways, hashing).
- **Middleware**: Transport security, session state, CSRF prevention, rate limiting, and error handling.
- **Frontend JavaScript**: Pure progressive enhancement. The entire site remains functional even if JavaScript is disabled in the client browser.

---

## 2. Server-Side Modules

### 2.1 Services (`/services`)
Services contain zero HTTP request or response manipulation. They receive clean arguments and return typed results or throw errors.

- **`services/product.service.js`**:
  - `getCategories()`: Returns all active categories sorted by rank.
  - `getProductBySlug(slug)`: Retrieves a product with aggregated stock and formatted prices.
  - `productCards(where, params, order, limit)`: Builds formatted card view models for shop and category pages.
  - `reviewStats(productId)`: Calculates approved review counts and average ratings.
  - `toggleWishlist(userId, productId)`: Idempotent toggle adding or removing saved items.

- **`services/cart.service.js`**:
  - `ensureCart(sessionId, userId)`: Fetches or provisions an active cart record.
  - `getCartLines(sessionId)`: Reads cart items joined with current inventory stock and product metadata.
  - `addToCart(sessionId, userId, item)`: Adds an item with strict server-side stock ceiling checks.
  - `updateCartItemQty(sessionId, variantId, qty)`: Adjusts line item quantity.
  - `removeCartItem(sessionId, variantId)`: Drops a line item.
  - `getCartDrawerJson(sessionId)`: Builds formatted payload for the client-side cart drawer.

- **`services/pricing.service.js`**:
  - `pricingRules()`: Central configuration for shipping fees, free shipping threshold, and COD charges.
  - `computeTotals(lines, options)`: Single pricing engine producing identical totals on bag, checkout, and invoice. Prices are GST-inclusive (18%); the tax component is calculated from the retail gross amount: `Math.round(gross - gross / 1.18)`.

- **`services/payment.service.js`**:
  - `availableMethods()`: Returns supported methods based on configuration and COD enablement.
  - `createRazorpayOrder({ amountPaise, orderRef, receiptEmail })`: Communicates with Razorpay Orders API over HTTPS.
  - `verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, signature })`: Performs constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`).

- **`services/order.service.js`**:
  - `createOrder({ sessionId, userId, values, lines, totals })`: Executes an atomic SQLite transaction that decrements stock (`UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?`), inserts the order, records items, registers payment intent, and empties the cart.

- **`services/security.service.js`**:
  - `passwordHash(password)`: Hashes passwords using Node.js native `crypto.scryptSync`.
  - `passwordVerify(password, hash)`: Verifies scrypt hash with constant-time equality check.
  - `hashPII(val)`: One-way HMAC-SHA256 hashing for IP addresses and user agents so abuse limits can be enforced without storing raw personal data.
  - `rateLimit(options)`: Fixed-window in-memory rate limiter keyed on anonymized identity hashes.

---

## 3. Frontend JavaScript (`/public/js`)

Frontend scripts are modular and follow progressive enhancement principles:
- **`public/js/navigation.js`**:
  - Handles `#menu-toggle` and `#mobile-nav` slide-out.
  - Manages `aria-expanded` attributes and keyboard focus traps.
  - Listens for `Escape` key events to close navigation.
- **`public/js/search.js`**:
  - Toggles overlay search panel (`#search-panel`) with auto-focus on `#site-search`.
  - Closes on `Escape` and restores focus to search icon button.
- **`public/js/products.js`**:
  - Implements keyboard and click zoom on `#pdp-main`.
  - Calculates pointer coordinates for mouse-follow zoom (`transform-origin: x% y%`).
  - Reflects real-time per-variant stock in `#stock-status` when customer changes sizes.
- **`public/js/cart.js`**:
  - Handles modal opening and closing for `<dialog id="cart-drawer">`.
  - Intercepts forms with `[data-cart-ajax]` to post via `fetch` with `X-CSRF-Token` headers.
  - Updates `[data-cart-count]` and announces changes to screen readers via `#js-live`.
  - Implements +/- quantity stepper on cart and PDP views.
- **`public/js/checkout.js`**:
  - Dynamically displays or hides Cash on Delivery fee notices.
  - Disables double submission on order placement.
- **`public/js/components.js`**:
  - Handles `[data-wishlist]` toggle requests via AJAX.
  - Initializes `IntersectionObserver` scroll animations for elements with `.reveal`.
  - Intercepts destructive actions with `[data-confirm]` for confirmation dialogs.
- **`public/js/main.js`**:
  - Core orchestrator initializing the polite live announcer.
