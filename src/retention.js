'use strict';
/**
 * AESTHETICNOVA — Retention Adapter
 * Delegates to /services/retention.service and supports CLI execution.
 */
const { RULES, runRetention, redactClosedOrders, anonymiseAgedInvoices } = require('../services/retention.service');

function run({ dryRun = false } = {}) {
  return runRetention({ dryRun });
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  const report = run({ dryRun });
  /* eslint-disable no-console */
  console.log(`Retention job ${dryRun ? '(dry run — nothing changed)' : '(applied)'}\n`);
  report.forEach((r) => {
    console.log(`  ${String(r.affected === -1 ? '?' : r.affected).padStart(6)}  ${r.rule.padEnd(38)} ${r.description}`);
  });
  const total = report.reduce((s, r) => s + Math.max(0, r.affected), 0);
  console.log(`\n${total} record(s) ${dryRun ? 'would be affected' : 'affected'}.`);
}

module.exports = { run, RULES, redactClosedOrders, anonymiseAgedInvoices };
