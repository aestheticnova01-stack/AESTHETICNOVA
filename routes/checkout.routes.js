'use strict';
/**
 * AESTHETICNOVA — Checkout Routes
 * Checkout form, payment step (simulator & live Razorpay), order confirmation, and cancellation.
 */

const express = require('express');
const checkoutController = require('../controllers/checkout.controller');
const { requireUser } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/checkout', checkoutController.renderCheckout);
router.post('/checkout', checkoutController.processCheckout);

router.get('/order/:ref/pay', checkoutController.renderPayment);
router.post('/order/:ref/pay/simulate', checkoutController.simulateDemoPayment);
router.post('/order/:ref/pay/verify', checkoutController.verifyLivePayment);

router.get('/order/:ref', checkoutController.renderConfirmation);
router.post('/order/:ref/cancel', requireUser, checkoutController.cancelOrder);

module.exports = router;
