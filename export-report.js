/** Generate the human-readable launch report from the live readiness engine. */
const fs = require('fs');
const { build } = require('./src/readiness');
const r = build();
const L = [];
const h = (s) => L.push(`\n## ${s}\n`);
L.push('# AESTHETICNOVA — Launch-readiness report');
L.push(`\nGenerated **${new Date(r.generatedAt).toUTCString()}** from live configuration, database state and the recorded test run.\n`);
L.push(`## Verdict: ${r.verdict}\n`);
L.push(`| Status | Count |\n|---|---|`);
['PASS','NEEDS HUMAN REVIEW','NOT CONFIGURED','FAIL'].forEach(k => L.push(`| ${k} | ${r.summary[k] || 0} |`));
L.push(`\n**Blocking items: ${r.blockers.length}**`);
r.blockers.forEach(b => L.push(`\n- ${b}`));
if (r.tests) {
  h('Automated verification');
  L.push(`Last run ${r.tests.ranAt} — **${r.tests.totals.pass}/${r.tests.totals.checks} checks passed**, ${r.tests.totals.fail} failed.\n`);
  L.push(`| Suite | Pass | Fail | Total |\n|---|---|---|---|`);
  Object.entries(r.tests.suites).forEach(([k,v]) => L.push(`| ${k} | ${v.pass} | ${v.fail} | ${v.total} |`));
}
h('All 18 requirements');
L.push('| # | Requirement | Status |\n|---|---|---|');
r.requirements.forEach(q => L.push(`| ${q.id} | ${q.title} | **${q.status}** |`));
h('Requirement detail');
r.requirements.forEach(q => {
  L.push(`\n### R${q.id} ${q.title} — ${q.status}\n`);
  L.push(q.summary + '\n');
  L.push('**Verified:**');
  q.evidence.forEach(e => L.push(`- ${e}`));
  if (q.open && q.open.length) { L.push('\n**Open:**'); q.open.forEach(o => L.push(`- ${o}`)); }
  if (q.action) L.push(`\n**Action:** ${q.action}`);
});
[['Security and checkout safeguards', r.security],['India-specific readiness', r.india],['Infrastructure and operations', r.infra]].forEach(([title, block]) => {
  h(title);
  L.push('| Item | Status | Detail |\n|---|---|---|');
  block.items.forEach(i => L.push(`| ${i.label} | **${i.status}** | ${i.note} |`));
});
h('Remediation plan, in dependency order');
L.push('Work top to bottom: each step unblocks the next. Nothing here can be closed by editing copy.');
L.push('');
L.push('| # | Action | Closes | Who |');
L.push('|---|---|---|---|');
[
  ['1', 'Set `ADMIN_PASSWORD` to a unique 20+ character secret and store it in a secret manager', 'Authentication protection (FAIL) + Secrets management', 'Owner'],
  ['2', 'Complete every `BIZ_*` variable and verify each value against the GST certificate', 'R16 Business details, R1 and R2 identity gaps', 'Owner'],
  ['3', 'Connect the payment gateway (or launch deliberately in demo mode with "no live payments" stated on every screen)', 'Payment gateway integration', 'Owner + developer'],
  ['4', 'Configure transactional email so requesters actually receive their DSAR reference and order updates', 'Transactional email / SMS', 'Developer'],
  ['5', 'Decide COD: enable with a tested fee, or state plainly that it is unavailable', 'Cash on delivery', 'Owner'],
  ['6', 'Integrate a courier API, or state plainly that tracking is not available and dispatch is manual', 'Courier / shipping', 'Owner + developer'],
  ['7', 'Schedule the retention job (cron in `docs/SECURITY-OPERATIONS.md` §8) and record one real run', 'R7 scheduling', 'Developer'],
  ['8', 'Create a backup schedule **and perform a restore drill**, recording the result', 'Database backup and restore', 'Developer'],
  ['9', 'Ship logs off-host and configure error/uptime alerting', 'Off-host monitoring', 'Developer'],
  ['10', 'Draft sign-off in `docs/LEGAL-REVIEW-PACK.md` §5 — four policies, identity, accessibility, security', 'R1, R2, R3, R15', 'Counsel + owner'],
  ['11', 'Commission an independent accessibility audit (NVDA/JAWS pass minimum)', 'R15 independent audit', 'External auditor'],
  ['12', 'Shoot real product photography, add it to the licence register, replace the illustrative renders', 'R17', 'Owner'],
  ['13', 'Tabletop the incident runbook once and record the exercise', 'Incident readiness', 'Developer + owner'],
].forEach(row => L.push('| ' + row.join(' | ') + ' |'));

h('What this deployment already does correctly');
L.push('Stated plainly, because a report that only lists gaps is not honest either:');
L.push('');
L.push('- **No third-party scripts at all.** No analytics SDK, tag manager, pixel, chat widget, embed or CDN font — verified by capturing every network request in a real browser across nine pages.');
L.push('- **Three first-party cookies**, one of which is the consent record itself. Nothing optional runs before a choice, and rejection is honoured immediately.');
L.push('- **One pricing engine.** The bag, checkout, payment page and invoice read the same function, so the total shown is the total charged: a deterministic test reconciles subtotal + shipping + COD against the stored order.');
L.push('- **Consent receipts are immutable and auditable** — choice, timestamp, policy version and a one-way HMAC of the IP address, never the address itself.');
L.push('- **Deletion is real.** It refuses to run unverified, refuses to claim success without a written outcome, revokes sessions, erases profile data, retains the invoice for the statutory period and redacts delivery details once the order closes.');
L.push('- **No review can be fabricated.** There is no seed data, no import and no admin "add review"; the verified label is computed from an actual order row.');
L.push('- **Nothing is invented.** No company registration, address, GSTIN, phone number, certification, review, testimonial or product claim. Missing facts render as "not configured".');

h('How statuses are assigned');
L.push('- **PASS** — an automated check or direct config read confirmed the behaviour on this deployment.\n- **NEEDS HUMAN REVIEW** — requires a person (lawyer, auditor, owner); a machine cannot close it.\n- **NOT CONFIGURED** — the capability does not exist here; the storefront says so rather than faking it.\n- **FAIL** — behaviour is wrong or unsafe right now.\n- Nothing here is legal advice or a compliance certification.');
fs.writeFileSync('LAUNCH-READINESS-REPORT.md', L.join('\n') + '\n');
console.log('Wrote LAUNCH-READINESS-REPORT.md —', r.verdict, '|', r.blockers.length, 'blockers');
