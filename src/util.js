'use strict';
/** Small shared helpers: money, GST maths, references, validation, settings. */
const crypto = require('crypto');
const db = require('./db');

/** ₹0-format. All internal amounts are integer paise — never floats. */
function inr(paise) {
  const n = Number(paise) / 100;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function inr2(paise) {
  const n = Number(paise) / 100;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Prices include GST at 18%; this derives the embedded tax component. */
function gstComponent(paiseInclusive, rate = 0.18) {
  return Math.round(paiseInclusive - paiseInclusive / (1 + rate));
}

function setting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
  return row ? row.value : fallback;
}

function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(key, String(value));
}

function ref(prefix) {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${prefix}-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function accessKey() { return crypto.randomBytes(24).toString('hex'); }

function addDays(days, from = new Date()) {
  return new Date(from.getTime() + days * 86400000);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^[1-9]\d{5}$/;

function validateEmail(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return { ok: false, error: 'Enter your email address.' };
  if (s.length > 254 || !EMAIL_RE.test(s)) return { ok: false, error: 'Enter a valid email address, for example name@example.com.' };
  return { ok: true, value: s };
}

function validatePhone(v, required = true) {
  const digits = String(v || '').replace(/[\s\-()]/g, '').replace(/^\+91/, '').replace(/^0/, '');
  if (!digits) return required ? { ok: false, error: 'Enter your mobile number for delivery updates.' } : { ok: true, value: '' };
  if (!PHONE_RE.test(digits)) return { ok: false, error: 'Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.' };
  return { ok: true, value: digits };
}

function validatePin(v) {
  const s = String(v || '').trim();
  if (!s) return { ok: false, error: 'Enter your 6-digit PIN code.' };
  if (!PIN_RE.test(s)) return { ok: false, error: 'Enter a valid 6-digit PIN code.' };
  return { ok: true, value: s };
}

/** Honeypot + timing check: cheap, privacy-respecting spam control. */
function spamCheck(body, { minSeconds = 2 } = {}) {
  if (body && typeof body.company_website === 'string' && body.company_website.trim() !== '') {
    return { spam: true, reason: 'honeypot' };
  }
  const t = Number(body && body.form_ts);
  if (Number.isFinite(t) && t > 0) {
    const elapsed = (Date.now() - t) / 1000;
    if (elapsed < minSeconds) return { spam: true, reason: 'too_fast' };
    if (elapsed > 6 * 3600) return { spam: true, reason: 'stale_form' };
  }
  return { spam: false };
}

function audit(actor, action, entity, entityId, detail) {
  try {
    db.prepare('INSERT INTO audit_log (actor,action,entity,entity_id,detail) VALUES (?,?,?,?,?)')
      .run(actor, action, entity || null, entityId != null ? String(entityId) : null,
        detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : null);
  } catch { /* logging must never break a request */ }
}

function securityEvent(kind, detail, ipHash) {
  try {
    db.prepare('INSERT INTO security_events (kind,detail,ip_hash) VALUES (?,?,?)')
      .run(kind, detail ? String(detail).slice(0, 500) : null, ipHash || null);
  } catch { /* ignore */ }
}

/** Queue an outbound message. We never pretend email/SMS was delivered. */
function queueMessage({ channel, recipient, subject, body, template }) {
  const deliveryState = channel === 'email' && config_emailConfigured() ? 'queued_provider'
    : 'not_configured';
  const info = db.prepare(`INSERT INTO outbox (channel,recipient,subject,body,template,delivery_state,provider_note)
    VALUES (?,?,?,?,?,?,?)`).run(
    channel, recipient || null, subject || null, body, template || null, deliveryState,
    deliveryState === 'not_configured'
      ? 'No email/SMS provider is connected. The message is stored in the outbox for manual handling.'
      : null,
  );
  return { id: info.lastInsertRowid, deliveryState };
}

function config_emailConfigured() {
  const c = require('./config');
  return c.EMAIL_MODE !== 'none' && !!c.SUPPORT_EMAIL_PROVIDER_URL;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
];

// Re-exported so every route has convenient imports for security helpers.
const { sanitizeText: _sanitizeText, rateLimit: _rateLimit } = require('./security');
const sanitizeText = _sanitizeText;
const rateLimit = _rateLimit;

module.exports = {
  sanitizeText,
  rateLimit,
  inr, inr2, gstComponent, setting, setSetting, ref, accessKey, addDays,
  fmtDate, fmtDateTime, validateEmail, validatePhone, validatePin, spamCheck,
  audit, securityEvent, queueMessage, INDIAN_STATES,
};
