'use strict';
/**
 * AESTHETICNOVA — Security Middleware
 * HTTP security headers (CSP, HSTS, X-Frame-Options, etc.), HTTPS redirection, and rate limiting.
 */

const config = require('../config');
const { rateLimit, hashPII } = require('../services/security.service');

function securityHeaders(isHttps) {
  return (req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'",
      ].join('; '),
      'X-Permitted-Cross-Domain-Policies': 'none',
    });
    if (config.HSTS && isHttps) {
      res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  };
}

function httpsRedirect(req, res, next) {
  if (config.FORCE_HTTPS && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(308, `https://${req.get('host')}${req.originalUrl}`);
  }
  next();
}

function clientIp(req, res, next) {
  req.clientIp = (req.get('x-forwarded-for') || '').split(',')[0].trim()
    || (req.socket && req.socket.remoteAddress) || '';
  next();
}

function rateLimitMiddleware({ name, max, windowMs, by = 'ip' }) {
  return (req, res, next) => {
    const identity = by === 'email' && req.body && req.body.email
      ? `email:${hashPII(String(req.body.email).toLowerCase())}`
      : `ip:${hashPII(req.clientIp)}`;
    const r = rateLimit({ key: `${name}:${identity}`, max, windowMs });
    if (!r.allowed) {
      res.set('Retry-After', String(r.retryAfter));
      req.rateLimited = { name, retryAfter: r.retryAfter };
      if (req.accepts(['html', 'json']) === 'json') {
        return res.status(429).json({ ok: false, error: 'Too many attempts. Please wait and try again.', retry_after: r.retryAfter });
      }
      return res.status(429).render('error', {
        title: 'Too many attempts',
        status: 429,
        message: `For your security we have paused this action. Please try again in about ${Math.ceil(r.retryAfter / 60)} minute(s).`,
      });
    }
    next();
  };
}

module.exports = {
  securityHeaders,
  httpsRedirect,
  clientIp,
  rateLimitMiddleware,
};
