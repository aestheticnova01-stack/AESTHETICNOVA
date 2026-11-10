'use strict';
/**
 * AESTHETICNOVA — Database Configuration
 * SQLite with WAL mode, foreign keys, and busy timeout.
 */

const path = require('path');
const fs = require('fs');

const env = process.env;
const DATA_DIR = env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = env.DATABASE_FILE || path.join(DATA_DIR, 'aestheticnova.db');

module.exports = {
  dataDir: DATA_DIR,
  dbFile: DB_FILE,
  pragmas: {
    journal_mode: 'WAL',
    foreign_keys: 'ON',
    busy_timeout: 5000,
  },
  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  },
};
