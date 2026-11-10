'use strict';
/**
 * AESTHETICNOVA — Admin Controller
 * Operational console for orders, inventory, settings, reviews moderation, DSAR requests, audit logs, and retention.
 */

const db = require('../src/db');
const config = require('../config');
const { passwordVerify, rateLimit, hashPII, passwordHash } = require('../services/security.service');
const { rotateSession, destroySession } = require('../middleware/session.middleware');
const { sanitizeText, audit, setSetting } = require('../src/util');

try {
  db.exec("ALTER TABLE sessions ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");
} catch { /* column already exists */ }

function ensureAdminUser() {
  try { db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"); } catch { /* exists */ }

  const wanted = config.ADMIN_EMAIL.toLowerCase();
  let admin = db.prepare('SELECT id FROM users WHERE is_admin=1').get();

  if (!admin) {
    const legacy = db.prepare(
      "SELECT id FROM users WHERE lower(email)=? OR lower(email)='admin@localhost' ORDER BY id LIMIT 1"
    ).get(wanted);
    if (legacy) {
      db.prepare('UPDATE users SET is_admin=1 WHERE id=?').run(legacy.id);
      admin = { id: legacy.id };
    }
  }

  if (admin) {
    const row = db.prepare('SELECT id, email, password_hash FROM users WHERE id=?').get(admin.id);
    if (row.email.toLowerCase() !== wanted) {
      const clash = db.prepare('SELECT id FROM users WHERE lower(email)=? AND id<>?').get(wanted, row.id);
      if (!clash) db.prepare('UPDATE users SET email=? WHERE id=?').run(config.ADMIN_EMAIL, row.id);
    }
    if (!passwordVerify(config.ADMIN_PASSWORD, row.password_hash)) {
      db.prepare('UPDATE users SET password_hash=?, is_admin=1 WHERE id=?')
        .run(passwordHash(config.ADMIN_PASSWORD), row.id);
    }
    return row.id;
  }

  const info = db.prepare(`INSERT INTO users (email,password_hash,full_name,marketing_consent,is_admin)
    VALUES (?,?,?,0,1)`).run(wanted, passwordHash(config.ADMIN_PASSWORD), 'Store administrator');
  return info.lastInsertRowid;
}

const ADMIN_ID = ensureAdminUser();

function renderAdminLogin(req, res) {
  if (req.user && req.user.id === ADMIN_ID) return res.redirect('/admin');
  res.render('admin/login', {
    pageTitle: 'Admin sign in — AESTHETICNOVA',
    canonicalPath: 'admin/login',
    noindex: true,
    metaDescription: '',
    errors: {},
    next: req.query.next || '/admin',
    defaultPassword: config.ADMIN_PASSWORD_IS_DEFAULT,
  });
}

function processAdminLogin(req, res) {
  const limiter = rateLimit({ key: `admin-login:${hashPII(req.clientIp)}`, max: 6, windowMs: 15 * 60000 });
  const email = sanitizeText(req.body.email, 254).toLowerCase();
  const pw = String(req.body.password || '');

  if (!limiter.allowed) {
    return res.status(429).render('admin/login', {
      pageTitle: 'Admin sign in — AESTHETICNOVA',
      canonicalPath: 'admin/login',
      noindex: true,
      metaDescription: '',
      errors: { form: 'Too many attempts. Wait 15 minutes.' },
      next: '/admin',
      defaultPassword: config.ADMIN_PASSWORD_IS_DEFAULT,
    });
  }

  const adminRow = db.prepare('SELECT email, password_hash FROM users WHERE id=?').get(ADMIN_ID);
  const ok = email === String(adminRow.email).toLowerCase() && passwordVerify(pw, adminRow.password_hash);
  if (!ok) {
    return res.status(401).render('admin/login', {
      pageTitle: 'Admin sign in — AESTHETICNOVA',
      canonicalPath: 'admin/login',
      noindex: true,
      metaDescription: '',
      errors: { form: 'Email or password is not correct.' },
      next: '/admin',
      defaultPassword: config.ADMIN_PASSWORD_IS_DEFAULT,
    });
  }

  rotateSession(req, res, ADMIN_ID);
  db.prepare("UPDATE sessions SET role='admin' WHERE user_id=? AND role<>'admin'").run(ADMIN_ID);
  audit('admin', 'admin_signed_in', 'user', ADMIN_ID);
  res.redirect('/admin');
}

function adminLogout(req, res) {
  destroySession(req, res);
  res.redirect('/admin/login');
}

function renderDashboard(req, res) {
  const stats = {
    orders: db.prepare('SELECT COUNT(*) c FROM orders').get().c,
    paidOrders: db.prepare("SELECT COUNT(*) c FROM orders WHERE payment_status='paid'").get().c,
    revenue: db.prepare("SELECT COALESCE(SUM(total_paise),0) s FROM orders WHERE payment_status IN ('paid','refund_pending')").get().s,
    openTickets: db.prepare("SELECT COUNT(*) c FROM support_tickets WHERE status NOT IN ('resolved','closed')").get().c,
    grievances: db.prepare("SELECT COUNT(*) c FROM support_tickets WHERE kind='grievance' AND status<>'resolved'").get().c,
    openDsar: db.prepare("SELECT COUNT(*) c FROM dsar_requests WHERE status NOT IN ('completed','rejected')").get().c,
    pendingReviews: db.prepare("SELECT COUNT(*) c FROM reviews WHERE status='pending'").get().c,
    lowStock: db.prepare('SELECT COUNT(*) c FROM variants WHERE stock<=2').get().c,
  };
  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 8').all();
  const recentDsar = db.prepare('SELECT * FROM dsar_requests ORDER BY id DESC LIMIT 8').all();

  res.render('admin/dashboard', {
    pageTitle: 'Admin — AESTHETICNOVA',
    canonicalPath: 'admin',
    noindex: true,
    metaDescription: '',
    stats,
    recentOrders,
    recentDsar,
    admin: true,
  });
}

function renderOrders(req, res) {
  const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 200').all();
  res.render('admin/orders', {
    pageTitle: 'Orders — Admin',
    canonicalPath: 'admin/orders',
    noindex: true,
    metaDescription: '',
    orders,
    admin: true,
  });
}

function renderOrderDetail(req, res, next) {
  const order = db.prepare('SELECT * FROM orders WHERE ref=?').get(req.params.ref);
  if (!order) return next();
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id=?').all(order.id);
  const events = db.prepare("SELECT * FROM audit_log WHERE entity='order' AND entity_id=? ORDER BY id DESC").all(order.ref);

  res.render('admin/order-detail', {
    pageTitle: `Order ${order.ref} — Admin`,
    canonicalPath: `admin/orders/${order.ref}`,
    noindex: true,
    metaDescription: '',
    order,
    items,
    payments,
    events,
    admin: true,
    statuses: ['placed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
  });
}

function updateOrderStatus(req, res, next) {
  const order = db.prepare('SELECT * FROM orders WHERE ref=?').get(req.params.ref);
  if (!order) return next();
  const status = sanitizeText(req.body.order_status, 20);
  const allowed = ['placed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!allowed.includes(status)) return res.status(400).json({ ok: false });

  db.prepare(`UPDATE orders SET order_status=?, updated_at=datetime('now'),
              invoice_number=CASE WHEN invoice_number IS NULL AND ? IN ('shipped','delivered')
                THEN 'INV-' || REPLACE(ref,'AN-','') ELSE invoice_number END
              WHERE id=?`).run(status, status, order.id);
  audit('admin', 'order_status_changed', 'order', order.ref, { from: order.order_status, to: status });
  res.redirect(`/admin/orders/${order.ref}`);
}

function renderDataRequests(req, res) {
  const requests = db.prepare('SELECT * FROM dsar_requests ORDER BY id DESC LIMIT 200').all();
  res.render('admin/data-requests', {
    pageTitle: 'Privacy & Data requests — Admin',
    canonicalPath: 'admin/data-requests',
    noindex: true,
    metaDescription: '',
    requests,
    admin: true,
  });
}

function renderDataRequestDetail(req, res, next) {
  const request = db.prepare('SELECT * FROM dsar_requests WHERE ref=?').get(req.params.ref);
  if (!request) return next();
  const events = db.prepare('SELECT * FROM dsar_events WHERE dsar_id=? ORDER BY id').all(request.id);
  res.render('admin/data-request-detail', {
    pageTitle: `${request.ref} — Admin`,
    canonicalPath: `admin/data-requests/${request.ref}`,
    noindex: true,
    metaDescription: '',
    request,
    events,
    admin: true,
  });
}

function verifyDataRequest(req, res, next) {
  const request = db.prepare('SELECT * FROM dsar_requests WHERE ref=?').get(req.params.ref);
  if (!request) return next();
  db.prepare("UPDATE dsar_requests SET status='verified', updated_at=datetime('now') WHERE id=?").run(request.id);
  db.prepare('INSERT INTO dsar_events (dsar_id,actor,event,detail) VALUES (?,?,?,?)')
    .run(request.id, 'admin', 'verified_manually', 'Identity verified by administrator');
  audit('admin', 'dsar_verified', 'dsar_request', request.ref);
  res.redirect(`/admin/data-requests/${request.ref}`);
}

function executeDataDeletion(req, res, next) {
  const request = db.prepare('SELECT * FROM dsar_requests WHERE ref=?').get(req.params.ref);
  if (!request) return next();
  const email = request.email;

  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET deleted_at=datetime('now'), deletion_state='soft_deleted' WHERE email=?").run(email);
    db.prepare(`UPDATE orders SET phone='REDACTED', address_line1='REDACTED', address_line2=NULL, notes=NULL
                WHERE email=? AND order_status IN ('delivered','cancelled','returned')`).run(email);
    db.prepare("UPDATE dsar_requests SET status='completed', resolved_at=datetime('now'), updated_at=datetime('now') WHERE id=?").run(request.id);
    db.prepare('INSERT INTO dsar_events (dsar_id,actor,event,detail) VALUES (?,?,?,?)')
      .run(request.id, 'admin', 'deletion_executed', 'Account marked deleted and closed order delivery details redacted.');
  });
  tx();
  audit('admin', 'dsar_deletion_executed', 'dsar_request', request.ref, { email_hash: hashPII(email) });
  res.redirect(`/admin/data-requests/${request.ref}`);
}

function resolveDataRequest(req, res, next) {
  const request = db.prepare('SELECT * FROM dsar_requests WHERE ref=?').get(req.params.ref);
  if (!request) return next();
  const note = sanitizeText(req.body.resolution_note, 1000);
  const status = sanitizeText(req.body.status, 30);
  db.prepare("UPDATE dsar_requests SET status=?, resolution_note=?, resolved_at=datetime('now'), updated_at=datetime('now') WHERE id=?")
    .run(status, note, request.id);
  db.prepare('INSERT INTO dsar_events (dsar_id,actor,event,detail) VALUES (?,?,?,?)')
    .run(request.id, 'admin', `resolved_${status}`, note);
  audit('admin', 'dsar_resolved', 'dsar_request', request.ref, { status });
  res.redirect(`/admin/data-requests/${request.ref}`);
}

function renderTickets(req, res) {
  const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY id DESC LIMIT 200').all();
  res.render('admin/tickets', {
    pageTitle: 'Support tickets — Admin',
    canonicalPath: 'admin/tickets',
    noindex: true,
    metaDescription: '',
    tickets,
    admin: true,
  });
}

function renderTicketDetail(req, res, next) {
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE ref=?').get(req.params.ref);
  if (!ticket) return next();
  const events = db.prepare('SELECT * FROM ticket_events WHERE ticket_id=? ORDER BY id').all(ticket.id);
  res.render('admin/ticket-detail', {
    pageTitle: `${ticket.ref} — Admin`,
    canonicalPath: `admin/tickets/${ticket.ref}`,
    noindex: true,
    metaDescription: '',
    ticket,
    events,
    admin: true,
    statuses: ['acknowledged', 'in_progress', 'awaiting_customer', 'resolved', 'closed'],
  });
}

function updateTicket(req, res, next) {
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE ref=?').get(req.params.ref);
  if (!ticket) return next();
  const status = sanitizeText(req.body.status, 30);
  const note = sanitizeText(req.body.note, 1000);
  const allowed = ['acknowledged', 'in_progress', 'awaiting_customer', 'resolved', 'closed'];
  if (!allowed.includes(status)) return res.status(400).json({ ok: false });

  db.prepare(`UPDATE support_tickets SET status=?, resolution_note=COALESCE(?, resolution_note),
              resolved_at=CASE WHEN ? IN ('resolved','closed') THEN datetime('now') ELSE resolved_at END,
              assigned_to=? WHERE id=?`)
    .run(status, note || null, status, config.ADMIN_EMAIL, ticket.id);
  db.prepare('INSERT INTO ticket_events (ticket_id,actor,event,detail) VALUES (?,?,?,?)')
    .run(ticket.id, 'admin', `status_${status}`, note);
  audit('admin', 'ticket_updated', 'support_ticket', ticket.ref, { status });
  res.redirect(`/admin/tickets/${ticket.ref}`);
}

function renderReviews(req, res) {
  const reviews = db.prepare(`SELECT r.*, p.name product_name, p.slug FROM reviews r
                              JOIN products p ON p.id=r.product_id ORDER BY r.id DESC LIMIT 200`).all();
  res.render('admin/reviews', {
    pageTitle: 'Review moderation — Admin',
    canonicalPath: 'admin/reviews',
    noindex: true,
    metaDescription: '',
    reviews,
    admin: true,
    policy: 'Moderation is limited to spam, abuse and personal data. Negative reviews are published.',
  });
}

function moderateReview(req, res) {
  const id = Number(req.params.id);
  const action = req.params.action;
  const review = db.prepare('SELECT * FROM reviews WHERE id=?').get(id);
  if (!review) return res.status(404).json({ ok: false });
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ ok: false });

  const note = sanitizeText(req.body.note, 500);
  if (action === 'reject' && !note) {
    return res.status(422).render('error', {
      title: 'Reason required',
      status: 422,
      message: 'Rejecting a review requires a written reason. We do not remove negative reviews, only spam, abuse or personal data.',
    });
  }

  db.prepare("UPDATE reviews SET status=?, moderated_at=datetime('now'), moderation_note=? WHERE id=?")
    .run(action === 'approve' ? 'approved' : 'rejected', note || 'approved in moderation', id);
  audit('admin', `review_${action}`, 'review', id, note);
  res.redirect('/admin/reviews');
}

function renderInventory(req, res) {
  const rows = db.prepare(`SELECT v.*, p.name, p.slug, p.price_paise FROM variants v
                           JOIN products p ON p.id=v.product_id ORDER BY p.name, v.position`).all();
  res.render('admin/inventory', {
    pageTitle: 'Inventory — Admin',
    canonicalPath: 'admin/inventory',
    noindex: true,
    metaDescription: '',
    rows,
    admin: true,
  });
}

function updateInventoryStock(req, res) {
  const stock = Math.max(0, Number(req.body.stock) || 0);
  db.prepare('UPDATE variants SET stock=? WHERE id=?').run(stock, Number(req.params.id));
  audit('admin', 'stock_updated', 'variant', req.params.id, { stock });
  res.redirect('/admin/inventory');
}

function renderSettings(req, res) {
  const rows = db.prepare('SELECT * FROM settings ORDER BY key').all();
  res.render('admin/settings', {
    pageTitle: 'Store settings — Admin',
    canonicalPath: 'admin/settings',
    noindex: true,
    metaDescription: '',
    rows,
    admin: true,
    saved: req.query.saved === '1',
  });
}

function updateSettings(req, res) {
  const numeric = ['shipping_paise', 'free_shipping_threshold_paise', 'cod_fee_paise', 'return_window_days'];
  Object.entries(req.body).forEach(([k, v]) => {
    if (k === '_csrf') return;
    if (!/^[a-z_]{3,40}$/.test(k)) return;
    if (numeric.includes(k)) {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return;
      setSetting(k, Math.round(n));
    } else {
      setSetting(k, sanitizeText(v, 500));
    }
  });
  audit('admin', 'settings_updated', 'settings', null, Object.keys(req.body).filter((k) => k !== '_csrf'));
  res.redirect('/admin/settings?saved=1');
}

function renderConsentLog(req, res) {
  const receipts = db.prepare('SELECT * FROM consent_receipts ORDER BY received_at DESC LIMIT 200').all();
  res.render('admin/consent-log', {
    pageTitle: 'Consent receipts — Admin',
    canonicalPath: 'admin/consent-log',
    noindex: true,
    metaDescription: '',
    receipts,
    admin: true,
  });
}

function renderAuditLog(req, res) {
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 300').all();
  const security = db.prepare('SELECT * FROM security_events ORDER BY id DESC LIMIT 100').all();
  res.render('admin/audit-log', {
    pageTitle: 'Audit and security log — Admin',
    canonicalPath: 'admin/audit-log',
    noindex: true,
    metaDescription: '',
    rows,
    security,
    admin: true,
  });
}

function renderRetention(req, res) {
  const retention = require('../src/retention');
  let report = [];
  try {
    report = retention.run({ dryRun: true });
  } catch (e) {
    report = [{ rule: 'error', description: e.message, affected: -1 }];
  }
  const lastRun = db.prepare("SELECT * FROM audit_log WHERE action='retention_job_run' ORDER BY id DESC LIMIT 1").get();
  res.render('admin/retention', {
    pageTitle: 'Retention job — Admin',
    canonicalPath: 'admin/retention',
    noindex: true,
    metaDescription: '',
    report,
    lastRun,
    admin: true,
    applied: req.query.applied === '1',
  });
}

function runRetentionJob(req, res) {
  const retention = require('../src/retention');
  const report = retention.run({ dryRun: req.body.dry_run === '1' });
  if (req.body.dry_run === '1') return res.redirect('/admin/retention');
  audit('admin', 'retention_job_triggered_manually', 'retention', null,
    report.map((r) => `${r.rule}:${r.affected}`).join(', '));
  res.redirect('/admin/retention?applied=1');
}

function logDarkPatternAudit(req, res) {
  const findings = sanitizeText(req.body.findings, 3000);
  setSetting('last_dark_pattern_audit', new Date().toISOString());
  audit('admin', 'dark_pattern_self_audit', 'settings', null, findings || 'Completed with no findings recorded.');
  res.redirect('/admin/audit-log');
}

module.exports = {
  ADMIN_ID,
  ensureAdminUser,
  renderAdminLogin,
  processAdminLogin,
  adminLogout,
  renderDashboard,
  renderOrders,
  renderOrderDetail,
  updateOrderStatus,
  renderDataRequests,
  renderDataRequestDetail,
  verifyDataRequest,
  executeDataDeletion,
  resolveDataRequest,
  renderTickets,
  renderTicketDetail,
  updateTicket,
  renderReviews,
  moderateReview,
  renderInventory,
  updateInventoryStock,
  renderSettings,
  updateSettings,
  renderConsentLog,
  renderAuditLog,
  renderRetention,
  runRetentionJob,
  logDarkPatternAudit,
};
