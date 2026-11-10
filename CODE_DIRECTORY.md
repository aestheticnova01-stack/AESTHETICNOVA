# AESTHETICNOVA — Code Directory & Searchable Index

This directory provides an exhaustive, searchable catalog of all core files, modules, exported functions, and architectural responsibilities in the AESTHETICNOVA project.

---

## 1. Core Server & Configuration

| File Path | Primary Responsibility | Key Exports & Functions |
|---|---|---|
| [`server.js`](file:///server.js) | Main application server bootstrapper, static asset mounts, route registrations, global view locals, and error handlers | `app` (Express application instance) |
| [`config/site.config.js`](file:///config/site.config.js) | Central brand identity, visual palette, navigation array, contact info, shipping rules, tax rate, and policy versions | `name`, `tagline`, `logo`, `colors`, `currency`, `business`, `shipping`, `tax`, `policies`, `navigation` |
| [`config/payment.config.js`](file:///config/payment.config.js) | Payment gateway credentials, payment modes, Cash on Delivery configuration, and public-safe method definitions | `mode`, `isLive`, `credentials`, `cod`, `methods`, `getPublicConfig()` |
| [`config/database.config.js`](file:///config/database.config.js) | SQLite database paths, WAL pragmas, and directory initialization | `dataDir`, `dbFile`, `pragmas`, `ensureDataDir()` |
| [`config/index.js`](file:///config/index.js) | Unified config aggregator providing backward-compatible access to environment and application settings | `config` (Aggregated settings object) |

---

## 2. Business Services Layer (`/services`)

| File Path | Primary Responsibility | Key Exports & Functions |
|---|---|---|
| [`services/product.service.js`](file:///services/product.service.js) | Product queries, inventory calculations, review statistics, search & filtering, wishlist data | `getCategories()`, `getCategoryBySlug(slug)`, `reviewStats(productId)`, `productCards(where, params, order, limit)`, `getProductBySlug(slug)`, `getProductById(id)`, `getProductVariants(productId)`, `getVariantById(variantId)`, `searchProducts(options)`, `getAllProductsAdmin()`, `updateVariantStock(variantId, stock)`, `getWishlistProductIds(userId)`, `toggleWishlist(userId, productId)`, `getWishlistProducts(userId)` |
| [`services/cart.service.js`](file:///services/cart.service.js) | Shopping bag lifecycle, variant stock verification, item addition, updates, removals, drawer API | `ensureCart(sessionId, userId)`, `getCartLines(sessionId)`, `totalsFor(lines, opts)`, `getCartCount(sessionId)`, `addToCart(sessionId, userId, item)`, `updateCartItemQty(sessionId, variantId, qty)`, `removeCartItem(sessionId, variantId)`, `getCartDrawerJson(sessionId)`, `clearCart(sessionId)` |
| [`services/pricing.service.js`](file:///services/pricing.service.js) | Central pricing engine, itemized breakdown, embedded 18% GST calculations, free shipping threshold | `pricingRules()`, `computeTotals(lines, opts)`, `gstComponent(paise, rate)` |
| [`services/payment.service.js`](file:///services/payment.service.js) | Razorpay Orders API client, constant-time HMAC signature verification, payment event recording | `METHODS`, `availableMethods()`, `createRazorpayOrder(params)`, `verifyRazorpaySignature(params)`, `verifyWebhookSignature(rawBody, sig)`, `recordPayment(orderId, details)` |
| [`services/order.service.js`](file:///services/order.service.js) | Transactional order placement, variant stock decrementing, order status tracking, admin order management | `createOrder(params)`, `getOrderByRef(ref)`, `getOrderById(id)`, `getOrderItems(orderId)`, `getFullOrder(ref)`, `getOrdersForUser(userId)`, `getAllOrdersAdmin(opts)`, `updateOrderStatus(orderId, status, note, actor)`, `trackOrder(query)` |
| [`services/security.service.js`](file:///services/security.service.js) | Cryptographic security primitives, scrypt password hashing, PII HMAC hashing, rate limiters | `hashToken(token)`, `hashPII(val)`, `randomToken(bytes)`, `passwordHash(password)`, `passwordVerify(password, stored)`, `safeEqual(a, b)`, `rateLimit(opts)` |
| [`services/consent.service.js`](file:///services/consent.service.js) | DPDP Act 2023 cookie consent management, receipt creation, cookie serialization | `CATEGORIES`, `CATEGORY_META`, `DEFAULT_STATE`, `currentPolicyVersion()`, `normalize(input)`, `recordReceipt(params)`, `stateFromReceipt(row)`, `readConsent(req)`, `serializeConsent(state)`, `writeConsentCookie(req, res, state)`, `saveConsent(params)` |
| [`services/retention.service.js`](file:///services/retention.service.js) | Data retention scheduler, stale session & cart purge, order delivery detail redaction, invoice anonymization | `RULES`, `runRetention(opts)`, `redactClosedOrders(opts)`, `anonymiseAgedInvoices(opts)` |

---

## 3. Controllers Layer (`/controllers`)

| File Path | Primary Responsibility | Key Exports & Functions |
|---|---|---|
| [`controllers/home.controller.js`](file:///controllers/home.controller.js) | Handles marketing pages, about, lookbook, FAQ, sizing, legal notices, and transparency ledger | `renderHome`, `renderAbout`, `renderLookbook`, `renderSizeGuide`, `renderFaq`, `renderShipping`, `renderTransparency`, `renderBusinessDetails`, `renderLicences`, `renderLaunchReadiness`, `renderLaunchReadinessJson`, `renderAccessibility`, `renderLegalDoc` |
| [`controllers/product.controller.js`](file:///controllers/product.controller.js) | Handles shop catalog, filtering, product detail view, and customer wishlists | `renderShop`, `renderProductDetail`, `renderWishlist`, `toggleWishlist` |
| [`controllers/cart.controller.js`](file:///controllers/cart.controller.js) | Handles shopping bag view, AJAX add-to-bag, quantity modification, and drawer data | `renderCart`, `addToCart`, `updateCart`, `removeFromCart`, `getCartApi` |
| [`controllers/checkout.controller.js`](file:///controllers/checkout.controller.js) | Multi-step checkout view, address submission, payment gateway, order confirmation | `renderCheckout`, `processCheckout`, `renderPayment`, `simulateDemoPayment`, `verifyLivePayment`, `renderConfirmation`, `cancelOrder` |
| [`controllers/order.controller.js`](file:///controllers/order.controller.js) | Self-service order tracking form and status resolution | `renderTrackOrder`, `processTrackOrder` |
| [`controllers/auth.controller.js`](file:///controllers/auth.controller.js) | Customer registration, login, logout, account dashboard, profile updates, order history | `renderRegister`, `processRegister`, `renderLogin`, `processLogin`, `logout`, `renderAccount`, `renderProfile`, `updateProfile`, `renderCustomerOrder` |
| [`controllers/admin.controller.js`](file:///controllers/admin.controller.js) | Store administrator console, order fulfillment, inventory stock, review moderation, settings | `ADMIN_ID`, `ensureAdminUser()`, `renderAdminLogin`, `processAdminLogin`, `adminLogout`, `renderDashboard`, `renderOrders`, `renderOrderDetail`, `updateOrderStatus`, `renderDataRequests`, `renderDataRequestDetail`, `verifyDataRequest`, `executeDataDeletion`, `resolveDataRequest`, `renderTickets`, `renderTicketDetail`, `updateTicket`, `renderReviews`, `moderateReview`, `renderInventory`, `updateInventoryStock`, `renderSettings`, `updateSettings`, `renderConsentLog`, `renderAuditLog`, `renderRetention`, `runRetentionJob`, `logDarkPatternAudit` |
| [`controllers/review.controller.js`](file:///controllers/review.controller.js) | Verified customer product review submissions | `submitReview` |
| [`controllers/privacy.controller.js`](file:///controllers/privacy.controller.js) | DPDP Act 2023 Data Subject Access Requests (DSAR) form and tracking | `TYPES`, `renderPrivacyForm`, `submitPrivacyRequest`, `renderPrivacyStatus`, `verifyPrivacyRequest` |
| [`controllers/support.controller.js`](file:///controllers/support.controller.js) | Contact inquiries, customer grievance complaints, returns, and support status | `KINDS`, `renderContact`, `renderGrievance`, `renderReturns`, `submitContact`, `renderSupportStatus` |
| [`controllers/consent.controller.js`](file:///controllers/consent.controller.js) | Cookie banner API, accept-all, reject optional, custom settings, and consent withdrawal | `getConsentApi`, `acceptAll`, `rejectOptional`, `saveCustom`, `withdrawConsent` |

---

## 4. Middleware Layer (`/middleware`)

| File Path | Primary Responsibility | Key Exports & Functions |
|---|---|---|
| [`middleware/security.middleware.js`](file:///middleware/security.middleware.js) | Content Security Policy, HSTS, frame protection, IP detection, and rate limiting | `securityHeaders(isHttps)`, `httpsRedirect`, `clientIp`, `rateLimitMiddleware(opts)` |
| [`middleware/session.middleware.js`](file:///middleware/session.middleware.js) | Cookie parsing, SQLite-backed session creation, session rotation on login, destruction | `parseCookies(header)`, `cookieOptions(req, maxAge)`, `createSession(req, res, userId)`, `sessionMiddleware(req, res, next)`, `rotateSession(req, res, userId)`, `destroySession(req, res)` |
| [`middleware/csrf.middleware.js`](file:///middleware/csrf.middleware.js) | Anti-CSRF verification on POST/PUT/PATCH/DELETE requests | `validCsrf(req)`, `csrfMiddleware(req, res, next)` |
| [`middleware/consent.middleware.js`](file:///middleware/consent.middleware.js) | Reads consent cookie and attaches consent flags to request and view locals | `consentMiddleware(req, res, next)` |
| [`middleware/auth.middleware.js`](file:///middleware/auth.middleware.js) | Customer account authentication guard and admin authorization guard | `requireUser(req, res, next)`, `requireAdmin(req, res, next)` |
| [`middleware/error.middleware.js`](file:///middleware/error.middleware.js) | Custom 404 page and sanitized 500 internal error handler with PII error refs | `notFoundHandler(req, res)`, `errorHandler(err, req, res, next)` |

---

## 5. Routes Layer (`/routes`)

| File Path | Routes Mounted | Mapped Controller |
|---|---|---|
| [`routes/index.routes.js`](file:///routes/index.routes.js) | `/`, `/about`, `/lookbook`, `/size-guide`, `/faq`, `/shipping`, `/transparency`, `/business-details`, `/licences`, `/accessibility`, `/privacy`, `/terms`, `/returns`, `/cookies` | `controllers/home.controller` |
| [`routes/product.routes.js`](file:///routes/product.routes.js) | `/shop`, `/product/:slug`, `/account/wishlist`, `/wishlist/toggle` | `controllers/product.controller` |
| [`routes/cart.routes.js`](file:///routes/cart.routes.js) | `/cart`, `/cart/add`, `/cart/update`, `/cart/remove`, `/api/cart` | `controllers/cart.controller` |
| [`routes/checkout.routes.js`](file:///routes/checkout.routes.js) | `/checkout`, `/order/:ref/pay`, `/order/:ref/pay/simulate`, `/order/:ref/pay/verify`, `/order/:ref`, `/order/:ref/cancel` | `controllers/checkout.controller` |
| [`routes/order.routes.js`](file:///routes/order.routes.js) | `/track-order` | `controllers/order.controller` |
| [`routes/auth.routes.js`](file:///routes/auth.routes.js) | `/account/register`, `/account/login`, `/account/logout`, `/account`, `/account/profile`, `/account/orders/:ref` | `controllers/auth.controller` |
| [`routes/admin.routes.js`](file:///routes/admin.routes.js) | `/admin/*` (dashboard, orders, inventory, settings, reviews, tickets, data requests, retention) | `controllers/admin.controller` |
| [`routes/review.routes.js`](file:///routes/review.routes.js) | `/reviews` | `controllers/review.controller` |
| [`routes/privacy.routes.js`](file:///routes/privacy.routes.js) | `/privacy-requests`, `/privacy-requests/status`, `/privacy-requests/:ref/verify` | `controllers/privacy.controller` |
| [`routes/support.routes.js`](file:///routes/support.routes.js) | `/contact`, `/grievance`, `/returns`, `/support/status` | `controllers/support.controller` |
| [`routes/consent.routes.js`](file:///routes/consent.routes.js) | `/api/consent`, `/consent/accept-all`, `/consent/reject`, `/consent`, `/consent/withdraw` | `controllers/consent.controller` |

---

## 6. Frontend Scripts (`/public/js`)

| File Path | Script Role & Enhancements |
|---|---|
| [`public/js/navigation.js`](file:///public/js/navigation.js) | Mobile navigation slide-out drawer, keyboard escape handling, focus management |
| [`public/js/search.js`](file:///public/js/search.js) | Live search panel toggle, auto-focus, keyboard shortcuts |
| [`public/js/products.js`](file:///public/js/products.js) | Product page keyboard and click zoom, pointer-follow coordinates, dynamic stock reflection |
| [`public/js/cart.js`](file:///public/js/cart.js) | Slide-over cart drawer, AJAX add-to-bag, quantity steppers, bag badge updates, live announcer |
| [`public/js/checkout.js`](file:///public/js/checkout.js) | Client-side form handling, payment method switching, demo payment simulation triggers |
| [`public/js/components.js`](file:///public/js/components.js) | Wishlist heart toggles, scroll animations (`IntersectionObserver`), destructive confirmations |
| [`public/js/consent.js`](file:///public/js/consent.js) | Standalone DPDP Act 2023 cookie banner and category preferences manager |
| [`public/js/main.js`](file:///public/js/main.js) | Core progressive enhancement orchestrator |

---

## 7. Stylesheets (`/public/css`)

| File Path | Style Scope & Selectors |
|---|---|
| [`public/css/variables.css`](file:///public/css/variables.css) | `:root` custom properties, color palette (WCAG 2.2 AA), fluid typography, spacing tokens |
| [`public/css/header.css`](file:///public/css/header.css) | Topbar, header layout, navigation bar, utility buttons, search panel, mobile nav |
| [`public/css/footer.css`](file:///public/css/footer.css) | Dark footer grid, brand summary, payment badges, navigation columns, copyright notice |
| [`public/css/homepage.css`](file:///public/css/homepage.css) | Hero editorial layout, marquee ticker, category highlights, lookbook and about excerpts |
| [`public/css/products.css`](file:///public/css/products.css) | Product cards, catalog grid, PDP image gallery, zoom viewport, size selector, verified reviews |
| [`public/css/cart.css`](file:///public/css/cart.css) | Shopping bag table, line items, order summary card, free shipping progress meter, cart drawer |
| [`public/css/checkout.css`](file:///public/css/checkout.css) | Multi-step checkout form, address layout, payment method cards, order confirmation view |
| [`public/css/components.css`](file:///public/css/components.css) | Buttons, form inputs, validation error alerts, breadcrumbs, consent banner, preference modal |
| [`public/css/responsive.css`](file:///public/css/responsive.css) | Media query breakpoints (`max-width: 900px`, `max-width: 640px`) |
| [`public/css/main.css`](file:///public/css/main.css) | Master stylesheet importing all modular CSS files in cascade order |
| [`public/css/app.css`](file:///public/css/app.css) | Complete unified stylesheet preserving all rules for backward compatibility and test verification |

---

## 8. Windows Automation Batch Scripts (`/batch`)

| File Path | Script Execution & Function |
|---|---|
| [`batch/start.bat`](file:///batch/start.bat) | Resolves project directory, sets demo environment variables, verifies dependencies, starts website |
| [`batch/dev.bat`](file:///batch/dev.bat) | Starts development server with live watch mode (`node --watch server.js`) |
| [`batch/install.bat`](file:///batch/install.bat) | Verifies Node.js & npm presence and installs project dependencies |
| [`batch/build.bat`](file:///batch/build.bat) | Runs full verification build (`node scripts/build.js`) |
| [`batch/backup.bat`](file:///batch/backup.bat) | Checkpoints SQLite WAL and creates timestamped database & configuration snapshot |
| [`start-windows.bat`](file:///start-windows.bat) | Root convenience launcher delegating directly to `batch\start.bat` |
