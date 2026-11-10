'use strict';
/**
 * AESTHETICNOVA — Session Middleware
 * Cookie-based, SQLite-backed session management with CSRF binding and rotation.
 */

const db = require('../src/db');
const config = require('../config');
const { randomToken, hashPII } = require('../services/security.service');

const TTL_MS = config.SESSION_TTL_DAYS * 86400000;
const MAX_AGE_SECONDS = Math.floor(TTL_MS / 1000);

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const i = part.indexOf('=');
    if (i > 0) {
      const k = part.slice(0, i).trim();
      const v = part.slice(i + 1).trim();
      if (k) acc[k] = decodeURIComponent(v);
    }
    return acc;
  }, {});
}

function cookieOptions(req, maxAgeSeconds) {
  const isHttps = req.secure || req.protocol === 'https';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    ...(maxAgeSeconds ? { maxAge: maxAgeSeconds * 1000 } : {}),
  };
}

function createSession(req, res, userId = null) {
  const id = randomToken(32);
  const csrf = randomToken(24);
  const expires = new Date(Date.now() + TTL_MS).toISOString().slice(0, 19).replace('T', ' ');
  db.prepare(`INSERT INTO sessions (id,user_id,csrf,expires_at,ip_hash,ua_hash)
              VALUES (?,?,?,?,?,?)`)
    .run(id, userId, csrf, expires, hashPII(req.clientIp), hashPII(req.get('user-agent')));
  res.cookie(config.SESSION_COOKIE, id, cookieOptions(req, MAX_AGE_SECONDS));
  return id;
}

function sessionMiddleware(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || '');
  req.cookies = cookies;
  req.session = null;
  req.user = null;
  const sid = cookies[config.SESSION_COOKIE];
  if (sid) {
    const row = db.prepare(`SELECT s.*, u.id AS uid, u.email, u.full_name, u.marketing_consent,
              u.phone, u.deleted_at
            FROM sessions s LEFT JOIN users u ON u.id = s.user_id
            WHERE s.id = ? AND s.expires_at > datetime('now')`).get(sid);
    if (row && !row.deleted_at) {
      req.session = { id: row.id, csrf: row.csrf, userId: row.user_id };
      if (row.uid) {
        req.user = {
          id: row.uid,
          email: row.email,
          full_name: row.full_name,
          marketing_consent: row.marketing_consent,
          phone: row.phone,
        };
      }
      db.prepare("UPDATE sessions SET last_seen_at=datetime('now') WHERE id=?").run(sid);
    } else if (row && row.deleted_at) {
      db.prepare('DELETE FROM sessions WHERE id=?').run(sid);
      res.clearCookie(config.SESSION_COOKIE, cookieOptions(req));
    }
  }
  if (!req.session) {
    const id = createSession(req, res, null);
    req.session = { id, csrf: db.prepare('SELECT csrf FROM sessions WHERE id=?').get(id).csrf, userId: null };
  }
  res.locals.csrf = req.session.csrf;
  next();
}

function rotateSession(req, res, userId) {
  if (req.session) db.prepare('DELETE FROM sessions WHERE id=?').run(req.session.id);
  return createSession(req, res, userId);
}

function destroySession(req, res) {
  if (req.session) db.prepare('DELETE FROM sessions WHERE id=?').run(req.session.id);
  res.clearCookie(config.SESSION_COOKIE, cookieOptions(req));
}

module.exports = {
  parseCookies,
  cookieOptions,
  createSession,
  sessionMiddleware,
  rotateSession,
  destroySession,
};
