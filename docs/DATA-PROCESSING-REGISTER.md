# AESTHETICNOVA — Data processing register and third-party inventory

Companion to `/transparency` and `/cookies`. The register is **data**, not documentation:
it lives in the `trackers` table (`src/seed.js`) and both the public Cookie Policy and the
Transparency page render from it, so the public disclosure cannot drift from the code.

---

## 1. Processing activities

| # | Activity | Data | Purpose | Ground | Retention | Recipients |
|---|---|---|---|---|---|---|
| P1 | Browse the catalogue | Session ID, chosen options | Serve pages, keep a bag | Necessary (contract/security) | 30 days | None |
| P2 | Create an account | Name, email, password hash; optional phone | Sign-in and order history | Contract | Until deletion | None |
| P3 | Place an order | Name, email, phone, address, order lines, amounts | Fulfil and invoice | Contract + tax law | 8 years (invoice) | Courier (when integrated); gateway |
| P4 | Take payment | Amount, order reference, provider payment ID and status | Collect and refund payment | Contract + tax law | 8 years with order | Razorpay (when live) |
| P5 | Send transactional email | Email, message content | Order status and support replies | Contract | 24 months (outbox) | Email provider (not yet configured) |
| P6 | Handle support / grievance | Name, email, optional phone and order ref, message | Resolve the issue | Contract / legitimate interest | 24 months after last contact | None |
| P7 | Moderate reviews | First name, rating, review text, order link | Publish verified reviews | Consent | Until removal request | None |
| P8 | Record consent | Category choices, timestamp, policy version, HMAC(IP), HMAC(UA) | Prove and honour consent | Legal obligation | 180 days | None |
| P9 | Count visits | Path + daily count only | Know which products are looked at | Consent (opt-in) | 13 months | None |
| P10 | Protect the service | Failed-login counts, rate-limit hits, HMAC(IP) | Detect abuse and fraud | Legitimate interest (security) | 90 days | None |
| P11 | Handle data requests | Name, email, request detail, verification method, outcome | Fulfil data-principal rights | Legal obligation | Life of request + 24 months | None |

**Not processed at all:** date of birth, gender, photographs of customers, identity-document
numbers, precise location, card numbers, CVV, UPI PIN, biometric data, advertising identifiers.

## 2. Third-party inventory (verified)

The automated suite captures **every network request** in a real browser across nine pages
and fails if any request leaves the origin. Current result: **zero external requests.**

| Service | Category | Deployed? | What it would receive | Consent gate |
|---|---|---|---|---|
| Google Analytics (GA4) | Analytics | **No** — no snippet, no SDK, no request | — | — |
| Google Tag Manager | Tag manager | **No** — deliberately omitted so unreviewed tags cannot be injected | — | — |
| Meta Pixel / CAPI | Marketing | **No** | — | — |
| TikTok / LinkedIn / Snap pixels | Marketing | **No** | — | — |
| Google Fonts (CDN) | Necessary | **No** — fonts self-hosted from `/fonts` | — | — |
| Third-party icon CDN | Necessary | **No** — inline SVG only | — | — |
| Chat widget (Intercom/Zendesk/Crisp) | Functional | **No** — on-site ticket form instead | — | — |
| Review platform (Judge.me/Yotpo) | Functional | **No** — first-party reviews only | — | — |
| YouTube/Vimeo/Instagram embeds | Functional | **No** — no iframes anywhere | — | — |
| WhatsApp Business API | Support | **No** — not integrated | — | — |
| Courier API (Shiprocket/Delhivery) | Necessary | **No** — fulfilment is manual in this build | — | — |
| Razorpay Checkout | Necessary | **Coded, not live** — script loads only on `/order/:ref/pay` after the buyer chooses to pay | Purchase is the purpose | Necessary for the chosen payment |
| Transactional email | Necessary | **No** — outbox only | — | — |
| CDN / WAF | Infrastructure | Provided by the hosting platform, not by this code | Request metadata | — |

### If a new service is added

1. Add a row to the `trackers` table (`src/seed.js`) with provider, purpose, data, cookies, retention and consent category.
2. Add a CSP entry **only if** it is strictly necessary, and document why.
3. If it is non-essential, gate it behind the consent state server-side — never load it and hide it.
4. Re-run `npm run audit`. Requirement 8 flips to FAIL if a third-party request appears while the register claims none.

## 3. International transfers

No processor outside India is currently active. The hosting provider may process request
metadata outside India; if so, this must be disclosed under DPDP Rules 2025 Rule 15 once
that rule commences (13 May 2027). **Not verified — flagged for review.**

## 4. Sub-processor due diligence

None possible yet: there are no active sub-processors beyond hosting. Before connecting a
gateway, email provider or courier, record: entity name, registered address, DPA signed,
security questionnaire outcome, breach-notification commitment, and data-location.
