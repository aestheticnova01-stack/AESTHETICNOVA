'use strict';
/**
 * AESTHETICNOVA — Consent Middleware
 * Parses cookie preferences and controls consent-gated server analytics.
 */

const { readConsent, CATEGORY_META, currentPolicyVersion } = require('../services/consent.service');

function consentMiddleware(req, res, next) {
  const consent = readConsent(req);
  req.consent = consent;
  res.locals.consent = consent;
  res.locals.consentRecorded = Boolean(consent && consent.ts);
  res.locals.analyticsAllowed = Boolean(consent.analytics);
  res.locals.functionalAllowed = Boolean(consent.functional);
  res.locals.marketingAllowed = Boolean(consent.marketing);
  res.locals.consentCategories = CATEGORY_META;
  res.locals.consentPolicyVersion = currentPolicyVersion();
  next();
}

module.exports = {
  consentMiddleware,
};
