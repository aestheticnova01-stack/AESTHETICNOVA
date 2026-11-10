'use strict';
/**
 * AESTHETICNOVA — Security Service
 * Password hashing (scrypt), PII obfuscation, timing-safe equality, rate limiting, and tokens.
 */

const crypto = require('crypto');
const config = require('../config');

const SCRYPT_N = 16384, SCRYPT_r = 8, SCRYPT_p = 1, KEYLEN = 64;

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/**
 * One-way HMAC hashing for IP addresses and user agents so that abuse
 * can be rate-limited without storing raw customer IP addresses.
 */
const HASH_SALT = process.env.PRIVACY_HASH_SALT || 'an-dev-salt-rotate-in-production';
function hashPII(value) {
  if (!value) return null;
  return crypto.createHmac('sha256', HASH_SALT).update(String(value)).digest('hex').slice(0, 32);
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function passwordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p }).toString('hex');
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${salt}$${hash}`;
}

function passwordVerify(password, stored) {
  try {
    const [algo, N, r, p, salt, hash] = String(stored).split('$');
    if (algo !== 'scrypt') return false;
    const calc = crypto.scryptSync(password, salt, KEYLEN, { N: +N, r: +r, p: +p });
    const expected = Buffer.from(hash, 'hex');
    return calc.length === expected.length && crypto.timingSafeEqual(calc, expected);
  } catch {
    return false;
  }
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

/* ---------------------------- rate limiting ---------------------------- */
const buckets = new Map();

function rateLimit({ key, max, windowMs }) {
  const now = Date.now();
  const k = `${key}`;
  let b = buckets.get(k);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(k, b);
  }
  b.count += 1;
  return {
    allowed: b.count <= max,
    remaining: Math.max(0, max - b.count),
    retryAfter: Math.ceil((b.reset - now) / 1000),
  };
}

module.exports = {
  hashToken,
  hashPII,
  randomToken,
  passwordHash,
  passwordVerify,
  safeEqual,
  rateLimit,
};
