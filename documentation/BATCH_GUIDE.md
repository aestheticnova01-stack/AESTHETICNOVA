# AESTHETICNOVA — Windows Batch File Guide

## 1. Overview
All batch files are stored in the `/batch` directory and use Windows cmd syntax. They contain automatic path resolution (`cd /d "%~dp0.."`) so they execute accurately regardless of where they are invoked from or what Windows drive is active.

A convenience launcher `start-windows.bat` is also located in the project root directory.

---

## 2. Available Batch Scripts

### 2.1 `batch\start.bat` (or `start-windows.bat`)
**Purpose**: Starts the website in development mode.
**What it does**:
1. Resolves path to project root.
2. Checks whether Node.js is installed.
3. Sets local environment variables:
   - `PORT=3000`
   - `PAYMENT_MODE=demo`
   - `ADMIN_EMAIL=owner@aestheticnova.local`
   - `ADMIN_PASSWORD=LocalDemo-Only-Change-This-7391!`
   - `PRIVACY_HASH_SALT=local-demo-only-salt-change-before-production-7391`
4. Checks if `node_modules` exists; if not, automatically runs `npm install`.
5. Prints local URLs and login credentials.
6. Boots the application by running `node server.js`.

### 2.2 `batch\dev.bat`
**Purpose**: Runs the website with live auto-reload.
**What it does**:
1. Checks Node.js requirements.
2. Configures development environment variables.
3. Launches Node with watch mode: `node --watch server.js`.
4. Any change saved to JS, EJS, or CSS will immediately restart the server or reflect in the browser.

### 2.3 `batch\install.bat`
**Purpose**: Installs or refreshes project dependencies.
**What it does**:
1. Verifies `node` and `npm` presence.
2. Runs `npm install` inside the project root.
3. Reports clear error status if network or file access fails.

### 2.4 `batch\build.bat`
**Purpose**: Validates project integrity before commit or deployment.
**What it does**:
1. Runs `node scripts/build.js`.
2. Validates JavaScript syntax across all files.
3. Verifies SQLite database connection and schema.
4. Checks creative assets register against images in `/public`.
5. Runs full WCAG 2.2 AA colour contrast audit (48 checks).

### 2.5 `batch\backup.bat`
**Purpose**: Creates safe, timestamped snapshots of database and configuration.
**What it does**:
1. Runs `node scripts/backup.js`.
2. Checkpoints the SQLite WAL journal (`wal_checkpoint(TRUNCATE)`).
3. Safely copies `data/aestheticnova.db` to a timestamped folder inside `backups/`.
4. Backs up `.env` and all files in `config/`.
