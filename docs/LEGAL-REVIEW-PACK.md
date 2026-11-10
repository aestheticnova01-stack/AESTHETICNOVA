# AESTHETICNOVA — Legal review pack

Everything a reviewing lawyer needs in one place, plus the questions this build
deliberately did **not** answer for itself.

> **Status:** all four policy pages are drafted and marked **NEEDS HUMAN REVIEW**.
> They contain no invented entity, registration, address, phone number or certification.
> Nothing in this pack is legal advice.

---

## 1. The four documents

| Page | Route | Source | Words |
|---|---|---|---|
| Privacy Policy | `/privacy` | `views/legal/privacy.ejs` | ~2,600 |
| Terms of Service | `/terms` | `views/legal/terms.ejs` | ~2,200 |
| Refund & Return Policy | `/returns` | `views/legal/returns.ejs` | ~1,600 |
| Cookie Policy | `/cookies` | `views/legal/cookies.ejs` | ~1,500 |

Related: `/business-details`, `/privacy-requests`, `/accessibility`, `/transparency`,
`/launch-readiness`.

## 2. Facts asserted, and where each comes from

| Fact | Value used | Source of truth in the build |
|---|---|---|
| DPDP Rules 2025 notified | 13 November 2025 (G.S.R. 846(E)) | Public gazette; stated in `/privacy` §16 |
| Phase 1 in force | 13 November 2025 — definitions + Data Protection Board | as above |
| Phase 2 | 13 November 2026 — Consent Manager framework | as above |
| Phase 3 (substantive duties) | 13 May 2027 — notice, security, breach, retention, grievance officer, rights | as above |
| E-Commerce Amendment Rules 2026 in force | 1 January 2027 | Public notification; stated in `/terms` and `/transparency` |
| Prior-price rule (30-day lowest) | Implemented as a `price_history` table; no discounts currently run, so no comparison prices are shown | `src/db.js`, `/about` |
| GST rate | 18%, inclusive | `config.GST_RATE`; visible in every order summary |
| Invoice retention | 8 years | `docs/SECURITY-OPERATIONS.md` §8, enforced in `src/retention.js` |

**No statute text is quoted as if it were advice.** Where a conclusion is drawn, the
document says it needs review.

## 3. Questions for counsel — please answer each in writing

### Entity and consumer law
1. Does the entity behind `BIZ_LEGAL_ENTITY` need to be a company, an LLP or a proprietorship for the intended scale, and does that change any disclosure on `/business-details`?
2. Is the grievance-officer appointment wording sufficient for the Consumer Protection (E-Commerce) Rules 2020 **and** the 2026 Amendment Rules' expanded duties (48-hour acknowledgement, one-month resolution, copy of the recorded complaint)?
3. Is the limitation-of-liability clause in `/terms` §13 enforceable in India as drafted, and does it survive the Consumer Protection Act 2019's prohibition on unfair contract terms?
4. Is the earring hygiene exclusion in `/returns` §4 lawful, and what proof standard applies when a customer disputes that the seal was opened?
5. Does selling to consumers across all Indian States/UTs require any additional registration beyond GST, and does the "place of supply" treatment differ for jewellery?

### Data protection
6. Do the field-level purposes and legal grounds in `/privacy` §3 map correctly onto DPDP Act 2023 §4 purposes, particularly "legitimate uses" versus consent for security logging?
7. Is the consent-receipt record (choices + timestamp + policy version + HMAC of IP and user agent) sufficient evidence of consent under DPDP Rules 2025 Rule 3, or is more required?
8. The build honours Global Privacy Control and Do Not Track as opt-outs. Is the GPC downgrade behaviour (refusing analytics/marketing even on an "Accept all" press) acceptable, or should the banner instead block the action with an explanation?
9. Deletion currently (a) erases profile data, (b) redacts delivery details on closed orders while retaining invoice amounts for 8 years, and (c) **anonymises** published reviews rather than deleting them. Is (c) defensible, and should the review text be removed entirely on request?
10. Is 30 days a defensible response target for data-principal rights requests given the DPDP Rules timeline, and does the verification method (order reference or signed-in session, with human review as fallback) meet the "reasonable steps to verify identity" standard?
11. Does this store need to appoint a Data Protection Officer or an India-based representative, given it is not designated a Significant Data Fiduciary?
12. Children's data: the store is 18+ and runs no behavioural advertising. Is an age-gate required, or is the stated position in `/privacy` §12 adequate?

### Advertising, pricing and reviews
13. `/transparency` states that no sponsored placements exist. If the business later wants paid placement on its own inventory, what labelling does the 2026 Amendment Rules require?
14. The 30-day prior-price rule uses a `price_history` table. Please confirm the required display format and whether the "lowest price in 30 days" reference applies to a first-ever price (no prior price).
15. Reviews are gated to verified buyers and negative reviews are published — is the moderation policy in `/terms` §12 sufficient, and does the "anonymise rather than delete" behaviour on account deletion create any consumer-law exposure?

### Sector-specific
16. Are there BIS or hallmarking obligations applicable to stainless-steel fashion jewellery sold online in India (as distinct from gold/silver hallmarking under the BIS Act)? This build makes **no** purity claim.
17. Do any care or material statements in the product data cross into regulated health claims?

## 4. What this build does NOT claim

- Not "DPDP compliant". Implemented ahead of commencement; compliance is a legal determination.
- Not WCAG 2.2 AA certified. Target set, automated + keyboard testing done, **no independent audit**.
- Not PCI-DSS certified. The app never touches card data; the gateway carries that scope.
- No ISO, SOC 2, MeitY or Government certification of any kind. Nothing on the site displays one.
- No "hypoallergenic", "waterproof", "tarnish-proof", "nickel-free", "316L" or "lifetime guarantee" claim.

## 5. Sign-off block

| Item | Reviewer | Date | Outcome |
|---|---|---|---|
| Privacy Policy | | | |
| Terms of Service | | | |
| Refund & Return Policy | | | |
| Cookie Policy | | | |
| Business details / GSTIN verification | | | |
| Accessibility audit (independent) | | | |
| Security review / penetration test | | | |

Complete this table, then update `/launch-readiness` — the report is the record of what
has actually been reviewed, so a blank row means the requirement stays open.
