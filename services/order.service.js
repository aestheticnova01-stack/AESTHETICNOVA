'use strict';
/**
 * AESTHETICNOVA — Order Service
 * Order lifecycle, transaction isolation, stock decrementing, and tracking.
 */

const db = require('../src/db');
const config = require('../config');
const { ref: makeRef, accessKey, audit, queueMessage, inr } = require('../src/util');

/**
 * Atomically create an order from cart lines, decrement stock, and log events.
 */
function createOrder({ sessionId, userId, values, lines, totals }) {
  const orderRef = makeRef('AN');
  const isCod = values.payment_method === 'cod';

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO orders
      (ref, access_key, session_id, user_id, email, full_name, phone,
       address_line1, address_line2, city, state, pincode,
       subtotal_paise, discount_paise, shipping_paise, cod_fee_paise, gst_paise,
       total_paise, payment_method, payment_status, order_status,
       marketing_consent, terms_accepted_at, privacy_notice_version, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).run(
      orderRef,
      accessKey(),
      sessionId,
      userId || null,
      values.email,
      values.full_name,
      values.phone,
      values.address_line1,
      values.address_line2 || null,
      values.city,
      values.state,
      values.pincode,
      totals.subtotalPaise,
      totals.discountPaise,
      totals.shippingPaise,
      totals.codFeePaise,
      totals.gstPaise,
      totals.totalPaise,
      values.payment_method,
      isCod ? 'pending' : 'pending',
      'placed',
      values.marketing_consent ? 1 : 0,
      config.POLICY_VERSION,
      values.notes || null
    );

    const orderId = info.lastInsertRowid;
    const itemStmt = db.prepare(`
      INSERT INTO order_items
      (order_id, product_id, variant_id, product_name, variant_label, sku, unit_price_paise, qty, line_total_paise)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const stockStmt = db.prepare('UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?');

    for (const l of lines) {
      itemStmt.run(
        orderId,
        l.product_id,
        l.variant_id,
        l.name,
        l.variant_label,
        l.sku,
        l.unit_price_paise,
        l.qty,
        l.line_total_paise
      );
      const r = stockStmt.run(l.qty, l.variant_id, l.qty);
      if (r.changes !== 1) {
        throw new Error('stock_race');
      }
    }

    // Clear cart once order is recorded
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(sessionId);

    // Record initial payment record
    db.prepare(`
      INSERT INTO payments (order_id, provider, amount_paise, status, mode, raw_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      isCod ? 'cod' : (config.paymentsLive ? 'razorpay' : 'demo-simulator'),
      totals.totalPaise,
      'pending',
      isCod ? 'offline' : (config.paymentsLive ? 'live' : 'simulated'),
      'created'
    );

    return { orderId, ...db.prepare('SELECT * FROM orders WHERE id=?').get(orderId) };
  });

  const order = tx();

  audit('customer', 'order_placed', 'order', order.ref, {
    total_paise: order.total_paise,
    method: order.payment_method,
    payment_mode: config.paymentsLive ? 'live' : 'simulated',
  });

  queueMessage({
    channel: 'email',
    recipient: order.email,
    template: 'order_placed',
    subject: `Order ${order.ref} received`,
    body: `Order ${order.ref} placed for ${inr(order.total_paise)}. Delivery to ${order.city} ${order.pincode}.`,
  });

  return order;
}

/**
 * Get an order by unique order reference.
 */
function getOrderByRef(ref) {
  return db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref);
}

/**
 * Get an order by internal integer ID.
 */
function getOrderById(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

/**
 * Get all line items for an order.
 */
function getOrderItems(orderId) {
  return db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
}

/**
 * Get full order details including line items and payment.
 */
function getFullOrder(orderRef) {
  const order = getOrderByRef(orderRef);
  if (!order) return null;
  const items = getOrderItems(order.id);
  const payment = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1').get(order.id);
  return { order, items, payment };
}

/**
 * Get all orders placed by a specific user.
 */
function getOrdersForUser(userId) {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  return orders.map((o) => ({
    ...o,
    items: getOrderItems(o.id),
  }));
}

/**
 * Query orders for the admin console.
 */
function getAllOrdersAdmin({ status, payment_status, limit = 50, offset = 0 } = {}) {
  const where = [];
  const params = [];

  if (status && status !== 'all') {
    where.push('order_status = ?');
    params.push(status);
  }
  if (payment_status && payment_status !== 'all') {
    where.push('payment_status = ?');
    params.push(payment_status);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(limit), Number(offset));

  const total = db.prepare(`SELECT COUNT(*) c FROM orders ${whereClause}`).get(...params).c;

  return { orders: rows, total };
}

/**
 * Update order status with audit log.
 */
function updateOrderStatus(orderId, newStatus, note = '', actor = 'admin') {
  const order = getOrderById(orderId);
  if (!order) return null;

  db.prepare(`
    UPDATE orders SET order_status = ?, updated_at = datetime('now') WHERE id = ?
  `).run(newStatus, orderId);

  audit(actor, 'order_status_updated', 'order', order.ref, {
    old_status: order.order_status,
    new_status: newStatus,
    note,
  });

  return getOrderById(orderId);
}

/**
 * Customer tracking lookup by reference, email, or phone.
 */
function trackOrder({ ref: orderRef, email, phone }) {
  if (orderRef) {
    const cleanRef = String(orderRef).trim().toUpperCase();
    const order = getOrderByRef(cleanRef);
    if (order) {
      return { order, items: getOrderItems(order.id) };
    }
  }

  if (email && phone) {
    const order = db.prepare(`
      SELECT * FROM orders WHERE email = ? AND phone = ? ORDER BY created_at DESC LIMIT 1
    `).get(String(email).trim().toLowerCase(), String(phone).trim());
    if (order) {
      return { order, items: getOrderItems(order.id) };
    }
  }

  return null;
}

module.exports = {
  createOrder,
  getOrderByRef,
  getOrderById,
  getOrderItems,
  getFullOrder,
  getOrdersForUser,
  getAllOrdersAdmin,
  updateOrderStatus,
  trackOrder,
};
