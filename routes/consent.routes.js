'use strict';
/**
 * AESTHETICNOVA — Consent Routes
 * Cookie preference controls, accept all, reject optional, and withdrawal.
 */

const express = require('express');
const consentController = require('../controllers/consent.controller');

const router = express.Router();

router.get('/api/consent', consentController.getConsentApi);
router.post('/consent/accept-all', consentController.acceptAll);
router.post('/consent/reject', consentController.rejectOptional);
router.post('/consent', consentController.saveCustom);
router.post('/consent/withdraw', consentController.withdrawConsent);

module.exports = router;
