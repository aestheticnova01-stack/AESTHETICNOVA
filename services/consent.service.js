'use strict';
/**
 * AESTHETICNOVA — Consent Service
 * Manages consent categories, receipts, cookies, and compliance with DPDP Act 2023.
 */

const crypto = require('crypto');
const db = require('../src/db');
const config = require('../config');
const { hashPII } = require('./security.service');

const CATEGORIES = ['necessary', 'functional', 'analytics', 'marketing'];
const CATEGORY_META = {
  necessary: {
    label: 'Strictly necessary',
    always: true,
    description: 'Required for the cart, sign-in, checkout and remembering your choices. These cannot be switched off because the shop would stop working.',
  },
  functional: {
    label: 'Functional',
    always: false,
    description: 'Remembers optional conveniences such as your preferred sort order. Off by default.',
  },
  analytics: {
    label: 'Analytics',
    always: false,
    description: 'Counts anonymous page visits on our own server so we know which products people look at. No cookie, no third-party tracking, no cross-site profiling. Off by default.',
  },
  marketing: {
    label: 'Marketing',
    always: false,
    description: 'Would let advertising platforms measure or retarget campaigns. No advertising pixel is installed on this site. Off by default.',
  },
};

const DEFAULT_STATE = Object.freeze({
  v: 1,
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  ts: null,
  receipt: null,
  gpc: false,
  source: 'default',
});

function currentPolicyVersion() {
  return config.COOKIE_POLICY_VERSION;
}

function normalize(input) {
  const out = { necessary: true };
  CATEGORIES.filter(c => c !== 'necessary').forEach((c) => {
    const raw = input ? input[c] : undefined;
    out[c] = raw === true || raw === 'true' || raw === 'on' || raw === 1 || raw === '1';
  });
  return out;
}

function recordReceipt({ categories, source, sessionId, req, gpc = false }) {
  const norm = normalize(categories);
  const id = 'CR-' + crypto.randomBytes(9).toString('hex').toUpperCase();
  db.prepare(`
    INSERT INTO consent_receipts
    (id, policy_version, necessary, functional, analytics, marketing, source, gpc, session_id, ip_hash, ua_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    currentPolicyVersion(),
    1,
    norm.functional ? 1 : 0,
    norm.analytics ? 1 : 0,
    norm.marketing ? 1 : 0,
    source,
    gpc ? 1 : 0,
    sessionId || null,
    hashPII(req && req.clientIp),
    hashPII(req && req.get && req.get('user-agent'))
  );

  if (sessionId) {
    db.prepare(`
      UPDATE consent_receipts SET withdrawn_at = datetime('now')
      WHERE session_id = ? AND id <> ? AND withdrawn_at IS NULL
      AND NOT (necessary=1 AND functional=? AND analytics=? AND marketing=?)
    `).run(sessionId, id, norm.functional ? 1 : 0, norm.analytics ? 1 : 0, norm.marketing ? 1 : 0);
  }

  return { id, categories: norm, version: currentPolicyVersion() };
}

function stateFromReceipt(row) {
  if (!row) return { ...DEFAULT_STATE };
  return {
    v: 1,
    necessary: true,
    functional: !!row.functional,
    analytics: !!row.analytics,
    marketing: !!row.marketing,
    ts: row.received_at,
    receipt: row.id,
    gpc: !!row.gpc,
    source: row.source,
  };
}

function readConsent(req) {
  const raw = req.cookies && req.cookies[config.CONSENT_COOKIE];
  if (!raw || !raw.trim().startsWith('{')) {
    const gpc = String(req.get('sec-gpc') || '') === '1' || /DNT/.test(String(req.get('dnt') || ''));
    return { ...DEFAULT_STATE, gpc };
  }
  try {
    const parsed = JSON.parse(raw);
    const state = stateFromReceipt({
      functional: parsed.functional,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      received_at: parsed.ts,
      id: parsed.receipt,
      gpc: parsed.gpc,
      source: parsed.source,
    });
    if (typeof parsed.gpc === 'boolean') state.gpc = parsed.gpc;
    return state;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function serializeConsent(state) {
  return JSON.stringify({
    v: 1,
    necessary: true,
    functional: !!state.functional,
    analytics: !!state.analytics,
    marketing: !!state.marketing,
    ts: state.ts || new Date().toISOString(),
    receipt: state.receipt || null,
    gpc: !!state.gpc,
    source: state.source || 'banner',
  });
}

function writeConsentCookie(req, res, state) {
  const isHttps = req.secure || req.protocol === 'https';
  res.cookie(config.CONSENT_COOKIE, serializeConsent(state), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 180 * 86400000,
  });
}

function saveConsent({ req, res, categories, source }) {
  const gpc = String(req.get('sec-gpc') || '') === '1';
  const requested = normalize(categories);
  const effective = { ...requested };
  if (gpc && source !== 'settings-page-explicit') {
    effective.analytics = false;
    effective.marketing = false;
  }
  const receipt = recordReceipt({
    categories: effective,
    source,
    sessionId: req.session && req.session.id,
    req,
    gpc,
  });
  const state = {
    ...effective,
    ts: new Date().toISOString(),
    receipt: receipt.id,
    gpc,
    source,
  };
  writeConsentCookie(req, res, state);
  return { state, receipt, gpcApplied: gpc && (requested.analytics || requested.marketing) };
}

module.exports = {
  CATEGORIES,
  CATEGORY_META,
  DEFAULT_STATE,
  currentPolicyVersion,
  normalize,
  recordReceipt,
  stateFromReceipt,
  readConsent,
  serializeConsent,
  writeConsentCookie,
  saveConsent,
};
