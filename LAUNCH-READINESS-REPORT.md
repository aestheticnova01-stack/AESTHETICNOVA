# AESTHETICNOVA — Launch-readiness report

Generated **Tue, 03 Nov 2026 14:48:12 GMT** from live configuration, database state and the recorded test run.

## Verdict: NOT READY FOR LAUNCH

| Status | Count |
|---|---|
| PASS | 11 |
| NEEDS HUMAN REVIEW | 6 |
| NOT CONFIGURED | 1 |
| FAIL | 0 |

**Blocking items: 7**

- R16 Business details

- Authentication protection

- Transactional email / SMS delivery

- Courier / shipping integration

- Cash on delivery

- Database backup and restore drill

- Off-host monitoring and alerting

## Automated verification

Last run 2026-11-03T14:48:12.028Z — **117/117 checks passed**, 0 failed.

| Suite | Pass | Fail | Total |
|---|---|---|---|
| contrast | 48 | 0 | 48 |
| a11y | 15 | 0 | 15 |
| e2e | 54 | 0 | 54 |

## All 18 requirements

| # | Requirement | Status |
|---|---|---|
| 1 | Privacy Policy | **NEEDS HUMAN REVIEW** |
| 2 | Terms of Service | **NEEDS HUMAN REVIEW** |
| 3 | Refund and Return Policy | **NEEDS HUMAN REVIEW** |
| 4 | Cookie Policy | **PASS** |
| 5 | Cookie consent banner | **PASS** |
| 6 | Form consent | **PASS** |
| 7 | Data minimisation | **PASS** |
| 8 | Third-party SDK and tracker audit | **PASS** |
| 9 | Dark patterns removed | **PASS** |
| 10 | No hidden fees | **PASS** |
| 11 | No fake reviews | **PASS** |
| 12 | No unsupported claims | **PASS** |
| 13 | Image alt text | **PASS** |
| 14 | Colour contrast | **PASS** |
| 15 | Keyboard navigation | **NEEDS HUMAN REVIEW** |
| 16 | Business details | **NOT CONFIGURED** |
| 17 | Font and image licensing | **NEEDS HUMAN REVIEW** |
| 18 | Privacy & Data Requests | **NEEDS HUMAN REVIEW** |

## Requirement detail


### R1 Privacy Policy — NEEDS HUMAN REVIEW

Comprehensive policy published covering collection, purpose, sharing, retention, rights, withdrawal, deletion and contact. Written against the DPDP Act 2023 and the DPDP Rules 2025 with real commencement dates.

**Verified:**
- /privacy renders 16 sections including a data table whose every row maps to a real database column
- Withdrawal route published and functional (tested under R5)
- Grievance contact and Data Protection Board escalation path stated

**Open:**
- The policy text has NOT been reviewed by Indian counsel. Until it has, it must not be represented as establishing legal compliance.
- Controller identity is incomplete: BIZ_LEGAL_ENTITY / BIZ_ADDRESS not set in this deployment, so §2 renders “not configured”.
- Final DPDP obligations commence 13 May 2027; the notice format in DPDP Rules 2025 Rule 3 should be checked against the notified text before that date.

**Action:** Obtain written review from an Indian data-protection lawyer; record the reviewer and date in this report before launch.

### R2 Terms of Service — NEEDS HUMAN REVIEW

Terms drafted covering website use, orders and acceptance, pricing, customer responsibilities, cancellation, shipping/returns, liability and a five-step dispute route including consumer commissions.

**Verified:**
- /terms renders 16 sections with no invented entity, registration, address or phone number
- Every business-specific field is injected from configuration and renders as “not configured” when absent
- Governing law stated as India; consumer-commission route preserved rather than displaced by arbitration

**Open:**
- Business identity (legal entity, address, GSTIN) is NOT CONFIGURED on this deployment — /terms renders placeholders in those slots.
- Limitation-of-liability clause needs a lawyer’s view on enforceability in India.
- Terms have not been reviewed against the Consumer Protection (E-Commerce) (Amendment) Rules, 2026, which commence 1 January 2027.

**Action:** Complete the BIZ_* environment values, then obtain legal review and sign-off before publication.

### R3 Refund and Return Policy — NEEDS HUMAN REVIEW

Dedicated policy covering eligibility, a 7-day window, exchange conditions, damaged/incorrect procedures, who pays return shipping, refund methods and timelines, lawful non-returnable items and the support process.

**Verified:**
- Return link present in the footer, on every product page and in the order confirmation
- Refund timelines and shipping responsibility are itemised in tables, not prose
- Statutory consumer rights stated as overriding the policy

**Open:**
- The window, shipping amounts and timelines are configuration values — the owner must confirm the business can actually honour them at volume.
- Earring hygiene exclusion should be checked by counsel for lawful applicability.
- No returns workflow automation exists yet: returns are handled as support tickets (verified working).

**Action:** Owner sign-off on the concrete numbers, then legal review of the hygiene exclusion.

### R4 Cookie Policy — PASS

Cookie policy generated from the same register the code uses, listing only technologies actually present: 2 first-party cookies, 1 cookieless self-hosted counter, and explicit non-use of GA/GTM/Meta Pixel/third-party fonts/embeds.

**Verified:**
- /cookies lists 5 active technologies and 8 explicitly disabled or removed ones with reasons
- Verified by network capture: 0 external requests across 9 core pages
- Retention period stated per item and enforced by the retention job (see R7)

**Action:** None. Re-verify whenever a new script is added.

### R5 Cookie consent banner — PASS

Accessible banner with Accept all / Reject non-essential / Customise preferences. Non-essential categories default to OFF. Accept and reject are the same size and the same number of clicks. Persistent “Cookie settings” link in the footer, plus a withdrawal endpoint.

**Verified:**
- Analytics writes nothing before consent (measured row count before/after browsing)
- Rejecting blocks the first-party counter (measured) — not merely hidden in the UI
- Accept-all and reject go through the same server path and mint an auditable receipt
- Withdrawal stops counting immediately and creates a second receipt
- Cart and checkout still work with every optional category rejected
- Keyboard tested: all three choices tabbable, equal prominence (same height and font size)

**Action:** None. Re-run the suite after any change to consent logic.

### R6 Form consent — PASS

Every form audited: contact/grievance, registration, checkout, newsletter, review submission, support and data requests. Marketing consent is a separate, unchecked control on each and is never required.

**Verified:**
- Registration: marketing checkbox optional and unchecked; no DOB, gender or address collected
- Checkout: marketing optional and unchecked; terms acceptance and a privacy acknowledgement are separately required
- Newsletter: email only, with an explicit “optional and not a condition of any order” statement
- Support and data-request forms carry an inline notice of what is collected, why and for how long

**Action:** None.

### R7 Data minimisation — PASS

Field-level minimisation enforced in the schema: no date of birth, gender, photo, ID numbers or location columns exist. No payment-card field exists anywhere. A documented retention job implements every stated period.

**Verified:**
- Schema audit of the users table: 13 columns, none unnecessary
- Card data is never captured: the orders and payments tables have no card/PAN/CVV columns
- Retention job (src/retention.js) implements 9 rules that map to Privacy Policy §9
- Retention job has executed on this deployment (4 recorded run(s)); the 9 rules and their results are shown at /admin/retention

**Open:**
- A manual run is not a schedule. Nothing on this host invokes the job automatically — no cron entry, timer or job runner exists. Until one is installed, deletions rely on someone pressing a button.
- Abandoned-bag and outbox periods should be confirmed against the business’s actual support needs.

**Action:** Install the cron entry documented in docs/SECURITY-OPERATIONS.md §8, run it once, and confirm the affected counts are non-zero where data should have expired.

### R8 Third-party SDK and tracker audit — PASS

Full inventory in the database (provider, purpose, data, cookies, retention, consent category, status). Google Analytics, Meta Pixel and GTM are explicitly NOT deployed — verified by capturing every network request in a real browser.

**Verified:**
- 5 active technologies, all first-party; 0 third-party trackers active
- Network capture across 9 pages: zero requests leaving the origin
- CSP lists no external origin in script/style/font/img/connect
- Fonts self-hosted, so no visitor IP is disclosed to a font CDN
- The only external script in the codebase is the payment gateway, loaded solely on the payment page after the buyer chooses to pay

**Open:**
- When a live payment gateway is connected, its script must be added to the register and to the CSP before go-live.

**Action:** Update the register and CSP in the same change that adds any external script; re-run the tracker test.

### R9 Dark patterns removed — PASS

No countdown timers, no artificial urgency, no fabricated scarcity, no pre-ticked paid add-ons, no bundled consent, no misleading checkout labels, no difficult cancellation. Cancellation is one click before dispatch and refunds are to the original method.

**Verified:**
- Rendered-copy scan across 4 pages, negation-aware, with 9 dark-pattern patterns
- Structural check: zero pre-checked optional inputs and zero countdown elements in checkout
- Cancellation is a single button in the account area with an explanatory confirm, not a phone call
- Rejecting cookies is one click and is not followed by a second “are you sure” step

**Action:** Repeat annually and record each run.

### R10 No hidden fees — PASS

One pricing engine produces every number in the journey, so the bag, checkout, payment page and invoice cannot disagree. Prices are GST-inclusive, shipping is added before payment, and the COD fee appears the moment it is selected.

**Verified:**
- Reconciliation test on a real order: subtotal + shipping + COD = total, exactly
- No charge appears after the total is displayed
- GST component derived and itemised (18%)
- Zero packaging, handling or platform fees — stated explicitly rather than merely absent

**Open:**
- Shipping and COD amounts are owner-editable; the COD fee must be confirmed as the real courier cost before enabling COD.

**Action:** Confirm the fee schedule with the owner and re-run the reconciliation test after any pricing change.

### R11 No fake reviews — PASS

There is no path for a fabricated review to enter the system: no seed data, no import, no admin “add review”. Reviews require a signed-in customer with a real order for that product, and the verified label is computed from that order.

**Verified:**
- 0 reviews in the database (0 approved) — the honest state of a new store
- Empty state is explicit: “No reviews yet… we do not invent reviews, star ratings or customer photos”
- Anonymous review POST rejected: no row written
- Rejection in moderation requires a written reason; negativity alone is not grounds

**Action:** None. Preserve the constraint that only verified buyers can review.

### R12 No unsupported claims — PASS

Product copy is scanned for hypoallergenic, waterproof, tarnish-proof, nickel-free, 316L, lifetime guarantee, certified and medically-safe claims. None are made. The About page publishes a claim-by-claim position, including what we refuse to say and why.

**Verified:**
- Automated scan of every product description, detail line and care note: zero affirmative banned claims
- Each product page has a “What we do not claim” block
- /about lists seven claims with the reason each is not made
- Country of origin and seller are shown per product

**Open:**
- Product photography is illustrative, not photographs of the physical stock — see R17.
- A 316L grade statement is deliberately withheld until supplier certificates cover every style.

**Action:** Before launch, replace illustrative renders with photographs of the actual items and, if grade documentation arrives, add the specific claim per product with the certificate referenced.

### R13 Image alt text — PASS

Every <img> carries either a descriptive alt or a deliberate empty alt for decoration. Category and editorial images describe the object, material and setting; product alts name the piece, material and finish.

**Verified:**
- Browser audit of 12 pages: no missing alt and no unlabelled image-only links
- No keyword stuffing; alts are single descriptive sentences
- Decorative duplication (card image beside its own heading) uses alt="" with an aria-hidden wrapper link

**Action:** Re-audit whenever an image is added; the suite fails on a missing alt.

### R14 Colour contrast — PASS

Two independent checks: 48 design-system colour pairings computed against WCAG thresholds, and a browser measurement of every visible text node on 12 pages against its actual painted background.

**Verified:**
- 48/48 design-system pairings meet their threshold (4.5:1 text, 3:1 large text and UI boundaries)
- Every rendered text node on 12 pages measured against its computed background — zero failures
- Secondary body text #595959 measures 7.0:1 on white and 6.5:1 on the off-white background
- Focus rings measure 5.6:1 on light and 9.4:1 on dark

**Action:** None. These tests run on every build.

### R15 Keyboard navigation — NEEDS HUMAN REVIEW

Skip link, visible focus, logical order, native dialog for the bag, Escape dismissal, managed focus and labelled form errors — all exercised by a real keyboard in the test suite. Reduced motion honoured.

**Verified:**
- Skip link is the first tab stop, becomes visible on focus and moves focus to <main>
- Focus ring measured at 3px solid with 5.6:1 contrast
- Bag drawer: opens by keyboard, moves focus inside, closes on Escape, restores focus to the trigger
- Consent preferences: focus moves to the first optional toggle, Escape returns focus to the trigger
- Heading order has no skipped levels and exactly one h1 on 12 pages
- prefers-reduced-motion disables the ticker and never leaves content hidden
- No horizontal overflow at a 320px viewport on 4 key pages

**Open:**
- No screen-reader testing has been performed with NVDA, JAWS or VoiceOver. Automated checks cannot substitute for it.
- No independent accessibility audit has been carried out, so full WCAG 2.2 AA conformance must not be claimed.

**Action:** Run a manual audit with NVDA on Windows and VoiceOver on iOS across the purchase journey, and record the results here.

### R16 Business details — NOT CONFIGURED

A business-information page with editable configuration fields for trading name, legal entity, address, support email and phone, GSTIN, grievance officer, complaint tracking and support hours, plus country of origin and seller identity.

**Verified:**
- /business-details renders every field, or a labelled “not configured” marker — never a placeholder that looks real
- Grievance route issues a reference, records an acknowledgement timestamp and is trackable at /support/status
- Country of origin appears on every product page and seller identity in the product’s detail panel
- Required identity values are missing from this deployment

**Open:**
- BIZ_LEGAL_ENTITY, BIZ_ADDRESS, BIZ_GSTIN, BIZ_GRIEVANCE_OFFICER and BIZ_GRIEVANCE_EMAIL are not set.
- The National Consumer Helpline convergence partnership required by the 2026 Rules from 1 January 2027 has not been applied for.

**Action:** Supply the business identity values, verify the GSTIN is live and matches the invoice template, and register as an NCH convergence partner.

### R17 Font and image licensing — NEEDS HUMAN REVIEW

A machine-checked asset register: the test suite fails if any file in /public/img or /public/fonts is missing from the register. Fonts are OFL-licensed and self-hosted; no third-party brand imagery is used.

**Verified:**
- Every image and font file appears in the register (verified by file-system cross-check)
- Space Grotesk and Inter are SIL Open Font License 1.1, self-hosted from /fonts
- Icons are inline SVG drawn for the project — no icon-font dependency
- No campaign, celebrity, competitor or third-party logo imagery anywhere

**Open:**
- The product images are illustrative renders generated for this build, not photographs of the physical products. A customer must see the real item before deciding.
- The customer photographs that will replace them need their own licence record, or a release from the photographer and any model pictured.

**Action:** Commission photography of the actual inventory and add the OFL licence text alongside the font files.

### R18 Privacy & Data Requests — NEEDS HUMAN REVIEW

A real DSAR workflow: reference number, private status page, identity verification that can fail, admin queue, and system-executed deletion that refuses to run unverified and refuses to claim completion without a written outcome.

**Verified:**
- Request creates a PR-XXXXXXXX-XXXXXX reference with a 30-day due date and an event history
- A wrong verification factor does not mark the request verified
- Deletion is refused with HTTP 409 until identity is verified
- Deletion executes in a transaction: sessions revoked, wishlist and profile erasure, closed tickets deleted, reviews anonymised
- Open orders keep delivery details (needed to deliver) and the requester is told why in writing
- Invoice figures are retained for 8 years and the lawful-hold note explains it
- The retention job completes the redaction once the order closes

**Open:**
- Email delivery is not configured, so requesters are not automatically emailed their reference — they must keep the on-screen link.
- Deletion is executed by an operator from the admin console; there is no self-service erasure, which is a deliberate safeguard but adds human latency.

**Action:** Connect a transactional email provider so acknowledgements and outcomes are actually delivered, and set a 30-day SLA reminder.

## Security and checkout safeguards

| Item | Status | Detail |
|---|---|---|
| HTTPS enforcement | **NOT CONFIGURED** | FORCE_HTTPS is off (expected behind the platform TLS proxy, but not verified for this deployment) |
| Secure session handling | **PASS** | Server-side sessions, rotation on sign-in, HttpOnly + SameSite=Lax + Secure-when-https, CSRF on every state change (unsigned POST returns 403) |
| Authentication protection | **FAIL** | ADMIN_PASSWORD is not set, so the built-in fallback is in use. This is a launch blocker. |
| Payment gateway integration | **NOT CONFIGURED** | Running in labelled simulator mode. No merchant account connected, so no real money can be taken. Card data is never collected by this app. |
| Server-side input validation | **PASS** | Every field validated and length-capped on the server; client validation is advisory only |
| Spam and abuse protection | **PASS** | Honeypot, form-timing check, and per-IP/per-account fixed-window rate limits on sign-in, registration, checkout, support, reviews and DSARs |
| Access controls | **PASS** | Order pages require a per-order access key or the owning account (403 otherwise); admin routes redirect unauthenticated visitors; delivery addresses visible in the console only for open orders |
| Error handling | **PASS** | Generic error pages with a reference code; stack traces and SQL never reach the client |
| Secrets management | **NOT CONFIGURED** | Secrets are read from the environment (no secrets in source), but no secret manager or rotation policy is provisioned for this host |
| Transaction logging without card data | **PASS** | Payments table stores provider, reference, amount, status and mode only — schema verified to contain no card/PAN/CVV columns |
| Monitoring and incident response | **NOT CONFIGURED** | Security events and an audit log are recorded locally; there is no alerting, no off-host log shipping and no tested incident runbook on this deployment |

## India-specific readiness

| Item | Status | Detail |
|---|---|---|
| Grievance officer and complaint tracking | **NOT CONFIGURED** | Officer not appointed in this deployment |
| Return, refund and delivery disclosures before purchase | **PASS** | Linked from every product page and itemised in the bag and checkout |
| Transparent pricing and payment terms | **PASS** | GST-inclusive, single reconciled total, COD fee disclosed on selection |
| Authentic reviews and descriptions | **PASS** | Verified-purchase gating; no seeded reviews; claim policy published |
| Honest price reductions (30-day prior price) | **PASS** | No reductions are currently run, so no comparison prices are displayed. The price-history table already records every price change, so a lawful prior-price display is possible when discounts start. |
| Sponsored content labelling | **NOT CONFIGURED** | No sponsored placements exist, so nothing needs labelling today. The ranking disclosure is published on /transparency; a labelled placement mechanism does not exist yet. |
| Fair search and recommendation behaviour | **PASS** | Sort orders are literal and disclosed. No paid ranking, no personalisation, no manipulation of results to favour a seller. |
| Dark-pattern self-audit and displayed certificate | **PASS** | 1 audit run(s) recorded |
| National Consumer Helpline convergence partnership | **NOT CONFIGURED** | Mandatory for e-commerce entities from 1 January 2027 under the 2026 Amendment Rules. Not yet applied for. |
| Seller name on invoice with equal prominence | **NEEDS HUMAN REVIEW** | Invoice numbers are issued on payment capture, but no printable invoice template exists yet |
| Country of origin and importer details | **PASS** | Country of origin shown per product; the catalogue is domestic so no importer disclosure applies |
| Exact legal applicability confirmed by counsel | **NEEDS HUMAN REVIEW** | Nothing on this site is a legal conclusion. The 2026 Amendment Rules and phased DPDP obligations must be mapped to the actual entity by a lawyer. |

## Infrastructure and operations

| Item | Status | Detail |
|---|---|---|
| Transactional email / SMS delivery | **NOT CONFIGURED** | EMAIL_MODE=none. Order confirmations, support acknowledgements and privacy-request references are written to an outbox table for manual sending — customers are told this on-screen. |
| Courier / shipping integration | **NOT CONFIGURED** | No courier API connected; no tracking numbers are fabricated and none are displayed |
| Cash on delivery | **NOT CONFIGURED** | COD disabled; the fee line never appears, and the method is not offered at checkout |
| Retention job scheduling | **NEEDS HUMAN REVIEW** | Job has run manually; a scheduled timer is not configured |
| Database backup and restore drill | **NOT CONFIGURED** | No backup schedule or restore test exists for this deployment |
| Off-host monitoring and alerting | **NOT CONFIGURED** | No uptime monitoring, error alerting or log shipping |
| Product photography of actual stock | **NEEDS HUMAN REVIEW** | Catalogue images are illustrative renders generated for this build, labelled as such on the product page and the licence register |
| Independent accessibility audit | **NEEDS HUMAN REVIEW** | Automated and keyboard testing only; no NVDA/VoiceOver pass and no third-party audit |
| Legal review of all four policy pages | **NEEDS HUMAN REVIEW** | Drafted for this build; not reviewed by Indian counsel |

## Remediation plan, in dependency order

Work top to bottom: each step unblocks the next. Nothing here can be closed by editing copy.

| # | Action | Closes | Who |
|---|---|---|---|
| 1 | Set `ADMIN_PASSWORD` to a unique 20+ character secret and store it in a secret manager | Authentication protection (FAIL) + Secrets management | Owner |
| 2 | Complete every `BIZ_*` variable and verify each value against the GST certificate | R16 Business details, R1 and R2 identity gaps | Owner |
| 3 | Connect the payment gateway (or launch deliberately in demo mode with "no live payments" stated on every screen) | Payment gateway integration | Owner + developer |
| 4 | Configure transactional email so requesters actually receive their DSAR reference and order updates | Transactional email / SMS | Developer |
| 5 | Decide COD: enable with a tested fee, or state plainly that it is unavailable | Cash on delivery | Owner |
| 6 | Integrate a courier API, or state plainly that tracking is not available and dispatch is manual | Courier / shipping | Owner + developer |
| 7 | Schedule the retention job (cron in `docs/SECURITY-OPERATIONS.md` §8) and record one real run | R7 scheduling | Developer |
| 8 | Create a backup schedule **and perform a restore drill**, recording the result | Database backup and restore | Developer |
| 9 | Ship logs off-host and configure error/uptime alerting | Off-host monitoring | Developer |
| 10 | Draft sign-off in `docs/LEGAL-REVIEW-PACK.md` §5 — four policies, identity, accessibility, security | R1, R2, R3, R15 | Counsel + owner |
| 11 | Commission an independent accessibility audit (NVDA/JAWS pass minimum) | R15 independent audit | External auditor |
| 12 | Shoot real product photography, add it to the licence register, replace the illustrative renders | R17 | Owner |
| 13 | Tabletop the incident runbook once and record the exercise | Incident readiness | Developer + owner |

## What this deployment already does correctly

Stated plainly, because a report that only lists gaps is not honest either:

- **No third-party scripts at all.** No analytics SDK, tag manager, pixel, chat widget, embed or CDN font — verified by capturing every network request in a real browser across nine pages.
- **Three first-party cookies**, one of which is the consent record itself. Nothing optional runs before a choice, and rejection is honoured immediately.
- **One pricing engine.** The bag, checkout, payment page and invoice read the same function, so the total shown is the total charged: a deterministic test reconciles subtotal + shipping + COD against the stored order.
- **Consent receipts are immutable and auditable** — choice, timestamp, policy version and a one-way HMAC of the IP address, never the address itself.
- **Deletion is real.** It refuses to run unverified, refuses to claim success without a written outcome, revokes sessions, erases profile data, retains the invoice for the statutory period and redacts delivery details once the order closes.
- **No review can be fabricated.** There is no seed data, no import and no admin "add review"; the verified label is computed from an actual order row.
- **Nothing is invented.** No company registration, address, GSTIN, phone number, certification, review, testimonial or product claim. Missing facts render as "not configured".

## How statuses are assigned

- **PASS** — an automated check or direct config read confirmed the behaviour on this deployment.
- **NEEDS HUMAN REVIEW** — requires a person (lawyer, auditor, owner); a machine cannot close it.
- **NOT CONFIGURED** — the capability does not exist here; the storefront says so rather than faking it.
- **FAIL** — behaviour is wrong or unsafe right now.
- Nothing here is legal advice or a compliance certification.
