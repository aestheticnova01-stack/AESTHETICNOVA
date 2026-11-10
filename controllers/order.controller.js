'use strict';
/**
 * AESTHETICNOVA — Order Controller
 * Order lookup, customer tracking, and detailed order view.
 */

const db = require('../src/db');
const { validateEmail, sanitizeText } = require('../src/util');
const { rateLimit, hashPII } = require('../services/security.service');
const { getOrderByRef, getOrderItems } = require('../services/order.service');

function renderTrackOrder(req, res) {
  res.render('checkout/track', {
    pageTitle: 'Track your order — AESTHETICNOVA',
    canonicalPath: 'track-order',
    metaDescription: 'Look up an order with your order reference and email address.',
    errors: {},
    values: {},
    order: null,
    items: [],
  });
}

function processTrackOrder(req, res) {
  const values = {
    ref: sanitizeText(req.body.ref, 40).toUpperCase(),
    email: sanitizeText(req.body.email, 254).toLowerCase(),
  };
  const errors = {};
  const limiter = rateLimit({ key: `track:${hashPII(req.clientIp)}`, max: 15, windowMs: 15 * 60 * 1000 });

  if (!limiter.allowed) {
    errors.form = 'Too many lookups. Please wait a few minutes.';
  }
  if (!values.ref) {
    errors.ref = 'Enter the order reference from your confirmation, for example AN-261103-A1B2C3.';
  }
  if (!validateEmail(values.email).ok) {
    errors.email = 'Enter the email address you ordered with.';
  }

  if (Object.keys(errors).length) {
    return res.status(422).render('checkout/track', {
      pageTitle: 'Track your order — AESTHETICNOVA',
      canonicalPath: 'track-order',
      metaDescription: '',
      errors,
      values,
      order: null,
      items: [],
    });
  }

  // Both reference AND email must match for privacy
  const order = db.prepare('SELECT * FROM orders WHERE ref=? AND email=?').get(values.ref, values.email);
  if (!order) {
    return res.status(404).render('checkout/track', {
      pageTitle: 'Track your order — AESTHETICNOVA',
      canonicalPath: 'track-order',
      metaDescription: '',
      errors: {
        form: 'We could not find an order with that reference and email combination. Check both and try again, or contact support.',
      },
      values,
      order: null,
      items: [],
    });
  }

  const items = getOrderItems(order.id);
  res.render('checkout/track', {
    pageTitle: `Order ${order.ref} — AESTHETICNOVA`,
    canonicalPath: 'track-order',
    metaDescription: '',
    errors: {},
    values,
    order,
    items,
  });
}

module.exports = {
  renderTrackOrder,
  processTrackOrder,
};
