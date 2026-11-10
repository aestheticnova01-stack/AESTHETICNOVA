'use strict';
/**
 * AESTHETICNOVA — Product Routes
 * Shop catalogue, product detail pages, and wishlist operations.
 */

const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.get('/shop', productController.renderShop);
router.get('/product/:slug', productController.renderProductDetail);
router.get('/account/wishlist', productController.renderWishlist);
router.post('/wishlist/toggle', productController.toggleWishlist);

module.exports = router;
