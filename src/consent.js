'use strict';
/**
 * AESTHETICNOVA — Consent Adapter
 * Re-exports from /services/consent.service and /middleware/consent.middleware for backwards compatibility.
 */
const consentService = require('../services/consent.service');
const consentMiddleware = require('../middleware/consent.middleware');

module.exports = {
  ...consentService,
  ...consentMiddleware,
};
