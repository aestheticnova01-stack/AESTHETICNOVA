'use strict';
/**
 * AESTHETICNOVA — Index Routes
 * Homepage, marketing pages, informational views, and legal policies.
 */

const express = require('express');
const homeController = require('../controllers/home.controller');

const router = express.Router();

// Homepage
router.get('/', homeController.renderHome);

// Marketing & informational
router.get('/about', homeController.renderAbout);
router.get('/lookbook', homeController.renderLookbook);
router.get('/size-guide', homeController.renderSizeGuide);
router.get('/faq', homeController.renderFaq);
router.get('/shipping', homeController.renderShipping);
router.get('/accessibility', homeController.renderAccessibility);

// Transparency & legal
router.get('/transparency', homeController.renderTransparency);
router.get('/business-details', homeController.renderBusinessDetails);
router.get('/licences', homeController.renderLicences);
router.get('/launch-readiness', homeController.renderLaunchReadiness);
router.get('/launch-readiness.json', homeController.renderLaunchReadinessJson);

// Static legal policies
const legalPages = {
  privacy: { view: 'legal/privacy', title: 'Privacy Policy', desc: 'What personal data AESTHETICNOVA collects, why, how long we keep it and how to exercise your rights under India’s DPDP framework.' },
  terms: { view: 'legal/terms', title: 'Terms of Service', desc: 'The terms that apply when you browse or buy from AESTHETICNOVA.' },
  returns: { view: 'legal/returns', title: 'Refund and Return Policy', desc: 'Return eligibility, refund timelines, exchange conditions and how to report a damaged or incorrect item.' },
  cookies: { view: 'legal/cookies', title: 'Cookie Policy', desc: 'Every cookie and technology this site uses, its purpose, retention period and how to change your choices.' },
};

Object.entries(legalPages).forEach(([slug, meta]) => {
  router.get(`/${slug}`, homeController.renderLegalDoc(meta, slug));
});

module.exports = router;
