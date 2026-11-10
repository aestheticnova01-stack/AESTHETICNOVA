'use strict';
/**
 * AESTHETICNOVA — Payment Service
 * Secure payment initiation, verification, and demo simulation.
 * Card numbers and CVVs are NEVER captured or processed by this application.
 */

const crypto = require('crypto');
const config = require('../config');
const paymentConfig = require('../config/payment.config');
const db = require('../src/db');

const METHODS = {
  upi: { label: 'UPI', note: 'Google Pay, PhonePe, Paytm or any UPI app' },
  card: { label: 'Card', note: 'Credit or debit card, processed by the payment gateway' },
  netbanking: { label: 'Net banking', note: 'Your bank’s secure login page' },
  cod: { label: 'Cash on delivery', note: 'Pay the courier in cash when your order arrives' },
};

function availableMethods() {
  const list = ['upi', 'card', 'netbanking'];
  if (config.COD_ENABLED) list.push('cod');
  return list.map((id) => ({
    id,
    ...METHODS[id],
    live: id === 'cod' ? true : config.paymentsLive,
    mode: id === 'cod' ? 'offline' : (config.paymentsLive ? 'razorpay-live' : 'demo-simulator'),
  }));
}

async function createRazorpayOrder({ amountPaise, orderRef, receiptEmail }) {
  const auth = Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64');
  const resp = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: orderRef,
      notes: { merchant_order_ref: orderRef },
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Razorpay order creation failed (${resp.status}): ${text.slice(0, 300)}`);
  }
  return resp.json();
}

function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (!config.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyWebhookSignature(rawBody, signature) {
  if (!config.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Record a payment event against an order in the database.
 */
function recordPayment(orderId, { gateway, paymentId, amountPaise, status, raw = null }) {
  return db.prepare(`
    INSERT INTO payments (order_id, gateway, payment_id, amount_paise, status, raw_response)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    orderId,
    gateway,
    paymentId,
    amountPaise,
    status,
    raw ? (typeof raw === 'string' ? raw : JSON.stringify(raw)) : null
  );
}

module.exports = {
  METHODS,
  availableMethods,
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  recordPayment,
};
