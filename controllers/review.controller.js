'use strict';
/**
 * AESTHETICNOVA — Review Controller
 * Handles verified purchase reviews submission with anti-fraud gating.
 */

const db = require('../src/db');
const { sanitizeText, audit } = require('../src/util');
const { rateLimit } = require('../services/security.service');

function submitReview(req, res) {
  const returnTarget = req.body.back || (req.body.slug ? '/product/' + sanitizeText(req.body.slug, 80) : '/');
  if (!req.user) return res.redirect('/account/login?next=' + encodeURIComponent(returnTarget));

  const productId = Number(req.body.product_id);
  const rating = Number(req.body.rating);
  const title = sanitizeText(req.body.title, 100);
  const body = sanitizeText(req.body.body, 2000);

  const product = db.prepare('SELECT id, slug FROM products WHERE id=?').get(productId);
  if (!product) {
    return res.status(400).render('error', {
      title: 'Invalid product',
      status: 400,
      message: 'That product does not exist.',
    });
  }

  const dest = `/product/${product.slug}`;
  const limiter = rateLimit({ key: `review:${req.user.id}`, max: 5, windowMs: 3600000 });
  if (!limiter.allowed) {
    return res.status(429).render('error', {
      title: 'Too many reviews',
      status: 429,
      message: 'You have submitted several reviews in a short time. Please try again later.',
    });
  }

  if (!(rating >= 1 && rating <= 5) || body.length < 10) {
    return res.redirect(dest + '?review_error=invalid');
  }

  // Verified purchase check: only purchasers can review
  const purchased = db.prepare(`SELECT COUNT(*) c FROM orders o
      JOIN order_items oi ON oi.order_id=o.id
      WHERE o.user_id=? AND oi.product_id=? AND o.order_status IN ('delivered','shipped','processing')`)
    .get(req.user.id, productId).c > 0;

  if (!purchased) {
    return res.redirect(dest + '?review_error=not_purchased');
  }

  const existing = db.prepare('SELECT id FROM reviews WHERE product_id=? AND user_id=?').get(productId, req.user.id);
  if (existing) {
    return res.redirect(dest + '?review_error=duplicate');
  }

  const info = db.prepare(`INSERT INTO reviews
    (product_id,user_id,author_name,rating,title,body,verified_purchase,verification_note,status)
    VALUES (?,?,?,?,?,?,1,?, 'pending')`)
    .run(productId, req.user.id, req.user.full_name.split(' ')[0], rating, title || null, body,
      `Order verified against user ${req.user.id} on ${new Date().toISOString().slice(0, 10)}`);

  audit('customer', 'review_submitted', 'review', info.lastInsertRowid, { product_id: productId, rating });
  res.redirect(dest + '?review=submitted');
}

module.exports = {
  submitReview,
};
