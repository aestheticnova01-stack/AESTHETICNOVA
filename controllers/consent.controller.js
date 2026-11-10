'use strict';
/**
 * AESTHETICNOVA — Consent Controller
 * Privacy choices: banner API, accept-all, reject optional, custom settings, and withdrawal.
 */

const db = require('../src/db');
const config = require('../config');
const { saveConsent, CATEGORY_META } = require('../services/consent.service');
const { rateLimit } = require('../services/security.service');
const { audit } = require('../src/util');

function wantsJson(req) {
  const accept = String(req.get('accept') || '');
  return accept.includes('application/json')
    || String(req.get('x-requested-with') || '').toLowerCase() === 'xmlhttprequest'
    || String(req.get('content-type') || '').includes('application/json')
    || Boolean(req.get('x-csrf-token'));
}

function applyChoice(req, res, categories, source) {
  const { state, receipt, gpcApplied } = saveConsent({ req, res, categories, source });
  audit('visitor', source === 'withdrawal' ? 'consent_withdrawn' : 'consent_recorded', 'consent_receipt', receipt.id, {
    source,
    functional: state.functional,
    analytics: state.analytics,
    marketing: state.marketing,
    gpc: state.gpc,
  });
  return { state, receipt, gpcApplied };
}

function getConsentApi(req, res) {
  const rows = db.prepare(`SELECT id, received_at, policy_version, necessary, functional, analytics,
                                  marketing, source, withdrawn_at
                           FROM consent_receipts WHERE session_id=? ORDER BY received_at DESC LIMIT 10`)
    .all(req.session.id);

  res.json({
    ok: true,
    policy_version: config.COOKIE_POLICY_VERSION,
    state: req.consent,
    categories: CATEGORY_META,
    gpc: req.consent.gpc,
    receipts: rows,
    analytics_blocked: !req.consent.analytics,
    marketing_blocked: !req.consent.marketing,
  });
}

function acceptAll(req, res) {
  if (!rateLimit({ key: `consent:${req.session.id}`, max: 40, windowMs: 60000 }).allowed) {
    return res.status(429).json({ ok: false, error: 'Too many changes. Please wait a moment.' });
  }
  const out = applyChoice(req, res, { functional: true, analytics: true, marketing: true }, 'banner-accept-all');
  if (wantsJson(req)) return res.json({ ok: true, ...out });
  res.redirect(req.body.return_to && String(req.body.return_to).startsWith('/') ? req.body.return_to : '/');
}

function rejectOptional(req, res) {
  if (!rateLimit({ key: `consent:${req.session.id}`, max: 40, windowMs: 60000 }).allowed) {
    return res.status(429).json({ ok: false, error: 'Too many changes. Please wait a moment.' });
  }
  const out = applyChoice(req, res, { functional: false, analytics: false, marketing: false }, 'banner-reject-optional');
  if (wantsJson(req)) return res.json({ ok: true, ...out });
  res.redirect(req.body.return_to && String(req.body.return_to).startsWith('/') ? req.body.return_to : '/');
}

function saveCustom(req, res) {
  if (!rateLimit({ key: `consent:${req.session.id}`, max: 40, windowMs: 60000 }).allowed) {
    return res.status(429).json({ ok: false, error: 'Too many changes. Please wait a moment.' });
  }
  const cats = {
    functional: req.body.functional === '1' || req.body.functional === true || req.body.functional === 'on',
    analytics: req.body.analytics === '1' || req.body.analytics === true || req.body.analytics === 'on',
    marketing: req.body.marketing === '1' || req.body.marketing === true || req.body.marketing === 'on',
  };
  const out = applyChoice(req, res, cats, req.body.source || 'settings-modal');
  if (wantsJson(req)) return res.json({ ok: true, ...out });
  res.redirect(req.body.return_to && String(req.body.return_to).startsWith('/') ? req.body.return_to : '/cookies?saved=1');
}

function withdrawConsent(req, res) {
  if (!rateLimit({ key: `consent:${req.session.id}`, max: 20, windowMs: 60000 }).allowed) {
    return res.status(429).json({ ok: false, error: 'Too many changes.' });
  }
  const out = applyChoice(req, res, { functional: false, analytics: false, marketing: false }, 'withdrawal');
  if (wantsJson(req)) return res.json({ ok: true, ...out });
  res.redirect('/cookies?withdrawn=1');
}

module.exports = {
  getConsentApi,
  acceptAll,
  rejectOptional,
  saveCustom,
  withdrawConsent,
};
