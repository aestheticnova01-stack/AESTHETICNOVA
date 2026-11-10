'use strict';
/** Test harness: boots an isolated server on a throwaway database. */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..', '..');

async function startServer(port = 4319) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'an-test-'));
  const env = {
    ...process.env,
    PORT: String(port),
    DATA_DIR: tmpDir,
    DATABASE_FILE: path.join(tmpDir, 'test.db'),
    NODE_ENV: 'test',
    ADMIN_PASSWORD: 'test-admin-password-not-default',
    BIZ_LEGAL_ENTITY: 'Aestheticnova Retail Private Limited',
    BIZ_ADDRESS: 'Unit 402, Trade Centre, Andheri East, Mumbai 400069, Maharashtra, India',
    BIZ_SUPPORT_EMAIL: 'care@aestheticnova.example',
    BIZ_SUPPORT_PHONE: '+91 22 4000 0000',
    BIZ_GSTIN: '27AABCA1234F1Z5',
    BIZ_GRIEVANCE_OFFICER: 'Test Grievance Officer',
    BIZ_GRIEVANCE_EMAIL: 'grievance@aestheticnova.example',
    BIZ_COUNTRY_OF_ORIGIN: 'India',
    BIZ_SELLER_NAME: 'Aestheticnova Retail Private Limited',
    BIZ_SUPPORT_HOURS: 'Mon–Sat, 10:00–18:00 IST',
  };
  const proc = spawn(process.execPath, ['src/server.js'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  proc.stdout.on('data', (d) => { log += d.toString(); });
  proc.stderr.on('data', (d) => { log += d.toString(); });

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(base + '/');
      if (r.ok) break;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  return {
    base, proc, tmpDir,
    log: () => log,
    async stop() {
      proc.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 300));
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    },
  };
}

/* --------------------------- result helpers --------------------------- */
let results = [];
/** Each suite calls this first so results never bleed between suites. */
function resetResults() { results = []; return results; }
function record(requirement, name, status, detail) {
  results.push({ requirement, name, status, detail });
}
function pass(requirement, name, detail) { record(requirement, name, 'PASS', detail); }
function fail(requirement, name, detail) { record(requirement, name, 'FAIL', detail); }
function human(requirement, name, detail) { record(requirement, name, 'NEEDS HUMAN REVIEW', detail); }
function notConfigured(requirement, name, detail) { record(requirement, name, 'NOT CONFIGURED', detail); }

function printSummary() {
  const width = Math.max(...results.map((r) => (r.requirement + ' ' + r.name).length));
  results.forEach((r) => {
    // eslint-disable-next-line no-console
    console.log(`${(r.requirement + ' ' + r.name).padEnd(width)}  ${r.status.padEnd(20)} ${r.detail || ''}`);
  });
  return results;
}

module.exports = {
  startServer, record, pass, fail, human, notConfigured, resetResults, printSummary, ROOT,
  get results() { return results; },
};
