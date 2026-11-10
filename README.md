# AESTHETICNOVA — Complete Architectural & Operational Guide

Welcome to the newly reorganized and professionally modularized codebase for **AESTHETICNOVA** — a minimal streetwear jewellery e-commerce platform built for the Indian market.

---

## Quick Start on Windows

1. **Install Dependencies**:
   Double-click `batch\install.bat` (or run `npm install` in your terminal).
2. **Start the Website**:
   Double-click `start-windows.bat` in the project root (or `batch\start.bat`).
3. **Open the Website**:
   Navigate to [http://localhost:3000](http://localhost:3000) in Google Chrome, Microsoft Edge, or Firefox.
4. **Access the Admin Portal**:
   - URL: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
   - Email: `owner@aestheticnova.local`
   - Password: `LocalDemo-Only-Change-This-7391!`
   - *Note: Payments run in DEMO simulator mode by default. No real money will be charged.*

---

## Master Directory: Where to Find & Edit Everything

Below is the definitive reference answering exactly which files to edit for every website feature:

### 1. Website Logo
- **Text & Brand Name**:
  - Central config: [`config/site.config.js`](file:///config/site.config.js) (`name: 'AESTHETICNOVA'`).
  - Header markup: [`views/partials/header.ejs`](file:///views/partials/header.ejs) (line 15: `<a class="brand" href="/">AESTHETIC<span>NOVA</span></a>`).
  - Footer markup: [`views/partials/footer.ejs`](file:///views/partials/footer.ejs) (line 5).
- **SVG Favicon / Icon**:
  - Defined in [`views/partials/head.ejs`](file:///views/partials/head.ejs) (line 11).
- **Styling**:
  - Defined in [`public/css/header.css`](file:///public/css/header.css) under `.brand`.

---

### 2. Header and Navigation
- **Top Announcement Bar**:
  - Edit text, free shipping threshold, and return window in [`views/partials/header.ejs`](file:///views/partials/header.ejs) (lines 1–5).
- **Desktop Navigation Links**:
  - Edit links, category filters, and active indicators in [`views/partials/navbar.ejs`](file:///views/partials/navbar.ejs).
  - Configured centrally in [`config/site.config.js`](file:///config/site.config.js) under `navigation`.
- **Mobile Menu Drawer**:
  - Markup in [`views/partials/header.ejs`](file:///views/partials/header.ejs) (lines 60–73).
  - Slide-out toggle and keyboard logic in [`public/js/navigation.js`](file:///public/js/navigation.js).
  - Styling in [`public/css/header.css`](file:///public/css/header.css) (`.mobile-nav`).
- **Search Bar Overlay**:
  - Component template: [`views/components/search-panel.ejs`](file:///views/components/search-panel.ejs).
  - Search toggle logic: [`public/js/search.js`](file:///public/js/search.js).

---

### 3. Homepage Banner & Editorial Sections
- **Template Markup**:
  - Located in [`views/pages/home.ejs`](file:///views/pages/home.ejs) (and [`views/home.ejs`](file:///views/home.ejs)).
- **Hero Image & Headlines**:
  - Hero image: [`public/img/hero-editorial.jpg`](file:///public/img/hero-editorial.jpg).
  - Display headline, manifesto, and CTA buttons: [`views/pages/home.ejs`](file:///views/pages/home.ejs) (`.hero`).
- **Category Highlights & Editorial Split**:
  - Category grid markup: [`views/pages/home.ejs`](file:///views/pages/home.ejs) (`.cat-grid`).
  - Editorial imagery: [`public/img/lookbook-01.jpg`](file:///public/img/lookbook-01.jpg) and [`public/img/lookbook-02.jpg`](file:///public/img/lookbook-02.jpg).
- **Styling**:
  - Located in [`public/css/homepage.css`](file:///public/css/homepage.css).

---

### 4. Product Images
- **Storage Location**:
  - Primary directory: [`public/img/`](file:///public/img/) (also mirrored at [`public/images/`](file:///public/images/)).
- **Default Asset Files**:
  - Rings: `p-signet.jpg`, `p-band.jpg`, `cat-rings.jpg`
  - Chains: `cat-chains.jpg`
  - Pendants: `cat-pendants.jpg`
  - Bracelets: `cat-bracelets.jpg`
  - Earrings: `cat-earrings.jpg`
  - Accessories: `p-cap.svg`, `p-tote.svg`
- **Database Image Associations**:
  - Seeded in [`src/seed.js`](file:///src/seed.js) (`image` and `image_alt` columns in `products` table).
  - Licences & Attribution register: [`src/assets.js`](file:///src/assets.js) and [`views/legal/licences.ejs`](file:///views/legal/licences.ejs).

---

### 5. Product Names, Prices, and Stock
- **Database Storage**:
  - Stored in SQLite database [`data/aestheticnova.db`](file:///data/aestheticnova.db) in tables `products` and `variants`.
- **Modifying via Admin Console**:
  - Navigate to [http://localhost:3000/admin/inventory](http://localhost:3000/admin/inventory) to modify variant stock in real-time.
- **Initial Seed Data**:
  - Default catalogue and pricing are defined in [`src/seed.js`](file:///src/seed.js).
  - All prices are integers in **paise** (e.g. ₹1,499 = `149900` paise).
- **Data Access Layer**:
  - Managed in [`services/product.service.js`](file:///services/product.service.js).

---

### 6. Product Descriptions & Details
- **Template Display**:
  - Rendered in [`views/pages/product.ejs`](file:///views/pages/product.ejs) (and [`views/shop/product.ejs`](file:///views/shop/product.ejs)).
- **Database Content**:
  - Detailed bullet specifications are stored as JSON in `products.details` in [`src/seed.js`](file:///src/seed.js).
  - Materials (`316L stainless steel`), care instructions, and country of origin (`India`).

---

### 7. Product Cards
- **Component Markup**:
  - Reusable template: [`views/components/product-card.ejs`](file:///views/components/product-card.ejs) (and [`views/partials/product-card.ejs`](file:///views/partials/product-card.ejs)).
- **Display Features**:
  - Out-of-stock badge / New arrival indicator.
  - Price label formatted in INR with embedded GST notice.
  - Star ratings and review count badge.
  - Accessible wishlist heart button.
- **Styling**:
  - Located in [`public/css/products.css`](file:///public/css/products.css) under `.product-card`.

---

### 8. Shopping Cart System
- **Cart Page Template**:
  - Dedicated page: [`views/pages/cart.ejs`](file:///views/pages/cart.ejs) (and [`views/cart/index.ejs`](file:///views/cart/index.ejs)).
- **Interactive Cart Drawer**:
  - Template: [`views/components/cart-drawer.ejs`](file:///views/components/cart-drawer.ejs).
  - Client-side slide-over and dynamic line items: [`public/js/cart.js`](file:///public/js/cart.js).
  - JSON Drawer API: `GET /api/cart` in [`routes/cart.routes.js`](file:///routes/cart.routes.js).
- **Business Logic & Stock Capping**:
  - Server-side cart management: [`services/cart.service.js`](file:///services/cart.service.js).
  - Prevents adding more units than physically exist in stock.
- **Styling**:
  - Located in [`public/css/cart.css`](file:///public/css/cart.css).

---

### 9. Checkout System
- **Checkout Page Template**:
  - Dedicated page: [`views/pages/checkout.ejs`](file:///views/pages/checkout.ejs) (and [`views/checkout/index.ejs`](file:///views/checkout/index.ejs)).
- **Input Validation & Security**:
  - Controller: [`controllers/checkout.controller.js`](file:///controllers/checkout.controller.js).
  - Indian phone number validation (10 digits starting with 6, 7, 8, 9).
  - 6-digit PIN code validation.
  - Indian states dropdown validation.
- **Order Placement**:
  - Service: [`services/order.service.js`](file:///services/order.service.js).
  - Decrements variant stock inside an atomic SQLite transaction.
- **Styling**:
  - Located in [`public/css/checkout.css`](file:///public/css/checkout.css).

---

### 10. Payment Gateway Integration
- **Central Payment Configuration**:
  - Config file: [`config/payment.config.js`](file:///config/payment.config.js).
- **Supported Modes**:
  - `demo`: Built-in local test payment simulator.
  - `razorpay`: Live Razorpay Orders API integration with HMAC-SHA256 signature verification.
- **Payment Service**:
  - Backend API: [`services/payment.service.js`](file:///services/payment.service.js).
- **Payment Step Template**:
  - Template: [`views/checkout/pay.ejs`](file:///views/checkout/pay.ejs).
- **Detailed Setup Guide**:
  - See [`documentation/PAYMENT_GUIDE.md`](file:///documentation/PAYMENT_GUIDE.md) for step-by-step merchant onboarding and webhook configuration.

---

### 11. Order Management & Tracking
- **Customer Self-Service Order Tracking**:
  - Route: `GET /track-order` in [`routes/order.routes.js`](file:///routes/order.routes.js).
  - Controller: [`controllers/order.controller.js`](file:///controllers/order.controller.js).
  - Template: [`views/checkout/track.ejs`](file:///views/checkout/track.ejs).
- **Order Confirmation & Invoices**:
  - Template: [`views/checkout/confirmation.ejs`](file:///views/checkout/confirmation.ejs).
- **Admin Order Dashboard**:
  - Orders list: [`views/admin/orders.ejs`](file:///views/admin/orders.ejs).
  - Order fulfillment, status update, and shipment notes: [`views/admin/order-detail.ejs`](file:///views/admin/order-detail.ejs).
  - Admin Controller: [`controllers/admin.controller.js`](file:///controllers/admin.controller.js).

---

### 12. Footer
- **Template**:
  - Located in [`views/partials/footer.ejs`](file:///views/partials/footer.ejs).
- **Content Blocks**:
  - Brand tagline and payment icons (UPI, Cards, Net banking, COD).
  - Shop links, Help & Support links, Legal & Privacy links.
  - Dynamic business details (address, email, phone, support hours).
  - Grievance officer appointment notice and copyright year.
- **Styling**:
  - Located in [`public/css/footer.css`](file:///public/css/footer.css).

---

### 13. Website Colors and Fonts
- **Central Color & Font Tokens**:
  - Edit in [`public/css/variables.css`](file:///public/css/variables.css).
- **Primary Design Tokens**:
  - Canvas Background: `--bg: #F7F7F5`
  - Primary Ink / Text: `--ink: #111111`
  - Secondary Body: `--body: #595959`
  - Dark Surface: `--dark: #191919`
  - Focus Ring: `--focus: #0B5CD5`
- **Fonts**:
  - Display Font: `Space Grotesk` self-hosted in [`public/fonts/space-grotesk.woff2`](file:///public/fonts/space-grotesk.woff2).
  - Body Font: `Inter` self-hosted in [`public/fonts/inter.woff2`](file:///public/fonts/inter.woff2).
  - Zero external calls to Google Fonts at runtime (100% privacy-preserving).

---

### 14. Mobile Responsive Design
- **Dedicated Stylesheet**:
  - Located in [`public/css/responsive.css`](file:///public/css/responsive.css).
- **Breakpoints**:
  - Tablet: `@media (max-width: 900px)` — converts navigation to hamburger menu, stacks cart and checkout summaries.
  - Mobile: `@media (max-width: 640px)` — adjusts gutters, optimizes category card layout, and stacks product detail image galleries.

---

### 15. Central Website Configuration
- **Site Identity & Policies**:
  - Edit in [`config/site.config.js`](file:///config/site.config.js).
- **Payment & Gateway Settings**:
  - Edit in [`config/payment.config.js`](file:///config/payment.config.js).
- **Database Settings**:
  - Edit in [`config/database.config.js`](file:///config/database.config.js).
- **Environment Overrides**:
  - Copy [`.env.example`](file:///.env.example) to `.env` to configure port, database path, admin credentials, and live API secrets.

---

### 16. EJS Templates
- **Template Roots**:
  - Organized under [`views/`](file:///views/).
  - High-level templates reside in [`views/pages/`](file:///views/pages/).
  - Modular inclusions reside in [`views/partials/`](file:///views/partials/) and [`views/components/`](file:///views/components/).
- **Templating Manual**:
  - See [`documentation/EJS_GUIDE.md`](file:///documentation/EJS_GUIDE.md).

---

### 17. JavaScript Functionality
- **Server Application**:
  - Bootstrapper: [`server.js`](file:///server.js).
  - Routing: [`routes/`](file:///routes/).
  - Controller Handlers: [`controllers/`](file:///controllers/).
  - Core Business Services: [`services/`](file:///services/).
- **Browser Client Scripts**:
  - Located in [`public/js/`](file:///public/js/).
- **JavaScript Manual**:
  - See [`documentation/JAVASCRIPT_GUIDE.md`](file:///documentation/JAVASCRIPT_GUIDE.md).

---

### 18. Windows Batch Commands
- **Scripts Location**:
  - Located in [`batch/`](file:///batch/).
- **Quick Commands**:
  - `batch\start.bat`: Start application.
  - `batch\dev.bat`: Start application with live watch mode.
  - `batch\install.bat`: Clean install dependencies via npm.
  - `batch\build.bat`: Run full verification build.
  - `batch\backup.bat`: Create snapshot of database and settings.
- **Batch Manual**:
  - See [`documentation/BATCH_GUIDE.md`](file:///documentation/BATCH_GUIDE.md).

---

## Testing & Quality Verification

To verify that the restructured codebase passes all syntax, schema, and design requirements:
```bash
npm run build
```
Or double-click `batch\build.bat`.

To run the WCAG 2.2 AA color contrast audit:
```bash
npm run test:contrast
```

---

## Deployment Instructions

1. **Prerequisites**: A Linux or Windows server with Node.js 20+ installed.
2. **Environment**:
   Copy `.env.example` to `.env` and configure:
   - `NODE_ENV=production`
   - `PORT=80` (or behind a reverse proxy like Nginx / Caddy on `3000`)
   - `FORCE_HTTPS=true`
   - `ADMIN_EMAIL=your-real-email@domain.com`
   - `ADMIN_PASSWORD=YourStrongPasswordHere`
   - `PRIVACY_HASH_SALT=your-unique-random-salt-string`
   - `PAYMENT_MODE=razorpay` (with your merchant keys)
3. **Install Dependencies**:
   ```bash
   npm ci --omit=dev
   ```
4. **Run Verification Build**:
   ```bash
   npm run build
   ```
5. **Start Production Service**:
   ```bash
   npm start
   ```
   *(Or manage with PM2 / systemd: `pm2 start server.js --name aestheticnova`)*
