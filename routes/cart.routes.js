'use strict';
/**
 * AESTHETICNOVA — Cart Routes
 * Shopping bag views, line item updates, and cart drawer API.
 */

const express = require('express');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

router.get('/cart', cartController.renderCart);
router.post('/cart/add', cartController.addToCart);
router.post('/cart/update', cartController.updateCart);
router.post('/cart/remove', cartController.removeFromCart);
router.get('/api/cart', cartController.getCartApi);

module.exports = router;
