# AESTHETICNOVA — Architectural Blueprint & Project Structure

## Overview
AESTHETICNOVA is a premium, minimal streetwear jewellery e-commerce platform architected on Node.js, Express, EJS, and SQLite (WAL mode). The project follows strict compliance with India's Consumer Protection Act (2019), Digital Personal Data Protection (DPDP) Act (2023), and WCAG 2.2 AA accessibility standards.

---

## High-Level Directory Map

```
AESTHETICNOVA/
│
├── README.md                      # Comprehensive user & developer operations manual
├── CODE_DIRECTORY.md              # Searchable index of all core files, exports, and functions
├── package.json                   # Project metadata, dependencies, and execution scripts
├── package-lock.json              # Deterministic dependency lockfile
├── server.js                      # Root application entry point and server bootstrapper
├── .env.example                   # Annotated environment variable template
├── .gitignore                     # Git ignore rules for node_modules, temp files, and sqlite journals
│
├── config/                        # Centralized application configurations
│   ├── index.js                   # Unified configuration aggregator & backwards-compatibility export
│   ├── site.config.js             # Brand identity, navigation, contact details, shipping & GST rules
│   ├── payment.config.js          # Gateway settings (Demo/Razorpay), methods, and COD thresholds
│   └── database.config.js         # SQLite path, WAL pragmas, and connection manager
│
├── routes/                        # HTTP route definitions
│   ├── index.routes.js            # Home, about, lookbook, FAQ, and legal policy routes
│   ├── product.routes.js          # Shop catalog, product detail pages, and wishlist endpoints
│   ├── cart.routes.js             # Shopping bag display, add, update, remove, and drawer API
│   ├── checkout.routes.js         # Multi-step checkout, payment gateway, and confirmation
│   ├── order.routes.js            # Self-service order lookup and tracking routes
│   ├── auth.routes.js             # Customer registration, sign in, logout, and profile
│   ├── admin.routes.js            # Protected admin dashboard, inventory, orders, and audits
│   ├── review.routes.js           # Verified customer review submissions
│   ├── privacy.routes.js          # DPDP Act 2023 Data Subject Access Requests (DSAR)
│   ├── support.routes.js          # Customer service tickets, grievance redressal, and returns
│   ├── consent.routes.js          # Cookie preferences and consent withdrawal endpoints
│   └── [legacy adapter routes]    # Backwards-compatible proxies (pages.js, shop.js, etc.)
│
├── controllers/                   # Controller layer: request validation, service calls, view rendering
│   ├── home.controller.js         # Marketing pages, informational guides, and legal policies
│   ├── product.controller.js      # Shop catalog, PDP variant selection, stock checks, wishlists
│   ├── cart.controller.js         # Bag view, AJAX add-to-bag, quantity adjustments, drawer API
│   ├── checkout.controller.js     # Checkout validation, demo simulator, Razorpay HMAC verification
│   ├── order.controller.js        # Customer order tracking and detail lookups
│   ├── auth.controller.js         # Registration, login rate-limiting, session rotation, profiles
│   ├── admin.controller.js        # Store admin operations (orders, stock, reviews, settings, logs)
│   ├── review.controller.js       # Customer verified review submissions
│   ├── privacy.controller.js      # DSAR creation, email verification, and request tracking
│   ├── support.controller.js      # Inquiries, grievance tickets, and return authorizations
│   └── consent.controller.js      # Cookie consent recording and audit logging
│
├── services/                      # Business logic layer (independent of HTTP transport)
│   ├── product.service.js         # Catalog queries, variant resolution, stock computation, wishlists
│   ├── cart.service.js            # Bag session management, stock capping, line item totals
│   ├── pricing.service.js         # Single pricing engine, embedded 18% GST maths, shipping rules
│   ├── payment.service.js         # Razorpay Orders API, HMAC signature validation, demo simulator
│   ├── order.service.js           # Atomic order creation, stock decrements, and status updates
│   ├── security.service.js        # Scrypt password hashing, PII HMAC hashing, tokens, rate limits
│   ├── consent.service.js         # Consent receipts, GPC header handling, cookie serialization
│   └── retention.service.js       # Data minimization jobs, delivery detail redaction, 8-year anonymization
│
├── middleware/                    # Express middlewares
│   ├── index.js                   # Middleware registry
│   ├── security.middleware.js     # Strict CSP, HSTS, X-Frame-Options, client IP extraction
│   ├── session.middleware.js      # SQLite session store, session cookie, rotation on login
│   ├── csrf.middleware.js         # Anti-CSRF token verification for mutating HTTP methods
│   ├── consent.middleware.js      # Consent cookie parser, analytics visit gating
│   ├── auth.middleware.js         # Authentication guards (requireUser, requireAdmin)
│   └── error.middleware.js        # Standard 404 page and sanitized 500 error handler
│
├── views/                         # EJS Presentation Layer
│   ├── layouts/                   # Layout wrappers
│   ├── partials/                  # Common modular partials
│   │   ├── head.ejs               # Meta tags, stylesheet link, schema markup, scripts
│   │   ├── header.ejs             # Topbar, brand logo, mobile trigger, bag badge
│   │   ├── navbar.ejs             # Category navigation links
│   │   ├── footer.ejs             # Footer navigation, contact info, payment badges, legal notices
│   │   ├── scripts.ejs            # Script bundle loader
│   │   ├── product-card.ejs       # Reusable product card with price, badge, and wishlist trigger
│   │   └── consent-banner.ejs     # DPDP Act 2023 cookie consent banner and preference modal
│   │
│   ├── pages/                     # Dedicated standalone page templates
│   │   ├── home.ejs               # Editorial homepage with hero, marquee, and category grid
│   │   ├── shop.ejs               # Filterable product catalog with price & stock filters
│   │   ├── product.ejs            # PDP with image zoom, variant picker, and verified reviews
│   │   ├── cart.ejs               # Full shopping bag page with itemized GST breakdown
│   │   ├── checkout.ejs           # Multi-step checkout form with PIN code validation
│   │   ├── contact.ejs            # Contact inquiry, grievance, and support ticket form
│   │   ├── about.ejs              # Brand ethos and sourcing transparency
│   │   ├── lookbook.ejs           # Minimal streetwear visual editorial
│   │   └── error.ejs              # Error layout (404, 500, 429)
│   │
│   ├── components/                # Modular UI widgets
│   │   ├── product-card.ejs       # Product card component
│   │   ├── cart-drawer.ejs        # Slide-over shopping bag dialog
│   │   └── search-panel.ejs       # Overlay search form
│   │
│   ├── shop/                      # Preserved subfolder templates
│   ├── cart/                      # Preserved cart subfolder template
│   ├── checkout/                  # Confirmation, payment, and tracking templates
│   ├── account/                   # Account login, registration, profile, and wishlist
│   ├── admin/                     # Admin dashboard, order management, inventory, and logs
│   ├── info/                      # FAQ, size guide, shipping, support status
│   └── legal/                     # Privacy policy, terms, returns, cookies, licences
│
├── public/                        # Static web assets served to browsers
│   ├── css/                       # Modular CSS stylesheets
│   │   ├── main.css               # Master stylesheet importing all modules
│   │   ├── variables.css          # Color palette, typography, spacing, and design tokens
│   │   ├── header.css             # Header, topbar, mobile drawer, and search styling
│   │   ├── footer.css             # Footer columns, payment badges, and legal notes
│   │   ├── homepage.css           # Hero section, editorial split, and marquee ticker
│   │   ├── products.css           # Catalog grids, product cards, image zoom, PDP gallery
│   │   ├── cart.css               # Bag table, line items, and sliding bag drawer
│   │   ├── checkout.css           # Checkout form, address fields, and payment options
│   │   ├── components.css         # Buttons, inputs, badges, alerts, and consent banner
│   │   ├── responsive.css         # Media queries for tablet (<=900px) and mobile (<=640px)
│   │   └── app.css                # Preserved monolithic stylesheet for backward compatibility
│   │
│   ├── js/                        # Modular frontend JavaScript (progressive enhancement)
│   │   ├── main.js                # Core frontend orchestrator
│   │   ├── navigation.js          # Mobile drawer toggle, keyboard navigation, focus trap
│   │   ├── products.js            # Image zoom (click & hover follow) and stock status updates
│   │   ├── cart.js                # AJAX add-to-bag, quantity steppers, cart drawer modal
│   │   ├── checkout.js            # Client-side form handling and demo simulator triggers
│   │   ├── search.js              # Live search panel toggle and Escape key handling
│   │   ├── components.js          # Wishlist toggle, scroll animations, confirm dialogs
│   │   ├── consent.js             # Standalone DPDP cookie consent engine
│   │   └── app.js                 # Preserved bundle script
│   │
│   ├── img/                       # Product renders, category imagery, and editorial photos
│   ├── images/                    # Mirrors /img for flexible URL referencing
│   └── fonts/                     # Self-hosted Space Grotesk & Inter typefaces (no external CDN)
│
├── data/                          # SQLite database and test results storage
│   ├── aestheticnova.db           # SQLite WAL-mode transactional database
│   └── test-results.json          # Cached verification report output
│
├── scripts/                       # Operational and maintenance automation scripts
│   ├── build.js                   # Project syntax, schema, and contrast verification build
│   ├── backup.js                  # Online SQLite checkpoint and configuration snapshot
│   ├── seed.js                    # Catalog and category database seeding
│   └── export-report.js           # Markdown compliance report generator
│
├── batch/                         # Windows automation scripts (.bat)
│   ├── start.bat                  # Starts website with local demo environment
│   ├── dev.bat                    # Starts website in watch mode (auto-reload on save)
│   ├── install.bat                # Clean dependency installation via npm
│   ├── build.bat                  # Runs full verification build
│   └── backup.bat                 # Generates a timestamped database & config backup
│
└── documentation/                 # Architectural and developer guides
    ├── PROJECT_STRUCTURE.md       # (This file) Complete codebase architectural map
    ├── JAVASCRIPT_GUIDE.md        # Guide to backend services, controllers, and frontend JS
    ├── EJS_GUIDE.md               # Templating conventions, partials, and layout architecture
    ├── CSS_GUIDE.md               # Design tokens, BEM conventions, and WCAG contrast rules
    ├── BATCH_GUIDE.md             # Windows automation scripts reference
    └── PAYMENT_GUIDE.md           # Guide to Demo simulator and Razorpay live gateway setup
```
