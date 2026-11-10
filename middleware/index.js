'use strict';
/**
 * AESTHETICNOVA — Middleware Registry
 * Unifies all application middlewares.
 */

const { securityHeaders, httpsRedirect, clientIp, rateLimitMiddleware } = require('./security.middleware');
const { parseCookies, cookieOptions, createSession, sessionMiddleware, rotateSession, destroySession } = require('./session.middleware');
const { validCsrf, csrfMiddleware } = require('./csrf.middleware');
const { consentMiddleware } = require('./consent.middleware');
const { requireUser, requireAdmin } = require('./auth.middleware');
const { notFoundHandler, errorHandler } = require('./error.middleware');

module.exports = {
  securityHeaders,
  httpsRedirect,
  clientIp,
  rateLimitMiddleware,
  parseCookies,
  cookieOptions,
  createSession,
  sessionMiddleware,
  rotateSession,
  destroySession,
  validCsrf,
  csrfMiddleware,
  consentMiddleware,
  requireUser,
  requireAdmin,
  notFoundHandler,
  errorHandler,
};
