'use strict';
/**
 * AESTHETICNOVA — Cart Controller
 * Bag display, add to cart (form & AJAX), quantity updates, removal, and drawer API.
 */

const {
  getCartLines,
  totalsFor,
  addToCart: addToCartService,
  updateCartItemQty,
  removeCartItem,
  getCartDrawerJson,
} = require('../services/cart.service');

function renderCart(req, res) {
  const lines = getCartLines(req.session.id);
  const totals = totalsFor(lines);

  res.render('cart/index', {
    pageTitle: 'Your bag — AESTHETICNOVA',
    metaDescription: 'Review your bag. Every charge is itemised before you pay.',
    canonicalPath: 'cart',
    noindex: true,
    lines,
    totals,
  });
}

function addToCart(req, res) {
  const wantsJson = req.accepts(['html', 'json']) === 'json' || req.get('x-csrf-token');
  const productId = Number(req.body.product_id);
  const variantId = Number(req.body.variant_id);
  const qty = Number(req.body.qty) || 1;

  const result = addToCartService(req.session.id, req.user ? req.user.id : null, {
    productId,
    variantId,
    qty,
  });

  if (!result.ok) {
    if (wantsJson) {
      return res.status(result.status || 400).json(result);
    }
    if (result.soldOut) {
      return res.redirect(`/product/${result.slug}?soldout=1`);
    }
    return res.redirect('/shop');
  }

  if (wantsJson) {
    return res.json(result);
  }
  res.redirect('/cart');
}

function updateCart(req, res) {
  const variantId = Number(req.body.variant_id);
  const qty = Number(req.body.qty);
  updateCartItemQty(req.session.id, variantId, qty);
  res.redirect('/cart');
}

function removeFromCart(req, res) {
  const variantId = Number(req.body.variant_id);
  removeCartItem(req.session.id, variantId);
  res.redirect('/cart');
}

function getCartApi(req, res) {
  const data = getCartDrawerJson(req.session.id);
  res.json(data);
}

module.exports = {
  renderCart,
  addToCart,
  updateCart,
  removeFromCart,
  getCartApi,
};
