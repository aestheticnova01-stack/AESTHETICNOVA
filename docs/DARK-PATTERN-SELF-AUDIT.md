# AESTHETICNOVA — Dark-pattern self-audit record

Required annually for e-commerce entities under the Consumer Protection (E-Commerce)
(Amendment) Rules, 2026 (in force **1 January 2027**). This build runs the audit from
day one so the practice is real rather than retrofitted.

Every check below was performed against the deployed build. Where a check is enforced by
an automated test, the test name is given so it can be re-run.

---

## Audit 1 — build date 3 November 2026

**Scope:** all customer-facing templates (`views/**`), the consent system, checkout,
cancellation, returns and the review flow.
**Method:** rendered-copy scan, structural DOM inspection, keyboard walkthrough, and
manual review of every screen in the purchase journey.

### A. False urgency and scarcity

| # | Practice | Found? | Evidence |
|---|---|---|---|
| A1 | Countdown timers on products, cart or checkout | **No** | Structural scan for `[data-countdown]`, `.countdown`, `time[data-remaining]` → 0 elements |
| A2 | "Only X left" without a real stock figure | **No** | The stock line renders the actual `SUM(variants.stock)`; at 0 it says "Currently sold out" |
| A3 | "Hurry", "last chance", "almost gone" phrasing | **No** | Negation-aware copy scan over 4 pages; the only match was our own disclaimer ("no 'last chance' theatre") |
| A4 | Fake "X people viewing / bought recently" | **No** | No such component exists; scan found no matches |
| A5 | Reservation timers ("items held for 10:00") | **No** | Bag state is server-side with no expiry prompt; the empty state says "nothing expires and nothing is reserved by a timer" |

### B. Consent and privacy choices

| # | Practice | Found? | Evidence |
|---|---|---|---|
| B1 | Pre-ticked optional consent categories | **No** | All optional categories default to `false` in `src/consent.js DEFAULT_STATE` |
| B2 | Bundled marketing consent with order processing | **No** | Marketing is a separate unchecked control on registration, checkout, newsletter, support and contact forms |
| B3 | Asymmetric accept vs reject | **No** | Same button component, same height (46 px measured), same font size, same click count; reject is not hidden behind a second panel |
| B4 | Guilt-trip copy on reject ("No thanks, I like paying more") | **No** | Button labels are "Accept all" / "Reject non-essential" |
| B5 | Hard-to-find withdrawal | **No** | Footer "Cookie settings" on every page, plus a withdrawal endpoint on `/cookies` and in account preferences |
| B6 | Consent banner that cannot be dismissed without accepting | **No** | Reject is a first-class choice; nothing is gated behind acceptance |

### C. Pricing and checkout

| # | Practice | Found? | Evidence |
|---|---|---|---|
| C1 | Fee introduced after the total is shown | **No** | Deterministic test: order totals reconcile exactly (subtotal + shipping + COD = total) |
| C2 | Pre-selected paid add-on (gift wrap, insurance, express) | **No** | Zero pre-checked optional inputs in checkout |
| C3 | Crossed-out "was" price without a 30-day history | **No** | No discounts are run, so no comparison prices are displayed at all |
| C4 | Misleading primary button ("Continue" that charges) | **No** | The submit button states the action and the amount: "Place order — pay ₹X" |
| C5 | Drip pricing on shipping | **No** | Shipping appears in the bag, in checkout, and on the payment page; identical value throughout |
| C6 | COD fee revealed at the last step | **No** | Selecting COD updates the displayed total immediately (live recalculation) |

### D. Cancellation and exit

| # | Practice | Found? | Evidence |
|---|---|---|---|
| D1 | Cancellation only by phone or email | **No** | One-click cancel in the account area while the order is unshipped, with an explanatory confirm |
| D2 | Confirmshaming on cancellation | **No** | Confirm text describes the consequence ("stock released, payment refunded"), not a guilt trip |
| D3 | Retention offer walls before cancelling | **No** | No interstitial offers exist |
| D4 | Newsletter that cannot be left | **No** | Untick in profile, unsubscribe link, or a data request — all take effect immediately |

### E. Reviews and social proof

| # | Practice | Found? | Evidence |
|---|---|---|---|
| E1 | Invented testimonials or star ratings | **No** | Zero reviews seeded; database count printed on `/launch-readiness` |
| E2 | Verified badge without verification | **No** | Computed from an actual order row; anonymous submission is rejected |
| E3 | Fake customer photographs | **No** | No customer photos are displayed at all |
| E4 | Suppressing negative reviews | **No** | Moderation rejects only spam/abuse/personal data, and rejection requires a written reason |

### F. Interface manipulation

| # | Practice | Found? | Evidence |
|---|---|---|---|
| F1 | Pop-up that is hard to dismiss | **No** | The only overlay is the bag drawer (native `<dialog>`, Escape closes, focus restored) |
| F2 | Cookie wall blocking content | **No** | The banner is a non-modal region; browsing continues regardless |
| F3 | Hidden unsubscribe or account deletion | **No** | Both are linked in the footer and from the account area |
| F4 | Trick question in a consent dialog | **No** | No double negatives; switches are labelled by their outcome |
| F5 | Manipulated search ranking presented as organic | **No** | Ranking is disclosed on `/shop` and `/transparency`; no paid placement exists |

### Findings

**No dark patterns were found in this build.** Three items were fixed during the audit
itself and are recorded for completeness:

1. **Stock wording** — an earlier draft showed a bare "In stock" even at 1 unit. Replaced
   with an accurate count so a low-stock message can never be decorative.
2. **Empty-state copy** — the empty bag originally read "Hurry, pieces sell out". Removed;
   it was manufactured urgency with no data behind it.
3. **Newsletter footer** — the marketing checkbox was initially inside the same `<label>`
   as the email field, which made unticking easy to miss. Split into its own control.

### Next audit due

**3 November 2027** — or earlier if the catalogue, checkout, consent or review flow
changes materially. Record each run in `/admin/audit-log`; that entry is what
`/launch-readiness` reads for Requirement 9.
