'use strict';
/**
 * AESTHETICNOVA — Checkout Route Adapter (Legacy Compatibility)
 * Combines /routes/checkout.routes and /routes/order.routes.
 */

const express = require('express');
const checkoutRoutes = require('./checkout.routes');
const orderRoutes = require('./order.routes');

const router = express.Router();
router.use(checkoutRoutes);
router.use(orderRoutes);

module.exports = router;
