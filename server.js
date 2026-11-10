'use strict';
/**
 * AESTHETICNOVA — Application Server
 * Premium minimal streetwear jewellery e-commerce platform.
 *
 * Architecture:
 * - Express + EJS + Better-SQLite3
 * - Strict Content Security Policy (0 third-party trackers, zero CDN dependencies)
 * - DPDP Act 2023 & Consumer Protection Act 2019 compliance
 * - Fully modularized MVC + Services architecture
 */

const path = require('path');
const express = require('express');
const config = require('./config');
const db = require('./src/db');
const { seed } = require('./src/seed');
const {
  securityHeaders,
  httpsRedirect,
  clientIp,
  sessionMiddleware,
  csrfMiddleware,
  consentMiddleware,
  notFoundHandler,
  errorHandler,
} = require('./middleware');
const { inr, fmtDate, fmtDateTime, setting, INDIAN_STATES } = require('./src/util');
const { pricingRules } = require('./services/pricing.service');
const { getWishlistProductIds } = require('./services/product.service');
const { getCartCount } = require('./services/cart.service');

// Seed database on initial startup if empty
if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
  seed();
}

const app = express();

// View Engine & Multi-Directory Template Lookup
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views', 'pages'),
  path.join(__dirname, 'views'),
]);
app.set('trust proxy', config.TRUST_PROXY);
app.disable('x-powered-by');

/* ------------------------------- transport ------------------------------ */
app.use(httpsRedirect);
app.use(clientIp);
app.use(securityHeaders(config.FORCE_HTTPS));

/* --------------------------- body + cookies ---------------------------- */
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(express.json({ limit: '64kb' }));
app.use(sessionMiddleware);
app.use(csrfMiddleware);
app.use(consentMiddleware);

/* ------------------------------ static -------------------------------- */
const staticMaxAge = config.NODE_ENV === 'production' ? '7d' : 0;
app.use('/css', express.static(path.join(__dirname, 'public', 'css'), { maxAge: staticMaxAge }));
app.use('/js', express.static(path.join(__dirname, 'public', 'js'), { maxAge: staticMaxAge }));
app.use('/img', express.static(path.join(__dirname, 'public', 'img'), { maxAge: config.NODE_ENV === 'production' ? '30d' : 0 }));
app.use('/images', express.static(path.join(__dirname, 'public', 'images'), { maxAge: config.NODE_ENV === 'production' ? '30d' : 0 }));
app.use('/fonts', express.static(path.join(__dirname, 'public', 'fonts'), {
  maxAge: config.NODE_ENV === 'production' ? '365d' : 0,
  immutable: config.NODE_ENV === 'production',
}));

/* --------------------------- request logging --------------------------- */
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.path.startsWith('/admin')) return;
    if (res.statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error(`[error] ${req.method} ${req.path} -> ${res.statusCode}`);
    }
  });
  next();
});

/* ----------------------- consent-gated analytics ----------------------- */
app.use((req, res, next) => {
  if (req.method === 'GET'
    && !req.path.startsWith('/admin')
    && !req.path.startsWith('/api')
    && req.consent
    && req.consent.analytics
    && (req.accepts(['html', 'json']) === 'html')) {
    try {
      const bucket = req.path.startsWith('/product/') ? '/product/:slug'
        : req.path.startsWith('/shop') ? '/shop'
          : req.path;
      db.prepare(`INSERT INTO analytics_daily (day,path,visits) VALUES (date('now'),?,1)
                  ON CONFLICT(day,path) DO UPDATE SET visits=visits+1`).run(bucket.slice(0, 120));
    } catch { /* analytics must never break a page */ }
  }
  next();
});

/* ------------------------------ globals ------------------------------- */
app.use((req, res, next) => {
  const rules = pricingRules();
  res.locals.consentRecorded = Boolean(req.consent && req.consent.ts);
  res.locals.biz = config.BIZ;
  res.locals.businessConfigured = config.businessConfigured;
  res.locals.user = req.user;
  res.locals.path = req.path;
  res.locals.query = req.query || {};
  res.locals.currentNav = '';
  res.locals.pageTitle = 'AESTHETICNOVA';
  res.locals.metaDescription = 'Stainless steel rings, chains, pendants, bracelets and earrings from AESTHETICNOVA. Everyday essentials. Unordinary details.';
  res.locals.policyVersion = config.POLICY_VERSION;
  res.locals.cookiePolicyVersion = config.COOKIE_POLICY_VERSION;
  res.locals.termsVersion = config.TERMS_VERSION;
  res.locals.returnWindow = Number(setting('return_window_days', config.RETURN_WINDOW_DAYS));
  res.locals.codEnabled = rules.codEnabled;
  res.locals.freeShipLabel = inr(rules.freeShippingThreshold);
  res.locals.paymentMode = config.PAYMENT_MODE;
  res.locals.paymentsLive = config.paymentsLive;
  res.locals.states = INDIAN_STATES;
  res.locals.inr = inr;
  res.locals.fmtDate = fmtDate;
  res.locals.fmtDateTime = fmtDateTime;
  res.locals.wishlistIds = req.user ? getWishlistProductIds(req.user.id) : [];
  res.locals.cartCount = req.session ? getCartCount(req.session.id) : 0;
  next();
});

/* ------------------------------- routes -------------------------------- */
app.use('/', require('./routes/index.routes'));
app.use('/', require('./routes/consent.routes'));
app.use('/', require('./routes/product.routes'));
app.use('/', require('./routes/cart.routes'));
app.use('/', require('./routes/auth.routes'));
app.use('/', require('./routes/checkout.routes'));
app.use('/', require('./routes/order.routes'));
app.use('/', require('./routes/review.routes'));
app.use('/', require('./routes/privacy.routes'));
app.use('/', require('./routes/support.routes'));
app.use('/admin', require('./routes/admin.routes'));

/* ------------------------------- 404 / 500 ----------------------------- */
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`AESTHETICNOVA listening on 0.0.0.0:${config.PORT} (env=${config.NODE_ENV}, payments=${config.PAYMENT_MODE}${config.paymentsLive ? '-live' : '-simulated'})`);
    // eslint-disable-next-line no-console
    console.log(`Privacy posture: 3 first-party cookies, 0 third-party scripts, analytics ${config.ANALYTICS_SELF_HOSTED ? 'self-hosted and consent-gated' : 'off'}.`);
  });
}

module.exports = app;
