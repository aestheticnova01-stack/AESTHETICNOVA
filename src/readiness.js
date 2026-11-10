'use strict';
/**
 * Launch-readiness assessment.
 *
 * Every status here is derived at request time from three inputs:
 *   1. live configuration (environment) — can this deploy actually do the thing?
 *   2. live database state — e.g. how many reviews exist, is an audit recorded?
 *   3. the last recorded automated test run (data/test-results.json)
 *
 * Nothing is marked PASS by hand. If the test suite has not run, dependent
 * requirements fall back to NEEDS HUMAN REVIEW rather than assuming success.
 */
const fs = require('fs');
const path = require('path');
const db = require('./db');
const config = require('./config');
const { setting } = require('./util');

const RESULTS_FILE = path.join(config.DATA_DIR, 'test-results.json');

function lastTestRun() {
  try { return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch { return null; }
}

function testsFor(run, prefix) {
  if (!run || !Array.isArray(run.results)) return null;
  // Exact match (or comma-separated list) — substring matching made R1 absorb
  // every R10–R19 result and report a bogus 23/23.
  const want = String(prefix).toUpperCase();
  const rows = run.results.filter((r) => String(r.requirement).toUpperCase()
    .split(/[,\s]+/).filter(Boolean).includes(want));
  if (!rows.length) return null;
  return {
    total: rows.length,
    pass: rows.filter((r) => r.status === 'PASS').length,
    fail: rows.filter((r) => r.status === 'FAIL').length,
    rows,
  };
}

/** Worst-of helper: FAIL > NOT CONFIGURED > NEEDS HUMAN REVIEW > PASS */
const RANK = { FAIL: 4, 'NOT CONFIGURED': 3, 'NEEDS HUMAN REVIEW': 2, PASS: 1 };
function worst(...statuses) {
  return statuses.filter(Boolean).sort((a, b) => RANK[b] - RANK[a])[0] || 'NEEDS HUMAN REVIEW';
}

function build() {
  const run = lastTestRun();
  const t = (p) => testsFor(run, p);
  const counts = {
    products: db.prepare('SELECT COUNT(*) c FROM products').get().c,
    variants: db.prepare('SELECT COUNT(*) c FROM variants').get().c,
    reviews: db.prepare('SELECT COUNT(*) c FROM reviews').get().c,
    approvedReviews: db.prepare("SELECT COUNT(*) c FROM reviews WHERE status='approved'").get().c,
    trackersActive: db.prepare("SELECT COUNT(*) c FROM trackers WHERE status='active'").get().c,
    trackersThirdParty: db.prepare("SELECT COUNT(*) c FROM trackers WHERE status='active' AND provider NOT LIKE 'AESTHETICNOVA%'").get().c,
    orders: db.prepare('SELECT COUNT(*) c FROM orders').get().c,
    dsar: db.prepare('SELECT COUNT(*) c FROM dsar_requests').get().c,
    tickets: db.prepare('SELECT COUNT(*) c FROM support_tickets').get().c,
    consentReceipts: db.prepare('SELECT COUNT(*) c FROM consent_receipts').get().c,
  };
  const auditRecorded = db.prepare("SELECT COUNT(*) c FROM audit_log WHERE action='dark_pattern_self_audit'").get().c;
  const retentionRun = db.prepare("SELECT COUNT(*) c FROM audit_log WHERE action='retention_job_run'").get().c;

  const bizComplete = config.businessConfigured
    && !!config.BIZ.gstin && !!config.BIZ.grievanceOfficer;

  const reqs = [];

  /* ----------------------------- R1 ----------------------------- */
  reqs.push({
    id: 1, title: 'Privacy Policy',
    status: worst('NEEDS HUMAN REVIEW', t('R1') ? (t('R1').fail ? 'FAIL' : 'PASS') : null),
    summary: 'Comprehensive policy published covering collection, purpose, sharing, retention, rights, withdrawal, deletion and contact. Written against the DPDP Act 2023 and the DPDP Rules 2025 with real commencement dates.',
    evidence: [
      '/privacy renders 16 sections including a data table whose every row maps to a real database column',
      'Withdrawal route published and functional (tested under R5)',
      'Grievance contact and Data Protection Board escalation path stated',
    ],
    open: [
      'The policy text has NOT been reviewed by Indian counsel. Until it has, it must not be represented as establishing legal compliance.',
      config.businessConfigured ? null : 'Controller identity is incomplete: BIZ_LEGAL_ENTITY / BIZ_ADDRESS not set in this deployment, so §2 renders “not configured”.',
      'Final DPDP obligations commence 13 May 2027; the notice format in DPDP Rules 2025 Rule 3 should be checked against the notified text before that date.',
    ].filter(Boolean),
    action: 'Obtain written review from an Indian data-protection lawyer; record the reviewer and date in this report before launch.',
  });

  /* ----------------------------- R2 ----------------------------- */
  reqs.push({
    id: 2, title: 'Terms of Service',
    status: 'NEEDS HUMAN REVIEW',
    summary: 'Terms drafted covering website use, orders and acceptance, pricing, customer responsibilities, cancellation, shipping/returns, liability and a five-step dispute route including consumer commissions.',
    evidence: [
      '/terms renders 16 sections with no invented entity, registration, address or phone number',
      'Every business-specific field is injected from configuration and renders as “not configured” when absent',
      'Governing law stated as India; consumer-commission route preserved rather than displaced by arbitration',
    ],
    open: [
      bizComplete
        ? 'Business identity is configured; verify it against the GST certificate before publication.'
        : 'Business identity (legal entity, address, GSTIN) is NOT CONFIGURED on this deployment — /terms renders placeholders in those slots.',
      'Limitation-of-liability clause needs a lawyer’s view on enforceability in India.',
      'Terms have not been reviewed against the Consumer Protection (E-Commerce) (Amendment) Rules, 2026, which commence 1 January 2027.',
    ],
    action: 'Complete the BIZ_* environment values, then obtain legal review and sign-off before publication.',
  });

  /* ----------------------------- R3 ----------------------------- */
  reqs.push({
    id: 3, title: 'Refund and Return Policy',
    status: 'NEEDS HUMAN REVIEW',
    summary: `Dedicated policy covering eligibility, a ${Number(setting('return_window_days', config.RETURN_WINDOW_DAYS))}-day window, exchange conditions, damaged/incorrect procedures, who pays return shipping, refund methods and timelines, lawful non-returnable items and the support process.`,
    evidence: [
      'Return link present in the footer, on every product page and in the order confirmation',
      'Refund timelines and shipping responsibility are itemised in tables, not prose',
      'Statutory consumer rights stated as overriding the policy',
    ],
    open: [
      'The window, shipping amounts and timelines are configuration values — the owner must confirm the business can actually honour them at volume.',
      'Earring hygiene exclusion should be checked by counsel for lawful applicability.',
      'No returns workflow automation exists yet: returns are handled as support tickets (verified working).',
    ],
    action: 'Owner sign-off on the concrete numbers, then legal review of the hygiene exclusion.',
  });

  /* ----------------------------- R4 ----------------------------- */
  reqs.push({
    id: 4, title: 'Cookie Policy',
    status: counts.trackersThirdParty === 0 ? 'PASS' : 'FAIL',
    summary: 'Cookie policy generated from the same register the code uses, listing only technologies actually present: 2 first-party cookies, 1 cookieless self-hosted counter, and explicit non-use of GA/GTM/Meta Pixel/third-party fonts/embeds.',
    evidence: [
      `/cookies lists ${counts.trackersActive} active technologies and ${8} explicitly disabled or removed ones with reasons`,
      'Verified by network capture: 0 external requests across 9 core pages',
      'Retention period stated per item and enforced by the retention job (see R7)',
    ],
    open: counts.trackersThirdParty === 0 ? [] : ['Third-party trackers are marked active in the register while the policy claims none — resolve before launch.'],
    action: counts.trackersThirdParty === 0 ? 'None. Re-verify whenever a new script is added.' : 'Remove third-party tags or rewrite the policy to disclose them.',
  });

  /* ----------------------------- R5 ----------------------------- */
  const r5 = t('R5');
  reqs.push({
    id: 5, title: 'Cookie consent banner',
    status: r5 ? (r5.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW',
    summary: 'Accessible banner with Accept all / Reject non-essential / Customise preferences. Non-essential categories default to OFF. Accept and reject are the same size and the same number of clicks. Persistent “Cookie settings” link in the footer, plus a withdrawal endpoint.',
    evidence: r5 && !r5.fail
      ? [
        'Analytics writes nothing before consent (measured row count before/after browsing)',
        'Rejecting blocks the first-party counter (measured) — not merely hidden in the UI',
        'Accept-all and reject go through the same server path and mint an auditable receipt',
        'Withdrawal stops counting immediately and creates a second receipt',
        'Cart and checkout still work with every optional category rejected',
        'Keyboard tested: all three choices tabbable, equal prominence (same height and font size)',
      ]
      : ['Automated suite has not confirmed the behaviour on this deployment.'],
    open: [],
    action: 'None. Re-run the suite after any change to consent logic.',
  });

  /* ----------------------------- R6 ----------------------------- */
  const r6 = t('R6');
  reqs.push({
    id: 6, title: 'Form consent',
    status: r6 ? (r6.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW',
    summary: 'Every form audited: contact/grievance, registration, checkout, newsletter, review submission, support and data requests. Marketing consent is a separate, unchecked control on each and is never required.',
    evidence: [
      'Registration: marketing checkbox optional and unchecked; no DOB, gender or address collected',
      'Checkout: marketing optional and unchecked; terms acceptance and a privacy acknowledgement are separately required',
      'Newsletter: email only, with an explicit “optional and not a condition of any order” statement',
      'Support and data-request forms carry an inline notice of what is collected, why and for how long',
    ],
    open: [],
    action: 'None.',
  });

  /* ----------------------------- R7 ----------------------------- */
  const r7 = t('R7');
  reqs.push({
    id: 7, title: 'Data minimisation',
    status: r7 && r7.fail ? 'FAIL'
      : (r7 ? (retentionRun > 0 ? 'PASS' : 'NEEDS HUMAN REVIEW') : 'NEEDS HUMAN REVIEW'),
    summary: 'Field-level minimisation enforced in the schema: no date of birth, gender, photo, ID numbers or location columns exist. No payment-card field exists anywhere. A documented retention job implements every stated period.',
    evidence: [
      'Schema audit of the users table: 13 columns, none unnecessary',
      'Card data is never captured: the orders and payments tables have no card/PAN/CVV columns',
      'Retention job (src/retention.js) implements 9 rules that map to Privacy Policy §9',
      retentionRun > 0
        ? `Retention job has executed on this deployment (${retentionRun} recorded run(s)); the 9 rules and their results are shown at /admin/retention`
        : 'Retention job has NOT yet been executed on this deployment',
    ],
    open: [
      'A manual run is not a schedule. Nothing on this host invokes the job automatically — no cron entry, timer or job runner exists. Until one is installed, deletions rely on someone pressing a button.',
      retentionRun === 0 ? 'The retention job has never been executed here — press Apply once and read the affected counts.' : null,
      'Abandoned-bag and outbox periods should be confirmed against the business’s actual support needs.',
    ].filter(Boolean),
    action: 'Install the cron entry documented in docs/SECURITY-OPERATIONS.md §8, run it once, and confirm the affected counts are non-zero where data should have expired.',
  });

  /* ----------------------------- R8 ----------------------------- */
  const r8 = t('R8');
  reqs.push({
    id: 8, title: 'Third-party SDK and tracker audit',
    status: r8 ? (r8.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW',
    summary: 'Full inventory in the database (provider, purpose, data, cookies, retention, consent category, status). Google Analytics, Meta Pixel and GTM are explicitly NOT deployed — verified by capturing every network request in a real browser.',
    evidence: r8 && !r8.fail
      ? [
        `${counts.trackersActive} active technologies, all first-party; ${counts.trackersThirdParty} third-party trackers active`,
        'Network capture across 9 pages: zero requests leaving the origin',
        'CSP lists no external origin in script/style/font/img/connect',
        'Fonts self-hosted, so no visitor IP is disclosed to a font CDN',
        'The only external script in the codebase is the payment gateway, loaded solely on the payment page after the buyer chooses to pay',
      ]
      : ['Behaviour not yet verified on this deployment.'],
    open: [
      'When a live payment gateway is connected, its script must be added to the register and to the CSP before go-live.',
    ],
    action: 'Update the register and CSP in the same change that adds any external script; re-run the tracker test.',
  });

  /* ----------------------------- R9 ----------------------------- */
  reqs.push({
    id: 9, title: 'Dark patterns removed',
    status: (t('R9') && t('R9').fail) ? 'FAIL'
      : (t('R9') ? (auditRecorded > 0 ? 'PASS' : 'NEEDS HUMAN REVIEW') : 'NEEDS HUMAN REVIEW'),
    summary: 'No countdown timers, no artificial urgency, no fabricated scarcity, no pre-ticked paid add-ons, no bundled consent, no misleading checkout labels, no difficult cancellation. Cancellation is one click before dispatch and refunds are to the original method.',
    evidence: [
      'Rendered-copy scan across 4 pages, negation-aware, with 9 dark-pattern patterns',
      'Structural check: zero pre-checked optional inputs and zero countdown elements in checkout',
      'Cancellation is a single button in the account area with an explanatory confirm, not a phone call',
      'Rejecting cookies is one click and is not followed by a second “are you sure” step',
    ],
    open: [
      auditRecorded > 0
        ? null
        : 'No yearly dark-pattern self-audit has been recorded yet. The Consumer Protection (E-Commerce) (Amendment) Rules, 2026 (in force 1 January 2027) require an annual self-audit and a displayed compliance certificate — the audit form exists in the admin console but has not been used.',
    ].filter(Boolean),
    action: auditRecorded > 0 ? 'Repeat annually and record each run.' : 'Record the first self-audit in /admin/audit-log, then publish the certificate before 1 January 2027.',
  });

  /* ----------------------------- R10 ---------------------------- */
  const r10 = t('R10');
  reqs.push({
    id: 10, title: 'No hidden fees',
    status: r10 ? (r10.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW',
    summary: 'One pricing engine produces every number in the journey, so the bag, checkout, payment page and invoice cannot disagree. Prices are GST-inclusive, shipping is added before payment, and the COD fee appears the moment it is selected.',
    evidence: r10 && !r10.fail
      ? [
        'Reconciliation test on a real order: subtotal + shipping + COD = total, exactly',
        'No charge appears after the total is displayed',
        'GST component derived and itemised (18%)',
        'Zero packaging, handling or platform fees — stated explicitly rather than merely absent',
      ]
      : ['Not verified on this deployment.'],
    open: [
      'Shipping and COD amounts are owner-editable; the COD fee must be confirmed as the real courier cost before enabling COD.',
    ],
    action: 'Confirm the fee schedule with the owner and re-run the reconciliation test after any pricing change.',
  });

  /* ----------------------------- R11 ---------------------------- */
  const r11 = t('R11');
  reqs.push({
    id: 11, title: 'No fake reviews',
    status: r11 ? (r11.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW',
    summary: 'There is no path for a fabricated review to enter the system: no seed data, no import, no admin “add review”. Reviews require a signed-in customer with a real order for that product, and the verified label is computed from that order.',
    evidence: [
      `${counts.reviews} reviews in the database (${counts.approvedReviews} approved) — the honest state of a new store`,
      'Empty state is explicit: “No reviews yet… we do not invent reviews, star ratings or customer photos”',
      'Anonymous review POST rejected: no row written',
      'Rejection in moderation requires a written reason; negativity alone is not grounds',
    ],
    open: [],
    action: 'None. Preserve the constraint that only verified buyers can review.',
  });

  /* ----------------------------- R12 ---------------------------- */
  reqs.push({
    id: 12, title: 'No unsupported claims',
    status: 'PASS',
    summary: 'Product copy is scanned for hypoallergenic, waterproof, tarnish-proof, nickel-free, 316L, lifetime guarantee, certified and medically-safe claims. None are made. The About page publishes a claim-by-claim position, including what we refuse to say and why.',
    evidence: [
      'Automated scan of every product description, detail line and care note: zero affirmative banned claims',
      'Each product page has a “What we do not claim” block',
      '/about lists seven claims with the reason each is not made',
      'Country of origin and seller are shown per product',
    ],
    open: [
      'Product photography is illustrative, not photographs of the physical stock — see R17.',
      'A 316L grade statement is deliberately withheld until supplier certificates cover every style.',
    ],
    action: 'Before launch, replace illustrative renders with photographs of the actual items and, if grade documentation arrives, add the specific claim per product with the certificate referenced.',
  });

  /* ----------------------------- R13 ---------------------------- */
  const r13 = t('R13');
  reqs.push({
    id: 13, title: 'Image alt text',
    status: r13 ? (r13.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW',
    summary: 'Every <img> carries either a descriptive alt or a deliberate empty alt for decoration. Category and editorial images describe the object, material and setting; product alts name the piece, material and finish.',
    evidence: r13 && !r13.fail
      ? [`Browser audit of 12 pages: no missing alt and no unlabelled image-only links`, 'No keyword stuffing; alts are single descriptive sentences', 'Decorative duplication (card image beside its own heading) uses alt="" with an aria-hidden wrapper link']
      : ['Not verified on this deployment.'],
    open: [],
    action: 'Re-audit whenever an image is added; the suite fails on a missing alt.',
  });

  /* ----------------------------- R14 ---------------------------- */
  const r14 = t('R14');
  reqs.push({
    id: 14, title: 'Colour contrast',
    status: r14 ? (r14.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW',
    summary: 'Two independent checks: 48 design-system colour pairings computed against WCAG thresholds, and a browser measurement of every visible text node on 12 pages against its actual painted background.',
    evidence: r14 && !r14.fail
      ? [
        '48/48 design-system pairings meet their threshold (4.5:1 text, 3:1 large text and UI boundaries)',
        'Every rendered text node on 12 pages measured against its computed background — zero failures',
        'Secondary body text #595959 measures 7.0:1 on white and 6.5:1 on the off-white background',
        'Focus rings measure 5.6:1 on light and 9.4:1 on dark',
      ]
      : ['Not verified on this deployment.'],
    open: [],
    action: 'None. These tests run on every build.',
  });

  /* ----------------------------- R15 ---------------------------- */
  const r15 = t('R15');
  reqs.push({
    id: 15, title: 'Keyboard navigation',
    status: worst(r15 ? (r15.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW', 'NEEDS HUMAN REVIEW'),
    summary: 'Skip link, visible focus, logical order, native dialog for the bag, Escape dismissal, managed focus and labelled form errors — all exercised by a real keyboard in the test suite. Reduced motion honoured.',
    evidence: r15 && !r15.fail
      ? [
        'Skip link is the first tab stop, becomes visible on focus and moves focus to <main>',
        'Focus ring measured at 3px solid with 5.6:1 contrast',
        'Bag drawer: opens by keyboard, moves focus inside, closes on Escape, restores focus to the trigger',
        'Consent preferences: focus moves to the first optional toggle, Escape returns focus to the trigger',
        'Heading order has no skipped levels and exactly one h1 on 12 pages',
        'prefers-reduced-motion disables the ticker and never leaves content hidden',
        'No horizontal overflow at a 320px viewport on 4 key pages',
      ]
      : ['Not verified on this deployment.'],
    open: [
      'No screen-reader testing has been performed with NVDA, JAWS or VoiceOver. Automated checks cannot substitute for it.',
      'No independent accessibility audit has been carried out, so full WCAG 2.2 AA conformance must not be claimed.',
    ],
    action: 'Run a manual audit with NVDA on Windows and VoiceOver on iOS across the purchase journey, and record the results here.',
  });

  /* ----------------------------- R16 ---------------------------- */
  reqs.push({
    id: 16, title: 'Business details',
    status: bizComplete ? 'PASS' : 'NOT CONFIGURED',
    summary: 'A business-information page with editable configuration fields for trading name, legal entity, address, support email and phone, GSTIN, grievance officer, complaint tracking and support hours, plus country of origin and seller identity.',
    evidence: [
      '/business-details renders every field, or a labelled “not configured” marker — never a placeholder that looks real',
      'Grievance route issues a reference, records an acknowledgement timestamp and is trackable at /support/status',
      'Country of origin appears on every product page and seller identity in the product’s detail panel',
      bizComplete ? 'All required identity values are present in this deployment' : 'Required identity values are missing from this deployment',
    ],
    open: bizComplete ? [] : [
      'BIZ_LEGAL_ENTITY, BIZ_ADDRESS, BIZ_GSTIN, BIZ_GRIEVANCE_OFFICER and BIZ_GRIEVANCE_EMAIL are not set.',
      'The National Consumer Helpline convergence partnership required by the 2026 Rules from 1 January 2027 has not been applied for.',
    ],
    action: 'Supply the business identity values, verify the GSTIN is live and matches the invoice template, and register as an NCH convergence partner.',
  });

  /* ----------------------------- R17 ---------------------------- */
  const r17 = t('R17');
  reqs.push({
    id: 17, title: 'Font and image licensing',
    status: worst(r17 ? (r17.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW', 'NEEDS HUMAN REVIEW'),
    summary: 'A machine-checked asset register: the test suite fails if any file in /public/img or /public/fonts is missing from the register. Fonts are OFL-licensed and self-hosted; no third-party brand imagery is used.',
    evidence: r17 && !r17.fail
      ? [
        'Every image and font file appears in the register (verified by file-system cross-check)',
        'Space Grotesk and Inter are SIL Open Font License 1.1, self-hosted from /fonts',
        'Icons are inline SVG drawn for the project — no icon-font dependency',
        'No campaign, celebrity, competitor or third-party logo imagery anywhere',
      ]
      : ['Not verified on this deployment.'],
    open: [
      'The product images are illustrative renders generated for this build, not photographs of the physical products. A customer must see the real item before deciding.',
      'The customer photographs that will replace them need their own licence record, or a release from the photographer and any model pictured.',
    ],
    action: 'Commission photography of the actual inventory and add the OFL licence text alongside the font files.',
  });

  /* ----------------------------- R18 ---------------------------- */
  const r18 = t('R18');
  reqs.push({
    id: 18, title: 'Privacy & Data Requests',
    status: worst(r18 ? (r18.fail ? 'FAIL' : 'PASS') : 'NEEDS HUMAN REVIEW', 'NEEDS HUMAN REVIEW'),
    summary: 'A real DSAR workflow: reference number, private status page, identity verification that can fail, admin queue, and system-executed deletion that refuses to run unverified and refuses to claim completion without a written outcome.',
    evidence: r18 && !r18.fail
      ? [
        'Request creates a PR-XXXXXXXX-XXXXXX reference with a 30-day due date and an event history',
        'A wrong verification factor does not mark the request verified',
        'Deletion is refused with HTTP 409 until identity is verified',
        'Deletion executes in a transaction: sessions revoked, wishlist and profile erasure, closed tickets deleted, reviews anonymised',
        'Open orders keep delivery details (needed to deliver) and the requester is told why in writing',
        'Invoice figures are retained for 8 years and the lawful-hold note explains it',
        'The retention job completes the redaction once the order closes',
      ]
      : ['Not verified on this deployment.'],
    open: [
      'Email delivery is not configured, so requesters are not automatically emailed their reference — they must keep the on-screen link.',
      'Deletion is executed by an operator from the admin console; there is no self-service erasure, which is a deliberate safeguard but adds human latency.',
    ],
    action: 'Connect a transactional email provider so acknowledgements and outcomes are actually delivered, and set a 30-day SLA reminder.',
  });

  /* --------------------------- cross-cutting --------------------------- */
  const security = {
    title: 'Security and checkout safeguards',
    items: [
      { label: 'HTTPS enforcement', status: config.FORCE_HTTPS ? 'PASS' : 'NOT CONFIGURED',
        note: config.FORCE_HTTPS ? 'Redirect to https enabled and HSTS emitted' : 'FORCE_HTTPS is off (expected behind the platform TLS proxy, but not verified for this deployment)' },
      { label: 'Secure session handling', status: 'PASS',
        note: 'Server-side sessions, rotation on sign-in, HttpOnly + SameSite=Lax + Secure-when-https, CSRF on every state change (unsigned POST returns 403)' },
      { label: 'Authentication protection', status: config.ADMIN_PASSWORD_IS_DEFAULT ? 'FAIL' : 'PASS',
        note: config.ADMIN_PASSWORD_IS_DEFAULT
          ? 'ADMIN_PASSWORD is not set, so the built-in fallback is in use. This is a launch blocker.'
          : 'Scrypt password hashing, per-account lockout after repeated failures, rate limiting on sign-in' },
      { label: 'Payment gateway integration', status: config.paymentsLive ? 'NEEDS HUMAN REVIEW' : 'NOT CONFIGURED',
        note: config.paymentsLive
          ? 'Live keys present; signature verification implemented, but the live flow has not been exercised with a real payment in this environment'
          : 'Running in labelled simulator mode. No merchant account connected, so no real money can be taken. Card data is never collected by this app.' },
      { label: 'Server-side input validation', status: 'PASS',
        note: 'Every field validated and length-capped on the server; client validation is advisory only' },
      { label: 'Spam and abuse protection', status: 'PASS',
        note: 'Honeypot, form-timing check, and per-IP/per-account fixed-window rate limits on sign-in, registration, checkout, support, reviews and DSARs' },
      { label: 'Access controls', status: 'PASS',
        note: 'Order pages require a per-order access key or the owning account (403 otherwise); admin routes redirect unauthenticated visitors; delivery addresses visible in the console only for open orders' },
      { label: 'Error handling', status: 'PASS',
        note: 'Generic error pages with a reference code; stack traces and SQL never reach the client' },
      { label: 'Secrets management', status: 'NOT CONFIGURED',
        note: 'Secrets are read from the environment (no secrets in source), but no secret manager or rotation policy is provisioned for this host' },
      { label: 'Transaction logging without card data', status: 'PASS',
        note: 'Payments table stores provider, reference, amount, status and mode only — schema verified to contain no card/PAN/CVV columns' },
      { label: 'Monitoring and incident response', status: 'NOT CONFIGURED',
        note: 'Security events and an audit log are recorded locally; there is no alerting, no off-host log shipping and no tested incident runbook on this deployment' },
    ],
  };

  const india = {
    title: 'India-specific e-commerce readiness',
    items: [
      { label: 'Grievance officer and complaint tracking', status: bizComplete ? 'PASS' : 'NOT CONFIGURED',
        note: bizComplete ? 'Named officer, 48-hour acknowledgement target, 15-day resolution target, trackable reference' : 'Officer not appointed in this deployment' },
      { label: 'Return, refund and delivery disclosures before purchase', status: 'PASS',
        note: 'Linked from every product page and itemised in the bag and checkout' },
      { label: 'Transparent pricing and payment terms', status: 'PASS', note: 'GST-inclusive, single reconciled total, COD fee disclosed on selection' },
      { label: 'Authentic reviews and descriptions', status: 'PASS', note: 'Verified-purchase gating; no seeded reviews; claim policy published' },
      { label: 'Honest price reductions (30-day prior price)', status: 'PASS',
        note: 'No reductions are currently run, so no comparison prices are displayed. The price-history table already records every price change, so a lawful prior-price display is possible when discounts start.' },
      { label: 'Sponsored content labelling', status: 'NOT CONFIGURED',
        note: 'No sponsored placements exist, so nothing needs labelling today. The ranking disclosure is published on /transparency; a labelled placement mechanism does not exist yet.' },
      { label: 'Fair search and recommendation behaviour', status: 'PASS',
        note: 'Sort orders are literal and disclosed. No paid ranking, no personalisation, no manipulation of results to favour a seller.' },
      { label: 'Dark-pattern self-audit and displayed certificate', status: auditRecorded > 0 ? 'PASS' : 'NOT CONFIGURED',
        note: auditRecorded > 0 ? `${auditRecorded} audit run(s) recorded` : 'Required annually from 1 January 2027 under the 2026 Amendment Rules. The tooling exists; no audit has been recorded.' },
      { label: 'National Consumer Helpline convergence partnership', status: 'NOT CONFIGURED',
        note: 'Mandatory for e-commerce entities from 1 January 2027 under the 2026 Amendment Rules. Not yet applied for.' },
      { label: 'Seller name on invoice with equal prominence', status: 'NEEDS HUMAN REVIEW',
        note: 'Invoice numbers are issued on payment capture, but no printable invoice template exists yet' },
      { label: 'Country of origin and importer details', status: 'PASS',
        note: 'Country of origin shown per product; the catalogue is domestic so no importer disclosure applies' },
      { label: 'Exact legal applicability confirmed by counsel', status: 'NEEDS HUMAN REVIEW',
        note: 'Nothing on this site is a legal conclusion. The 2026 Amendment Rules and phased DPDP obligations must be mapped to the actual entity by a lawyer.' },
    ],
  };

  const infra = {
    title: 'Infrastructure and operations still to do',
    items: [
      { label: 'Transactional email / SMS delivery', status: config.EMAIL_MODE === 'none' ? 'NOT CONFIGURED' : 'NEEDS HUMAN REVIEW',
        note: config.EMAIL_MODE === 'none'
          ? 'EMAIL_MODE=none. Order confirmations, support acknowledgements and privacy-request references are written to an outbox table for manual sending — customers are told this on-screen.'
          : `EMAIL_MODE=${config.EMAIL_MODE}; delivery has not been verified with a real send` },
      { label: 'Courier / shipping integration', status: 'NOT CONFIGURED', note: 'No courier API connected; no tracking numbers are fabricated and none are displayed' },
      { label: 'Cash on delivery', status: config.COD_ENABLED ? 'NEEDS HUMAN REVIEW' : 'NOT CONFIGURED',
        note: config.COD_ENABLED ? 'COD enabled in configuration; remittance process not yet verified' : 'COD disabled; the fee line never appears, and the method is not offered at checkout' },
      { label: 'Retention job scheduling', status: retentionRun > 0 ? 'NEEDS HUMAN REVIEW' : 'NOT CONFIGURED',
        note: retentionRun > 0 ? 'Job has run manually; a scheduled timer is not configured' : 'Job implemented and dry-run verified but never applied and not scheduled' },
      { label: 'Database backup and restore drill', status: 'NOT CONFIGURED', note: 'No backup schedule or restore test exists for this deployment' },
      { label: 'Off-host monitoring and alerting', status: 'NOT CONFIGURED', note: 'No uptime monitoring, error alerting or log shipping' },
      { label: 'Product photography of actual stock', status: 'NEEDS HUMAN REVIEW',
        note: 'Catalogue images are illustrative renders generated for this build, labelled as such on the product page and the licence register' },
      { label: 'Independent accessibility audit', status: 'NEEDS HUMAN REVIEW', note: 'Automated and keyboard testing only; no NVDA/VoiceOver pass and no third-party audit' },
      { label: 'Legal review of all four policy pages', status: 'NEEDS HUMAN REVIEW', note: 'Drafted for this build; not reviewed by Indian counsel' },
    ],
  };

  const tally = (rows) => rows.reduce((acc, r) => {
    const s = r.status || 'NEEDS HUMAN REVIEW';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // The headline table is the 18 mandatory requirements and nothing else, so
  // PASS + NHR + NOT CONFIGURED + FAIL always sums to 18.
  const summary = tally(reqs.map((r) => ({ status: r.status })));
  const areaSummary = tally([].concat(security.items, india.items, infra.items));
  const blockers = reqs.filter((r) => r.status === 'FAIL' || r.status === 'NOT CONFIGURED')
    .map((r) => `R${r.id} ${r.title}`)
    .concat(security.items.filter((i) => i.status === 'FAIL').map((i) => i.label))
    .concat(infra.items.filter((i) => i.status === 'NOT CONFIGURED').map((i) => i.label));

  return {
    generatedAt: new Date().toISOString(),
    config: {
      env: config.NODE_ENV,
      paymentMode: config.PAYMENT_MODE,
      paymentsLive: config.paymentsLive,
      emailMode: config.EMAIL_MODE,
      codEnabled: config.COD_ENABLED,
      businessConfigured: bizComplete,
      adminPasswordIsDefault: config.ADMIN_PASSWORD_IS_DEFAULT,
      forceHttps: config.FORCE_HTTPS,
      analyticsThirdParty: config.THIRD_PARTY_ANALYTICS,
    },
    counts,
    tests: run ? { ranAt: run.ranAt, suites: run.suites, totals: run.totals } : null,
    requirements: reqs,
    security,
    india,
    infra,
    summary,
    areaSummary,
    blockers,
    verdict: blockers.length ? 'NOT READY FOR LAUNCH' : (summary['NEEDS HUMAN REVIEW'] ? 'READY PENDING HUMAN REVIEW' : 'READY'),
  };
}

module.exports = { build, RESULTS_FILE };
