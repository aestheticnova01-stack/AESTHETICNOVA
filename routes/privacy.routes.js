'use strict';
/**
 * AESTHETICNOVA — Privacy Routes
 * Privacy and Data Subject Access Requests (DSAR).
 */

const express = require('express');
const privacyController = require('../controllers/privacy.controller');

const router = express.Router();

router.get('/privacy-requests', privacyController.renderPrivacyForm);
router.post('/privacy-requests', privacyController.submitPrivacyRequest);
router.get('/privacy-requests/status', privacyController.renderPrivacyStatus);
router.post('/privacy-requests/:ref/verify', privacyController.verifyPrivacyRequest);

module.exports = router;
