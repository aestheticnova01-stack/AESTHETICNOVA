'use strict';
/**
 * AESTHETICNOVA — Cart Service
 * Server-side shopping bag management, stock validation, and totals calculation.
 */

const db = require('../src/db');
const { inr } = require('../src/util');
const { computeTotals } = require('./pricing.service');

/**
 * Ensure a cart record exists for the given session ID.
 */
function ensureCart(sessionId, userId = null) {
  let cart = db.prepare('SELECT * FROM carts WHERE id=?').get(sessionId);
  if (!cart) {
    db.prepare('INSERT INTO carts (id,user_id) VALUES (?,?)').run(sessionId, userId);
    cart = db.prepare('SELECT * FROM carts WHERE id=?').get(sessionId);
  }
  return cart;
}

/**
 * Retrieve all line items for a cart with current variant and product data.
 */
function getCartLines(sessionId) {
  return db.prepare(`SELECT ci.variant_id, ci.qty, v.label AS variant_label, v.sku, v.stock,
                            v.extra_paise, p.id AS product_id, p.slug, p.name, p.image, p.image_alt,
                            p.price_paise, p.material
                     FROM cart_items ci
                     JOIN variants v ON v.id = ci.variant_id
                     JOIN products p ON p.id = v.product_id
                     JOIN carts c ON c.id = ci.cart_id
                     WHERE ci.cart_id = ? ORDER BY ci.added_at`).all(sessionId)
    .map((l) => ({
      ...l,
      unit_price_paise: l.price_paise + l.extra_paise,
      line_total_paise: (l.price_paise + l.extra_paise) * l.qty,
      line_total_label: inr((l.price_paise + l.extra_paise) * l.qty),
      unit_price_label: inr(l.price_paise + l.extra_paise),
      stock_issue: l.qty > l.stock ? Math.max(0, l.stock) : null,
    }));
}

/**
 * Calculate totals for a given set of cart lines.
 */
function totalsFor(lines, opts = {}) {
  return computeTotals(lines.map((l) => ({ unitPrice: l.unit_price_paise, qty: l.qty })), opts);
}

/**
 * Retrieve total item count in a cart.
 */
function getCartCount(sessionId) {
  try {
    const row = db.prepare('SELECT COALESCE(SUM(qty),0) c FROM cart_items WHERE cart_id=?').get(sessionId);
    return row ? row.c : 0;
  } catch {
    return 0;
  }
}

/**
 * Add a product variant to the cart with strict stock checking.
 */
function addToCart(sessionId, userId, { productId, variantId, qty = 1 }) {
  const cleanQty = Math.max(1, Math.min(10, Number(qty) || 1));
  const variant = db.prepare(`SELECT v.*, p.name, p.slug, p.id AS pid FROM variants v
                              JOIN products p ON p.id = v.product_id
                              WHERE v.id=? AND p.id=? AND p.active=1`).get(variantId, productId);

  if (!variant) {
    return { ok: false, status: 400, error: 'That option is not available.' };
  }
  if (variant.stock < 1) {
    return {
      ok: false,
      status: 409,
      soldOut: true,
      slug: variant.slug,
      error: `“${variant.name}” in ${variant.label} is sold out.`,
    };
  }

  ensureCart(sessionId, userId);
  const existing = db.prepare('SELECT qty FROM cart_items WHERE cart_id=? AND variant_id=?')
    .get(sessionId, variantId);

  const desired = (existing ? existing.qty : 0) + cleanQty;
  const finalQty = Math.min(desired, variant.stock, 10);
  const capped = finalQty < desired;

  db.prepare(`INSERT INTO cart_items (cart_id,variant_id,qty) VALUES (?,?,?)
              ON CONFLICT(cart_id,variant_id) DO UPDATE SET qty=excluded.qty`)
    .run(sessionId, variantId, finalQty);
  db.prepare("UPDATE carts SET updated_at=datetime('now') WHERE id=?").run(sessionId);

  const count = getCartCount(sessionId);
  return {
    ok: true,
    count,
    capped,
    message: capped ? `Only ${finalQty} available in this size — that is what we have put in your bag.` : 'Added to your bag.',
  };
}

/**
 * Update quantity for an item in the cart.
 */
function updateCartItemQty(sessionId, variantId, qty) {
  const variant = db.prepare('SELECT stock FROM variants WHERE id=?').get(variantId);
  if (variant) {
    if (qty <= 0) {
      db.prepare('DELETE FROM cart_items WHERE cart_id=? AND variant_id=?').run(sessionId, variantId);
    } else {
      const finalQty = Math.min(qty, variant.stock, 10);
      db.prepare('UPDATE cart_items SET qty=? WHERE cart_id=? AND variant_id=?')
        .run(finalQty, sessionId, variantId);
    }
  }
  return getCartLines(sessionId);
}

/**
 * Remove an item completely from the cart.
 */
function removeCartItem(sessionId, variantId) {
  db.prepare('DELETE FROM cart_items WHERE cart_id=? AND variant_id=?').run(sessionId, Number(variantId));
  return getCartLines(sessionId);
}

/**
 * Get formatted JSON data for the interactive cart drawer.
 */
function getCartDrawerJson(sessionId) {
  const lines = getCartLines(sessionId);
  const totals = totalsFor(lines);
  return {
    ok: true,
    count: lines.reduce((s, l) => s + l.qty, 0),
    items: lines.map((l) => ({
      slug: l.slug,
      name: l.name,
      image: l.image,
      variant: l.variant_label,
      qty: l.qty,
      line_total: l.line_total_label,
    })),
    subtotal: inr(totals.subtotalPaise),
    shipping: inr(totals.shippingPaise),
    total: inr(totals.totalPaise),
    free_shipping_remaining: totals.freeShippingRemainingPaise > 0 ? inr(totals.freeShippingRemainingPaise) : null,
  };
}

/**
 * Empty the entire cart.
 */
function clearCart(sessionId) {
  db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(sessionId);
}

module.exports = {
  ensureCart,
  getCartLines,
  totalsFor,
  getCartCount,
  addToCart,
  updateCartItemQty,
  removeCartItem,
  getCartDrawerJson,
  clearCart,
};
