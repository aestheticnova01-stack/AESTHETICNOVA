'use strict';
/**
 * AESTHETICNOVA — Checkout Controller
 * Multi-step checkout, stock checking, payment processing (Demo & Razorpay), and order confirmation.
 */

const db = require('../src/db');
const config = require('../config');
const {
  inr,
  validateEmail,
  validatePhone,
  validatePin,
  sanitizeText,
  audit,
  queueMessage,
  INDIAN_STATES,
} = require('../src/util');
const { computeTotals } = require('../services/pricing.service');
const { availableMethods, verifyRazorpaySignature } = require('../services/payment.service');
const { getCartLines } = require('../services/cart.service');
const { rateLimit, hashPII } = require('../services/security.service');
const { createOrder } = require('../services/order.service');

function checkoutTotals(lines, paymentMethod) {
  return computeTotals(lines.map((l) => ({ unitPrice: l.unit_price_paise, qty: l.qty })), { paymentMethod });
}

function renderCheckoutView(req, res, { errors = {}, values = {}, status = 200 } = {}) {
  const lines = getCartLines(req.session.id);
  if (!lines.length && !errors.form) return res.redirect('/cart');
  const paymentMethod = values.payment_method || 'upi';
  const totals = checkoutTotals(lines, paymentMethod);
  const methods = availableMethods();

  res.status(status).render('checkout/index', {
    pageTitle: 'Checkout — AESTHETICNOVA',
    canonicalPath: 'checkout',
    noindex: true,
    metaDescription: 'Secure checkout with itemised pricing.',
    lines,
    totals,
    errors,
    values,
    methods,
    paymentMethod,
  });
}

function renderCheckout(req, res) {
  const lines = getCartLines(req.session.id);
  if (!lines.length) return res.redirect('/cart');

  const values = {};
  if (req.user) {
    values.email = req.user.email;
    values.full_name = req.user.full_name;
    values.phone = req.user.phone || '';
  }
  renderCheckoutView(req, res, { values });
}

function validateCheckoutInput(req) {
  const values = {
    email: sanitizeText(req.body.email, 254),
    full_name: sanitizeText(req.body.full_name, 80),
    phone: sanitizeText(req.body.phone, 20),
    address_line1: sanitizeText(req.body.address_line1, 120),
    address_line2: sanitizeText(req.body.address_line2, 120),
    city: sanitizeText(req.body.city, 60),
    state: sanitizeText(req.body.state, 60),
    pincode: sanitizeText(req.body.pincode, 10),
    notes: sanitizeText(req.body.notes, 300),
    payment_method: sanitizeText(req.body.payment_method, 20),
    marketing_consent: req.body.marketing_consent === '1' ? 1 : 0,
    terms_accepted: req.body.terms_accepted === '1',
    privacy_ack: req.body.privacy_ack === '1',
  };

  const errors = {};
  const e = validateEmail(values.email);
  if (!e.ok) errors.email = e.error; else values.email = e.value;

  if (values.full_name.length < 2) errors.full_name = 'Enter the full name of the person receiving the order.';
  const p = validatePhone(values.phone);
  if (!p.ok) errors.phone = p.error; else values.phone = p.value;

  if (values.address_line1.length < 5) errors.address_line1 = 'Enter the house or building number and street.';
  if (values.city.length < 2) errors.city = 'Enter your city or town.';
  if (!INDIAN_STATES.includes(values.state)) errors.state = 'Choose your state or union territory.';
  const pin = validatePin(values.pincode);
  if (!pin.ok) errors.pincode = pin.error; else values.pincode = pin.value;

  const methods = availableMethods().map((m) => m.id);
  if (!methods.includes(values.payment_method)) errors.payment_method = 'Choose a payment method.';
  if (values.payment_method === 'cod' && !config.COD_ENABLED) errors.payment_method = 'Cash on delivery is not available right now.';
  if (!values.terms_accepted) errors.terms_accepted = 'Please accept the Terms of Service to place the order.';
  if (!values.privacy_ack) errors.privacy_ack = 'Please confirm you have read the privacy notice.';

  return { values, errors };
}

function processCheckout(req, res) {
  const { values, errors } = validateCheckoutInput(req);

  const limiter = rateLimit({ key: `checkout:${hashPII(req.clientIp)}`, max: 12, windowMs: 10 * 60 * 1000 });
  if (!limiter.allowed) errors.form = 'Too many checkout attempts. Please wait a few minutes and try again.';

  const lines = getCartLines(req.session.id);
  if (!lines.length) errors.form = 'Your bag is empty.';

  lines.forEach((l) => {
    if (l.qty > l.stock) {
      errors.form = `“${l.name}” (${l.variant_label}) only has ${l.stock} left. Please update your bag.`;
    }
  });

  if (Object.keys(errors).length) {
    return renderCheckoutView(req, res, { errors, values, status: 422 });
  }

  const totals = checkoutTotals(lines, values.payment_method);

  let order;
  try {
    order = createOrder({
      sessionId: req.session.id,
      userId: req.user ? req.user.id : null,
      values,
      lines,
      totals,
    });
  } catch (err) {
    return renderCheckoutView(req, res, {
      errors: { form: 'One of your items sold out while you were checking out. Nothing has been charged — please review your bag.' },
      values,
      status: 409,
    });
  }

  if (values.payment_method !== 'cod') {
    return res.redirect(`/order/${order.ref}/pay?key=${order.access_key}`);
  }

  res.redirect(`/order/${order.ref}?key=${order.access_key}`);
}

function renderPayment(req, res, next) {
  const order = db.prepare('SELECT * FROM orders WHERE ref=?').get(req.params.ref);
  if (!order) return next();

  const authorised = req.query.key === order.access_key || (req.user && req.user.id === order.user_id);
  if (!authorised) {
    return res.status(403).render('error', {
      title: 'This order link is private',
      status: 403,
      message: 'For your security, order details require the private link from your confirmation page or a signed-in account.',
    });
  }

  if (order.payment_status === 'paid' || order.payment_method === 'cod') {
    return res.redirect(`/order/${order.ref}?key=${order.access_key}`);
  }

  res.render('checkout/pay', {
    pageTitle: `Pay for order ${order.ref} — AESTHETICNOVA`,
    canonicalPath: `order/${order.ref}/pay`,
    noindex: true,
    metaDescription: 'Complete payment.',
    order,
    paymentFailed: req.query.failed === '1',
    live: config.paymentsLive,
    keyId: config.RAZORPAY_KEY_ID,
    methodLabel: { upi: 'UPI', card: 'Card', netbanking: 'Net banking' }[order.payment_method] || 'Payment',
  });
}

function simulateDemoPayment(req, res, next) {
  if (config.paymentsLive) {
    return res.status(409).render('error', {
      title: 'Simulator disabled',
      status: 409,
      message: 'Live payment mode is configured, so the test simulator is switched off. Use the real payment flow.',
    });
  }

  const order = db.prepare('SELECT * FROM orders WHERE ref=?').get(req.params.ref);
  if (!order) return next();

  if (req.query.key !== order.access_key) {
    return res.status(403).render('error', {
      title: 'This order link is private',
      status: 403,
      message: 'Use the private link from your confirmation page.',
    });
  }

  if (req.body.outcome === 'fail') {
    db.prepare(`INSERT INTO payments (order_id,provider,amount_paise,status,mode,raw_status)
                VALUES (?,?,?,?,?,?)`).run(order.id, 'demo-simulator', order.total_paise, 'failed', 'simulated', 'declined_by_tester');
    audit('customer', 'payment_failed_simulated', 'order', order.ref);
    return res.redirect(`/order/${order.ref}/pay?key=${order.access_key}&failed=1`);
  }

  db.prepare("UPDATE orders SET payment_status='paid', order_status='processing', updated_at=datetime('now') WHERE id=?")
    .run(order.id);
  db.prepare(`INSERT INTO payments (order_id,provider,amount_paise,status,mode,raw_status)
              VALUES (?,?,?,?,?,?)`).run(order.id, 'demo-simulator', order.total_paise, 'captured', 'simulated', 'simulated_success');
  const invoice = 'INV-' + order.ref.replace('AN-', '');
  db.prepare('UPDATE orders SET invoice_number=?, updated_at=datetime("now") WHERE id=?').run(invoice, order.id);
  audit('customer', 'payment_captured_simulated', 'order', order.ref, { total_paise: order.total_paise });

  res.redirect(`/order/${order.ref}?key=${order.access_key}&paid=1`);
}

async function verifyLivePayment(req, res, next) {
  const order = db.prepare('SELECT * FROM orders WHERE ref=?').get(req.params.ref);
  if (!order) return next();

  const { razorpay_payment_id: paymentId, razorpay_order_id: rzpOrderId, razorpay_signature: signature } = req.body;
  if (!config.paymentsLive) {
    return res.status(409).render('error', {
      title: 'Payment provider not configured',
      status: 409,
      message: 'Live payments are not configured on this server.',
    });
  }

  if (!verifyRazorpaySignature({ razorpayOrderId: rzpOrderId, razorpayPaymentId: paymentId, signature })) {
    audit('customer', 'payment_signature_failed', 'order', order.ref);
    return res.status(400).render('error', {
      title: 'Payment could not be verified',
      status: 400,
      message: 'The payment signature did not match, so we have not marked this order paid. If money left your account, contact support with your order reference and we will reconcile it.',
    });
  }

  db.prepare("UPDATE orders SET payment_status='paid', order_status='processing', updated_at=datetime('now') WHERE id=?").run(order.id);
  db.prepare(`INSERT INTO payments (order_id,provider,provider_ref,amount_paise,status,mode,raw_status)
              VALUES (?,?,?,?,?,?,?)`).run(order.id, 'razorpay', paymentId, order.total_paise, 'captured', 'live', 'signature_verified');
  db.prepare('UPDATE orders SET invoice_number=? WHERE id=?').run('INV-' + order.ref.replace('AN-', ''), order.id);
  audit('customer', 'payment_captured_live', 'order', order.ref, { provider_ref: paymentId });

  res.redirect(`/order/${order.ref}?key=${order.access_key}&paid=1`);
}

function renderConfirmation(req, res, next) {
  const order = db.prepare('SELECT * FROM orders WHERE ref=?').get(req.params.ref);
  if (!order) return next();

  const authorised = req.query.key === order.access_key || (req.user && req.user.id === order.user_id);
  if (!authorised) {
    return res.status(403).render('error', {
      title: 'This order link is private',
      status: 403,
      message: 'Order details are protected by the private link in your confirmation email, or sign in to your account to see your orders.',
    });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
  const payments = db.prepare('SELECT id,provider,provider_ref,amount_paise,status,mode,created_at FROM payments WHERE order_id=? ORDER BY id').all(order.id);

  res.render('checkout/confirmation', {
    pageTitle: `Order ${order.ref} — AESTHETICNOVA`,
    canonicalPath: `order/${order.ref}`,
    noindex: true,
    metaDescription: 'Your order details.',
    order,
    items,
    payments,
    accountView: false,
    key: order.access_key,
    justPaid: req.query.paid === '1',
    paymentFailed: req.query.failed === '1',
  });
}

function cancelOrder(req, res, next) {
  const order = db.prepare('SELECT * FROM orders WHERE ref=? AND user_id=?').get(req.params.ref, req.user.id);
  if (!order) return next();

  if (!['placed', 'processing'].includes(order.order_status)) {
    return res.status(409).render('error', {
      title: 'This order can no longer be cancelled online',
      status: 409,
      message: 'It has already shipped. Please use the returns process instead — it is the same support address and we will arrange pickup.',
    });
  }

  const wasPaid = order.payment_status === 'paid';
  const tx = db.transaction(() => {
    db.prepare("UPDATE orders SET order_status='cancelled', payment_status=CASE WHEN payment_status='paid' THEN 'refund_pending' ELSE payment_status END, updated_at=datetime('now') WHERE id=?").run(order.id);
    db.prepare('SELECT variant_id, qty FROM order_items WHERE order_id=?').all(order.id)
      .forEach((i) => db.prepare('UPDATE variants SET stock = stock + ? WHERE id=?').run(i.qty, i.variant_id));
  });
  tx();

  audit('customer', 'order_cancelled', 'order', order.ref);
  queueMessage({
    channel: 'email',
    recipient: order.email,
    template: 'order_cancelled',
    subject: `Order ${order.ref} cancelled`,
    body: `Your order ${order.ref} has been cancelled. ${wasPaid ? 'Any payment will be refunded to the original method within 5–7 working days.' : 'No payment was taken.'}`,
  });

  res.redirect(`/order/${order.ref}?key=${order.access_key}`);
}

module.exports = {
  renderCheckout,
  processCheckout,
  renderPayment,
  simulateDemoPayment,
  verifyLivePayment,
  renderConfirmation,
  cancelOrder,
};
