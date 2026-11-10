'use strict';
/**
 * AESTHETICNOVA — Support Routes
 * Customer contact, grievance redressal, returns, and ticket tracking.
 */

const express = require('express');
const supportController = require('../controllers/support.controller');

const router = express.Router();

router.get('/contact', supportController.renderContact);
router.get('/grievance', supportController.renderGrievance);
router.get('/returns', supportController.renderReturns);
router.post('/contact', supportController.submitContact);
router.get('/support/status', supportController.renderSupportStatus);

module.exports = router;
