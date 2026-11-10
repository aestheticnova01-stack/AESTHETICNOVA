'use strict';
/**
 * Runs every suite, writes data/test-results.json (which the live
 * /launch-readiness report reads), and prints a summary.
 */
const fs = require('fs');
const path = require('path');
const config = require('../src/config');

/**
 * Guard: every server-side module must at least parse. A stray comment
 * terminator once made a route file unparseable while the old dev server, still
 * running, happily answered requests — so the suite "passed" against code that
 * could never boot. Fail loudly before running anything.
 */
function syntaxCheck() {
  const { execFileSync } = require('child_process');
  const glob = ['src', 'routes', 'config', 'controllers', 'services', 'middleware'].flatMap((dir) =>
    fs.readdirSync(path.join(__dirname, '..', dir))
      .filter((f) => f.endsWith('.js'))
      .map((f) => path.join(__dirname, '..', dir, f)));
  const broken = [];
  for (const file of glob) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe', env: process.env });
    } catch (e) {
      broken.push(`${path.relative(path.join(__dirname, '..'), file)}: ${String(e.stderr || e.message).split('\n').find((l) => l.includes('Error')) || 'parse error'}`);
    }
  }
  return { checked: glob.length, broken };
}

async function main() {
  const suites = {};

  const syntax = syntaxCheck();
  if (syntax.broken.length) {
    console.error('\nCannot run the suite — server modules do not parse:\n  ' + syntax.broken.join('\n  ') + '\n');
    process.exit(2);
  }
  console.log(`Syntax check: ${syntax.checked} modules parse.`);

  /* --- static contrast (no browser needed) --- */
  const contrast = require('./contrast');
  const cReport = contrast.report();
  suites.contrast = {
    total: cReport.results.length,
    pass: cReport.results.length - cReport.failures.length,
    fail: cReport.failures.length,
    rows: cReport.results.map((r) => ({
      requirement: 'R14', name: r.name, status: r.pass ? 'PASS' : 'FAIL',
      detail: `${r.ratio}:1 (needs ${r.required}:1)`,
    })),
  };

  /* --- accessibility (browser) --- */
  const a11y = require('./a11y');
  const a11yResults = await a11y.run();
  suites.a11y = {
    total: a11yResults.length,
    pass: a11yResults.filter((r) => r.status === 'PASS').length,
    fail: a11yResults.filter((r) => r.status === 'FAIL').length,
    rows: a11yResults,
  };

  /* --- end to end (browser + http + db) --- */
  const e2e = require('./e2e');
  const e2eResults = await e2e.run();
  suites.e2e = {
    total: e2eResults.length,
    pass: e2eResults.filter((r) => r.status === 'PASS').length,
    fail: e2eResults.filter((r) => r.status === 'FAIL').length,
    rows: e2eResults,
  };

  const all = [].concat(suites.contrast.rows, suites.a11y.rows, suites.e2e.rows);
  const out = {
    ranAt: new Date().toISOString(),
    node: process.version,
    suites: {
      contrast: { total: suites.contrast.total, pass: suites.contrast.pass, fail: suites.contrast.fail },
      a11y: { total: suites.a11y.total, pass: suites.a11y.pass, fail: suites.a11y.fail },
      e2e: { total: suites.e2e.total, pass: suites.e2e.pass, fail: suites.e2e.fail },
    },
    totals: {
      checks: all.length,
      pass: all.filter((r) => r.status === 'PASS').length,
      fail: all.filter((r) => r.status === 'FAIL').length,
    },
    results: all,
  };

  fs.mkdirSync(config.DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(config.DATA_DIR, 'test-results.json'), JSON.stringify(out, null, 2));

  /* eslint-disable no-console */
  console.log('\n=== AESTHETICNOVA verification suite ===\n');
  ['contrast', 'a11y', 'e2e'].forEach((k) => {
    const s = out.suites[k];
    console.log(`  ${k.padEnd(10)} ${String(s.pass).padStart(3)} pass  ${String(s.fail).padStart(2)} fail  (${s.total} checks)`);
  });
  console.log(`\n  TOTAL      ${out.totals.pass} pass, ${out.totals.fail} fail of ${out.totals.checks}\n`);
  const failures = all.filter((r) => r.status === 'FAIL');
  if (failures.length) {
    console.log('Failures:');
    failures.forEach((f) => console.log(`  [${f.requirement}] ${f.name} — ${f.detail}`));
  }
  console.log(`Results written to ${path.join(config.DATA_DIR, 'test-results.json')}`);
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Suite crashed:', e.message);
  process.exit(2);
});
