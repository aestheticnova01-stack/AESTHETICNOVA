'use strict';
/**
 * AESTHETICNOVA — Privacy & Data Requests Controller
 * DPDP Act 2023 compliant data subject access requests (DSAR) submission and tracking.
 */

const db = require('../src/db');
const { sanitizeText, ref: makeRef, accessKey, audit, queueMessage, addDays, fmtDate } = require('../src/util');
const { rateLimit, hashPII } = require('../services/security.service');

const TYPES = {
  access: 'Copy of my data (access request)',
  correction: 'Correct inaccurate information',
  deletion: 'Delete eligible personal data',
  account_deletion: 'Delete my account',
  withdrawal: 'Withdraw optional consent',
};

function renderPrivacyForm(req, res) {
  const mine = db.prepare(`SELECT ref, request_type, status, created_at, due_by, verification_state,
                                  status_note, lawful_hold_note, completed_at
                           FROM dsar_requests WHERE session_id_owner=? ORDER BY created_at DESC LIMIT 12`)
    .all(req.session.id);

  res.render('legal/privacy-requests', {
    pageTitle: 'Privacy & Data Requests — AESTHETICNOVA',
    metaDescription: 'Request a copy of your data, correct it, delete it, or withdraw consent. Every request gets a reference number and a status you can track.',
    canonicalPath: 'privacy-requests',
    types: TYPES,
    errors: {},
    values: {},
    submitted: null,
    mine,
  });
}

function submitPrivacyRequest(req, res) {
  const values = {
    request_type: sanitizeText(req.body.request_type, 40),
    name: sanitizeText(req.body.name, 80),
    email: sanitizeText(req.body.email, 254).toLowerCase(),
    order_ref: sanitizeText(req.body.order_ref, 40).toUpperCase(),
    details: sanitizeText(req.body.details, 1500),
    identity_confirm: req.body.identity_confirm === '1',
  };
  const errors = {};
  const limiter = rateLimit({ key: `dsar:${hashPII(req.clientIp)}`, max: 5, windowMs: 3600000 });
  if (!limiter.allowed) errors.form = 'Too many requests from this connection. Please try again later or email the grievance officer.';

  if (!TYPES[values.request_type]) errors.request_type = 'Choose the type of request you are making.';
  if (values.name.length < 2) errors.name = 'Enter your name so we can identify the right records.';
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(values.email)) errors.email = 'Enter a valid email address — this is how we verify and reply.';
  if (!values.details) errors.details = 'Tell us what you need, so we do not have to guess.';
  if (values.order_ref && !/^AN-\d{6}-[A-Z0-9]{6}$/.test(values.order_ref)) {
    errors.order_ref = 'Order references look like AN-261103-A1B2C3. Leave it blank if you are not sure.';
  }
  if (values.request_type === 'withdrawal' && values.details.length < 5) {
    errors.details = 'Tell us which optional consent you want to withdraw (marketing email, analytics, marketing cookies).';
  }
  if (!values.identity_confirm) {
    errors.identity_confirm = 'Please confirm you are the person this data relates to, or an authorised representative.';
  }

  const account = db.prepare('SELECT id FROM users WHERE email=? AND deleted_at IS NULL').get(values.email);

  if (Object.keys(errors).length) {
    return res.status(422).render('legal/privacy-requests', {
      pageTitle: 'Privacy & Data Requests — AESTHETICNOVA',
      metaDescription: '',
      canonicalPath: 'privacy-requests',
      types: TYPES,
      errors,
      values,
      submitted: null,
      mine: db.prepare(`SELECT ref, request_type, status, created_at, due_by, verification_state,
                               status_note, lawful_hold_note, completed_at
                        FROM dsar_requests WHERE session_id_owner=? ORDER BY created_at DESC LIMIT 12`).all(req.session.id),
    });
  }

  const ref = makeRef('PR');
  const key = accessKey();
  const due = addDays(30).toISOString().slice(0, 19).replace('T', ' ');

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO dsar_requests
      (ref,access_key,request_type,name,email,order_ref,details,user_id,status,due_by,session_id_owner)
      VALUES (?,?,?,?,?,?,?,?,'received',?,?)`)
      .run(ref, key, values.request_type, values.name, values.email, values.order_ref || null,
        values.details, account ? account.id : null, due, req.session.id);
    const id = db.prepare('SELECT id FROM dsar_requests WHERE ref=?').get(ref).id;
    db.prepare('INSERT INTO dsar_events (dsar_id,actor,event,detail) VALUES (?,?,?,?)')
      .run(id, 'requester', 'submitted', `Type: ${values.request_type}`);
    queueMessage({
      channel: 'email',
      recipient: values.email,
      template: 'dsar_received',
      subject: `We have your privacy request ${ref}`,
      body: `Request ${ref} (${TYPES[values.request_type]}) received. We will verify your identity and respond within 30 days. Track it at /privacy-requests/status.`,
    });
  });
  tx();

  audit(values.email, 'dsar_submitted', 'dsar_request', ref, { type: values.request_type });

  res.render('legal/privacy-requests', {
    pageTitle: 'Privacy request received — AESTHETICNOVA',
    canonicalPath: 'privacy-requests',
    types: TYPES,
    errors: {},
    values: {},
    submitted: { ref, key, type: TYPES[values.request_type], due: fmtDate(due), email: values.email },
    mine: db.prepare(`SELECT ref, request_type, status, created_at, due_by, verification_state,
                             status_note, lawful_hold_note, completed_at
                      FROM dsar_requests WHERE session_id_owner=? ORDER BY created_at DESC LIMIT 12`).all(req.session.id),
  });
}

function renderPrivacyStatus(req, res) {
  const ref = sanitizeText(req.query.ref, 40).toUpperCase();
  const key = sanitizeText(req.query.key, 80);
  let request = null;
  let events = [];
  let notFound = false;

  if (ref && key) {
    request = db.prepare('SELECT * FROM dsar_requests WHERE ref=? AND access_key=?').get(ref, key);
    if (request) {
      events = db.prepare('SELECT at, actor, event, detail FROM dsar_events WHERE dsar_id=? ORDER BY id').all(request.id);
    } else {
      notFound = true;
    }
  }

  res.render('legal/privacy-status', {
    pageTitle: request ? `Request ${request.ref} — AESTHETICNOVA` : 'Track a privacy request — AESTHETICNOVA',
    canonicalPath: 'privacy-requests/status',
    noindex: true,
    metaDescription: 'Track the status of your data or privacy request.',
    request,
    events,
    notFound,
    types: TYPES,
  });
}

function verifyPrivacyRequest(req, res, next) {
  const request = db.prepare('SELECT * FROM dsar_requests WHERE ref=?').get(req.params.ref);
  if (!request) return next();
  if (req.body.key !== request.access_key) {
    return res.status(403).render('error', {
      title: 'Invalid access key',
      status: 403,
      message: 'The link in your verification email may be expired or incomplete.',
    });
  }

  db.prepare("UPDATE dsar_requests SET verification_state='verified', status=CASE WHEN status='received' THEN 'in_progress' ELSE status END, updated_at=datetime('now') WHERE id=?")
    .run(request.id);
  db.prepare('INSERT INTO dsar_events (dsar_id,actor,event,detail) VALUES (?,?,?,?)')
    .run(request.id, 'requester', 'verified', 'Email ownership verified by clicking confirmation link.');
  audit(request.email, 'dsar_email_verified', 'dsar_request', request.ref);

  res.redirect(`/privacy-requests/status?ref=${request.ref}&key=${request.access_key}&verified=1`);
}

module.exports = {
  TYPES,
  renderPrivacyForm,
  submitPrivacyRequest,
  renderPrivacyStatus,
  verifyPrivacyRequest,
};
