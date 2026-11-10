'use strict';
/**
 * AESTHETICNOVA — Home & Information Controller
 * Handles marketing pages, informational content, legal displays, and transparency ledger.
 */

const db = require('../src/db');
const config = require('../config');
const { setting } = require('../src/util');
const assets = require('../src/assets');
const { getCategories, productCards } = require('../services/product.service');

function renderHome(req, res) {
  const categories = getCategories().filter((c) => c.slug !== 'accessories');
  const trending = productCards('1=1', [], 'p.featured DESC, p.id ASC', 4);
  const latest = productCards('p.new_arrival=1', [], 'p.created_at DESC, p.id ASC', 4);

  res.render('home', {
    pageTitle: 'AESTHETICNOVA — Stainless steel jewellery, made for everyday wear',
    metaDescription: 'Rings, chains, pendants, bracelets and earrings in stainless steel. Everyday essentials. Unordinary details. Shop AESTHETICNOVA.',
    currentNav: 'home',
    categories,
    trending,
    latest,
    canonicalPath: '',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'AESTHETICNOVA',
      description: 'Stainless steel jewellery and streetwear accessories, India.',
    },
  });
}

function renderAbout(req, res) {
  res.render('about', {
    pageTitle: 'About AESTHETICNOVA — stainless steel jewellery from India',
    metaDescription: 'How AESTHETICNOVA designs, sources and prices stainless steel jewellery, and what we will and will not claim about our products.',
    currentNav: 'about',
    canonicalPath: 'about',
  });
}

function renderLookbook(req, res) {
  res.render('lookbook', {
    pageTitle: 'Wear it your way — AESTHETICNOVA lookbook',
    metaDescription: 'Editorial styling with AESTHETICNOVA rings, chains and bracelets. Six ways to wear silver-tone stainless steel.',
    canonicalPath: 'lookbook',
  });
}

function renderSizeGuide(req, res) {
  res.render('info/size-guide', {
    pageTitle: 'Size guide — rings, chains and bracelets | AESTHETICNOVA',
    metaDescription: 'How to measure your ring size at home, choose a chain length and measure your wrist, in Indian sizing.',
    canonicalPath: 'size-guide',
  });
}

function renderFaq(req, res) {
  res.render('info/faq', {
    pageTitle: 'FAQ — shipping, returns, sizing and payments | AESTHETICNOVA',
    metaDescription: 'Answers about shipping timelines, returns in India, GST invoices, payment methods and jewellery care.',
    canonicalPath: 'faq',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        ['How long does delivery take?', 'Orders are dispatched within two working days. Metro deliveries usually arrive in 2–4 working days after dispatch; other serviceable PIN codes in 4–7 working days.'],
        ['Do prices include GST?', 'Yes. Every listed price includes GST at 18%. The GST component is shown in your order summary and on your invoice.'],
        ['What is the return window?', `${Number(setting('return_window_days', config.RETURN_WINDOW_DAYS))} days from delivery for unused items in original packaging. Earrings are returnable only if unopened for hygiene reasons — see the refund policy.`],
      ].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  });
}

function renderShipping(req, res) {
  res.render('info/shipping', {
    pageTitle: 'Shipping and delivery — AESTHETICNOVA',
    metaDescription: 'Shipping charges, delivery timelines across India, COD availability and how orders are packed.',
    canonicalPath: 'shipping',
  });
}

function renderTransparency(req, res) {
  const trackers = db.prepare('SELECT * FROM trackers ORDER BY CASE category WHEN \'necessary\' THEN 1 WHEN \'functional\' THEN 2 WHEN \'analytics\' THEN 3 ELSE 4 END, name').all();
  const audits = db.prepare("SELECT * FROM audit_log WHERE action LIKE 'dark_pattern%' OR action LIKE 'self_audit%' ORDER BY at DESC LIMIT 10").all();

  res.render('legal/transparency', {
    pageTitle: 'Transparency, trackers and self-audits — AESTHETICNOVA',
    metaDescription: 'Every third-party service we do and do not use, our dark-pattern self-audit, ranking and pricing disclosures.',
    canonicalPath: 'transparency',
    trackers,
    audits,
  });
}

function renderBusinessDetails(req, res) {
  res.render('legal/business-details', {
    pageTitle: 'Business and seller details — AESTHETICNOVA',
    metaDescription: 'Trading name, legal entity, registered address, GSTIN, grievance officer and complaint tracking process.',
    canonicalPath: 'business-details',
  });
}

function renderLicences(req, res) {
  res.render('legal/licences', {
    pageTitle: 'Font and image licences — AESTHETICNOVA',
    metaDescription: 'Source, licence and usage rights for every font and image used on this website.',
    canonicalPath: 'licences',
    assets,
  });
}

function renderLaunchReadiness(req, res) {
  const readiness = require('../src/readiness');
  const report = readiness.build();
  res.render('legal/launch-readiness', {
    pageTitle: 'Launch-readiness report — AESTHETICNOVA',
    metaDescription: 'Requirement-by-requirement status for all 18 privacy, legal, accessibility and transparency requirements, derived from live checks.',
    canonicalPath: 'launch-readiness',
    noindex: true,
    report,
  });
}

function renderLaunchReadinessJson(req, res) {
  const readiness = require('../src/readiness');
  res.type('application/json').send(JSON.stringify(readiness.build(), null, 2));
}

function renderAccessibility(req, res) {
  res.render('info/accessibility', {
    pageTitle: 'Accessibility statement — AESTHETICNOVA',
    metaDescription: 'Our WCAG 2.2 AA conformance target, what has been tested, known limitations and how to report a barrier.',
    canonicalPath: 'accessibility',
  });
}

function renderLegalDoc(meta, slug) {
  return (req, res) => {
    res.render(meta.view, {
      pageTitle: `${meta.title} — AESTHETICNOVA`,
      metaDescription: meta.desc,
      canonicalPath: slug,
      saved: req.query.saved,
      withdrawn: req.query.withdrawn,
      trackers: db.prepare('SELECT * FROM trackers ORDER BY category, name').all(),
    });
  };
}

module.exports = {
  renderHome,
  renderAbout,
  renderLookbook,
  renderSizeGuide,
  renderFaq,
  renderShipping,
  renderTransparency,
  renderBusinessDetails,
  renderLicences,
  renderLaunchReadiness,
  renderLaunchReadinessJson,
  renderAccessibility,
  renderLegalDoc,
};
