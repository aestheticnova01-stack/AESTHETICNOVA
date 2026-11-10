'use strict';
/**
 * AESTHETICNOVA — Auth Controller
 * Customer registration, sign-in, session destruction, account dashboard, and profile management.
 */

const db = require('../src/db');
const { passwordHash, passwordVerify } = require('../services/security.service');
const { rateLimit, hashPII } = require('../services/security.service');
const { rotateSession, destroySession } = require('../middleware/session.middleware');
const { validateEmail, validatePhone, sanitizeText, audit, queueMessage, securityEvent } = require('../src/util');

const PASSWORD_MIN = 10;

function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

function renderRegister(req, res) {
  if (req.user) return res.redirect('/account');
  res.render('account/register', {
    pageTitle: 'Create an account — AESTHETICNOVA',
    metaDescription: 'Create an AESTHETICNOVA account to track orders and save pieces.',
    canonicalPath: 'account/register',
    noindex: true,
    errors: {},
    values: {},
    next: req.query.next || '',
  });
}

function processRegister(req, res) {
  if (req.user) return res.redirect('/account');
  const values = {
    full_name: sanitizeText(req.body.full_name, 80),
    email: sanitizeText(req.body.email, 254),
    phone: sanitizeText(req.body.phone, 20),
    next: safeNext(req.body.next),
  };
  const errors = {};
  const limiter = rateLimit({ key: `register:${hashPII(req.clientIp)}`, max: 6, windowMs: 15 * 60 * 1000 });
  if (!limiter.allowed) {
    errors.form = 'Too many sign-up attempts from this connection. Please try again in a few minutes.';
  }

  if (values.full_name.length < 2) errors.full_name = 'Enter your name as you want it on the order.';
  const email = validateEmail(values.email);
  if (!email.ok) errors.email = email.error; else values.email = email.value;

  if (values.phone) {
    const phone = validatePhone(values.phone, false);
    if (!phone.ok) errors.phone = phone.error; else values.phone = phone.value;
  }

  const pw = String(req.body.password || '');
  if (pw.length < PASSWORD_MIN) errors.password = `Use at least ${PASSWORD_MIN} characters. A short phrase works well.`;
  if (pw !== String(req.body.password_confirm || '')) errors.password_confirm = 'The two passwords do not match.';
  if (req.body.accept_terms !== '1') errors.accept_terms = 'You need to accept the Terms of Service and Privacy Policy to open an account.';

  if (!errors.email) {
    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(values.email);
    if (existing) errors.email = 'An account already exists for this email. Try signing in instead.';
  }

  if (Object.keys(errors).length) {
    return res.status(422).render('account/register', {
      pageTitle: 'Create an account — AESTHETICNOVA',
      canonicalPath: 'account/register',
      noindex: true,
      errors,
      values,
      next: values.next,
    });
  }

  const info = db.prepare(`INSERT INTO users (email,password_hash,full_name,phone,marketing_consent,marketing_consent_at)
    VALUES (?,?,?,?,?,CASE WHEN ?=1 THEN datetime('now') ELSE NULL END)`)
    .run(values.email, passwordHash(pw), values.full_name, values.phone || null,
      req.body.marketing_consent === '1' ? 1 : 0, req.body.marketing_consent === '1' ? 1 : 0);

  db.prepare('UPDATE carts SET user_id=? WHERE id=?').run(info.lastInsertRowid, req.session.id);
  rotateSession(req, res, info.lastInsertRowid);
  audit('user', 'account_created', 'user', info.lastInsertRowid, { marketing_consent: req.body.marketing_consent === '1' });

  queueMessage({
    channel: 'email',
    recipient: values.email,
    template: 'account_created',
    subject: 'Your AESTHETICNOVA account',
    body: 'Account created. Set a delivery address at checkout when you order.',
  });

  res.redirect('/account?welcome=1');
}

function renderLogin(req, res) {
  if (req.user) return res.redirect('/account');
  res.render('account/login', {
    pageTitle: 'Sign in — AESTHETICNOVA',
    canonicalPath: 'account/login',
    noindex: true,
    errors: {},
    values: {},
    next: req.query.next || '',
  });
}

function processLogin(req, res) {
  const email = sanitizeText(req.body.email, 254).toLowerCase();
  const password = String(req.body.password || '');
  const next = safeNext(req.body.next);
  const errors = {};
  const ipLimit = rateLimit({ key: `login-ip:${hashPII(req.clientIp)}`, max: 10, windowMs: 15 * 60 * 1000 });
  const acctLimit = rateLimit({ key: `login-acct:${hashPII(email)}`, max: 8, windowMs: 15 * 60 * 1000 });

  if (!ipLimit.allowed || !acctLimit.allowed) {
    securityEvent('login_rate_limited', email ? 'account' : 'ip', hashPII(req.clientIp));
    return res.status(429).render('account/login', {
      pageTitle: 'Sign in — AESTHETICNOVA',
      canonicalPath: 'account/login',
      noindex: true,
      errors: { form: 'Too many sign-in attempts. Please wait about 15 minutes, or reset your password.' },
      values: { email },
      next,
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE email=? AND deleted_at IS NULL').get(email);
  const generic = 'Email or password is not correct.';

  if (!user) {
    errors.form = generic;
  } else if (user.locked_until && new Date(user.locked_until.replace(' ', 'T') + 'Z') > new Date()) {
    errors.form = 'This account is temporarily locked after repeated failed attempts. Try again in 15 minutes.';
  } else if (!passwordVerify(password, user.password_hash)) {
    const failed = user.failed_logins + 1;
    db.prepare('UPDATE users SET failed_logins=?, locked_until=? WHERE id=?')
      .run(failed, failed >= 8 ? new Date(Date.now() + 15 * 60000).toISOString().slice(0, 19).replace('T', ' ') : null, user.id);
    if (failed >= 8) securityEvent('account_locked', `user:${user.id}`, hashPII(req.clientIp));
    errors.form = generic;
  }

  if (Object.keys(errors).length) {
    return res.status(401).render('account/login', {
      pageTitle: 'Sign in — AESTHETICNOVA',
      canonicalPath: 'account/login',
      noindex: true,
      errors,
      values: { email },
      next,
    });
  }

  db.prepare("UPDATE users SET failed_logins=0, locked_until=NULL, last_login_at=datetime('now') WHERE id=?").run(user.id);
  db.prepare('UPDATE carts SET user_id=? WHERE id=?').run(user.id, req.session.id);
  rotateSession(req, res, user.id);
  audit('user', 'signed_in', 'user', user.id);

  res.redirect(next);
}

function logout(req, res) {
  const userId = req.user ? req.user.id : null;
  destroySession(req, res);
  if (userId) audit('user', 'signed_out', 'user', userId);
  res.redirect('/');
}

function renderAccount(req, res) {
  const orders = db.prepare(`SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=o.id) items
                             FROM orders o WHERE o.user_id=? ORDER BY o.created_at DESC LIMIT 25`).all(req.user.id);
  const requests = db.prepare(`SELECT ref, request_type, status, created_at, due_by FROM dsar_requests
                               WHERE user_id=? ORDER BY created_at DESC LIMIT 10`).all(req.user.id);

  res.render('account/index', {
    pageTitle: 'Your account — AESTHETICNOVA',
    canonicalPath: 'account',
    noindex: true,
    metaDescription: 'Your orders, wishlist and privacy requests.',
    orders,
    requests,
    welcome: req.query.welcome === '1',
  });
}

function renderProfile(req, res) {
  res.render('account/profile', {
    pageTitle: 'Your details — AESTHETICNOVA',
    canonicalPath: 'account/profile',
    noindex: true,
    metaDescription: 'Manage your contact details and marketing preferences.',
    errors: {},
    values: {},
    saved: req.query.saved === '1',
  });
}

function updateProfile(req, res) {
  const values = {
    full_name: sanitizeText(req.body.full_name, 80),
    phone: sanitizeText(req.body.phone, 20),
  };
  const errors = {};
  if (values.full_name.length < 2) errors.full_name = 'Enter your name.';
  if (values.phone) {
    const p = validatePhone(values.phone, false);
    if (!p.ok) errors.phone = p.error; else values.phone = p.value;
  }
  if (Object.keys(errors).length) {
    return res.status(422).render('account/profile', {
      pageTitle: 'Your details — AESTHETICNOVA',
      canonicalPath: 'account/profile',
      noindex: true,
      metaDescription: '',
      errors,
      values,
      saved: false,
    });
  }

  const marketing = req.body.marketing_consent === '1' ? 1 : 0;
  const previous = db.prepare('SELECT marketing_consent FROM users WHERE id=?').get(req.user.id).marketing_consent;
  db.prepare(`UPDATE users SET full_name=?, phone=?,
              marketing_consent=?, marketing_consent_at=CASE WHEN ?<>? THEN datetime('now') ELSE marketing_consent_at END
              WHERE id=?`).run(values.full_name, values.phone || null, marketing, marketing, previous, req.user.id);
  if (previous !== marketing) {
    audit('user', marketing ? 'marketing_consent_given' : 'marketing_consent_withdrawn', 'user', req.user.id);
  }
  res.redirect('/account/profile?saved=1');
}

function renderCustomerOrder(req, res, next) {
  const order = db.prepare('SELECT * FROM orders WHERE ref=? AND user_id=?').get(req.params.ref, req.user.id);
  if (!order) return next();
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id=?').all(order.id);
  res.render('checkout/confirmation', {
    pageTitle: `Order ${order.ref} — AESTHETICNOVA`,
    canonicalPath: `account/orders/${order.ref}`,
    noindex: true,
    metaDescription: 'Order details.',
    order,
    items,
    payments,
    accountView: true,
  });
}

module.exports = {
  renderRegister,
  processRegister,
  renderLogin,
  processLogin,
  logout,
  renderAccount,
  renderProfile,
  updateProfile,
  renderCustomerOrder,
};
