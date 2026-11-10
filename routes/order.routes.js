'use strict';
/**
 * AESTHETICNOVA — Order Routes
 * Order lookup and self-service tracking.
 */

const express = require('express');
const orderController = require('../controllers/order.controller');

const router = express.Router();

router.get('/track-order', orderController.renderTrackOrder);
router.post('/track-order', orderController.processTrackOrder);

module.exports = router;
