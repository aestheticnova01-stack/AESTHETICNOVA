'use strict';
/**
 * AESTHETICNOVA — Database & Asset Backup Script
 * Creates a timestamped snapshot of the SQLite database and configurations.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const db = require('../src/db');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log(`Starting backup to: ${backupDir}`);

// 1. Checkpoint WAL and backup database
try {
  db.pragma('wal_checkpoint(TRUNCATE)');
  const dbDest = path.join(backupDir, 'aestheticnova.db');
  fs.copyFileSync(config.DB_FILE, dbDest);
  console.log('✓ Database backed up successfully.');
} catch (e) {
  console.error('✗ Database backup error:', e.message);
}

// 2. Backup .env if present
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  fs.copyFileSync(envFile, path.join(backupDir, '.env.backup'));
  console.log('✓ Environment file backed up.');
}

// 3. Backup config files
const configDest = path.join(backupDir, 'config');
if (!fs.existsSync(configDest)) fs.mkdirSync(configDest, { recursive: true });
const configSource = path.join(__dirname, '..', 'config');
fs.readdirSync(configSource).forEach(f => {
  fs.copyFileSync(path.join(configSource, f), path.join(configDest, f));
});
console.log('✓ Configuration directory backed up.');

console.log(`\nBackup complete. Files stored in:\n${backupDir}`);
