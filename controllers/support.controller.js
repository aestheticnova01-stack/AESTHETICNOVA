'use strict';
/**
 * AESTHETICNOVA — Support & Grievance Controller
 * Contact inquiries, grievance submissions, customer returns, and ticket tracking.
 */

const db = require('../src/db');
const { sanitizeText, ref: makeRef, accessKey, audit, queueMessage, validateEmail, validatePhone, fmtDateTime } = require('../src/util');
const { rateLimit, hashPII } = require('../services/security.service');

const KINDS = {
  contact: { label: 'General question', who: 'customer support', target: '2 working days' },
  support: { label: 'Order or product issue', who: 'customer support', target: '1 working day' },
  returns: { label: 'Return, refund or exchange', who: 'customer support', target: '1 working day' },
  grievance: { label: 'Formal grievance / complaint', who: 'the grievance officer', target: '48 hours acknowledgement, resolution within 15 days' },
};

function renderContactForm(res, { kind = 'contact', errors = {}, values = {}, status = 200, submitted = null, prefill = {} }) {
  res.status(status).render('info/contact', {
    pageTitle: 'Contact and customer support — AESTHETICNOVA',
    metaDescription: 'Reach AESTHETICNOVA support, raise a grievance, or check the status of an existing ticket.',
    canonicalPath: kind === 'grievance' ? 'grievance' : 'contact',
    kinds: KINDS,
    kind,
    errors,
    values,
    submitted,
    prefill,
  });
}

function renderContact(req, res) {
  const kind = KINDS[req.query.kind] ? req.query.kind : 'contact';
  renderContactForm(res, { kind, prefill: { order_ref: sanitizeText(req.query.order, 40) } });
}

function renderGrievance(req, res) {
  renderContactForm(res, { kind: 'grievance', prefill: {} });
}

function renderReturns(req, res) {
  res.render('legal/returns', {
    pageTitle: 'Refund and Return Policy — AESTHETICNOVA',
    metaDescription: 'Return eligibility, refund timelines, exchange conditions and how to report a damaged or incorrect item.',
    canonicalPath: 'returns',
    trackers: db.prepare('SELECT * FROM trackers ORDER BY category, name').all(),
  });
}

function submitContact(req, res) {
  const kind = KINDS[req.body.kind] ? req.body.kind : 'contact';
  const values = {
    kind,
    name: sanitizeText(req.body.name, 80),
    email: sanitizeText(req.body.email, 254).toLowerCase(),
    phone: sanitizeText(req.body.phone, 20),
    order_ref: sanitizeText(req.body.order_ref, 40).toUpperCase(),
    subject: sanitizeText(req.body.subject, 140),
    message: sanitizeText(req.body.message, 3000),
    request_type: sanitizeText(req.body.request_type, 40),
    marketing_consent: req.body.marketing_consent === '1',
  };
  const errors = {};

  if (values.name.length < 2) errors.name = 'Enter your name.';
  const email = validateEmail(values.email);
  if (!email.ok) errors.email = email.error; else values.email = email.value;
  if (values.phone) {
    const p = validatePhone(values.phone, false);
    if (!p.ok) errors.phone = p.error; else values.phone = p.value;
  }
  if (!values.subject) errors.subject = kind === 'grievance' ? 'Summarise the complaint in a few words.' : 'Add a subject.';
  if (values.message.length < 20) errors.message = 'Tell us a bit more — at least a sentence or two so we can actually help.';
  if (values.order_ref && !/^AN-\d{6}-[A-Z0-9]{6}$/.test(values.order_ref)) {
    errors.order_ref = 'Order references look like AN-261103-A1B2C3.';
  }

  const honeypot = sanitizeText(req.body.company_website, 80);
  if (honeypot) errors.form = 'Your message could not be processed. Please try again.';

  const limiter = rateLimit({ key: `support:${hashPII(req.clientIp)}`, max: 6, windowMs: 3600000 });
  if (!limiter.allowed) errors.form = 'Too many messages from this connection. If this is urgent, email the grievance officer directly.';

  if (Object.keys(errors).length) {
    return renderContactForm(res, { kind, errors, values, status: 422 });
  }

  const ref = makeRef(kind === 'grievance' ? 'GV' : 'SU');
  const key = accessKey();
  const priority = kind === 'grievance' ? 'high' : 'normal';

  const tx = db.transaction(() => {
    const info = db.prepare(`INSERT INTO support_tickets
      (ref,access_key,kind,name,email,phone,order_ref,subject,message,priority,marketing_consent,
       status,acknowledged_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'acknowledged',datetime('now'))`)
      .run(ref, key, kind, values.name, values.email, values.phone || null, values.order_ref || null,
        values.subject, values.message, priority, values.marketing_consent ? 1 : 0);
    db.prepare('INSERT INTO ticket_events (ticket_id,actor,event,detail) VALUES (?,?,?,?)')
      .run(info.lastInsertRowid, 'system', 'received', `Auto-acknowledged. Target: ${KINDS[kind].target}.`);
    queueMessage({
      channel: 'email',
      recipient: values.email,
      template: `${kind}_received`,
      subject: `[${ref}] We have your message`,
      body: `Thanks ${values.name}. Reference ${ref}. ${KINDS[kind].who} will respond within ${KINDS[kind].target}. Track status: /support/status?ref=${ref}`,
    });
    if (kind === 'grievance') {
      db.prepare('INSERT INTO ticket_events (ticket_id,actor,event,detail) VALUES (?,?,?,?)')
        .run(info.lastInsertRowid, 'system', 'escalated', 'Assigned to grievance officer queue.');
    }
  });
  tx();

  audit(values.email, 'support_ticket_created', 'support_ticket', ref, { kind, priority });
  res.redirect(`/support/status?ref=${ref}&key=${key}&new=1`);
}

function renderSupportStatus(req, res) {
  const ref = sanitizeText(req.query.ref, 40).toUpperCase();
  const key = sanitizeText(req.query.key, 80);
  let ticket = null;
  let events = [];
  let notFound = false;

  if (ref && key) {
    ticket = db.prepare('SELECT * FROM support_tickets WHERE ref=? AND access_key=?').get(ref, key);
    if (ticket) {
      events = db.prepare('SELECT at, actor, event, detail FROM ticket_events WHERE ticket_id=? ORDER BY id').all(ticket.id);
    } else notFound = true;
  }

  res.render('info/support-status', {
    pageTitle: ticket ? `Message ${ticket.ref} — AESTHETICNOVA` : 'Check a support message — AESTHETICNOVA',
    metaDescription: 'Track your support or grievance message.',
    canonicalPath: 'support/status',
    noindex: true,
    ticket,
    events,
    notFound,
    isNew: req.query.new === '1',
    KINDS,
    fmtDateTime,
  });
}

module.exports = {
  KINDS,
  renderContact,
  renderGrievance,
  renderReturns,
  submitContact,
  renderSupportStatus,
};
