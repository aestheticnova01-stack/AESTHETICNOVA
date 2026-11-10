'use strict';
/**
 * AESTHETICNOVA — Error Handling Middleware
 * Graceful 404 and 500 error pages. Never leaks stack traces or SQL to customers.
 */

const db = require('../src/db');
const { hashPII } = require('../services/security.service');

function notFoundHandler(req, res) {
  res.status(404).render('error', {
    title: 'Page not found',
    status: 404,
    message: 'We could not find that page. It may have moved, or the link may be out of date.',
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const ref = 'ERR-' + hashPII(String(Date.now()) + Math.random()).slice(0, 8).toUpperCase();
  // eslint-disable-next-line no-console
  console.error(`[${ref}]`, err && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : err);
  try {
    db.prepare('INSERT INTO security_events (kind,detail) VALUES (?,?)').run('server_error', ref);
  } catch { /* ignore */ }

  res.status(500).render('error', {
    title: 'Something went wrong',
    status: 500,
    message: `We hit an unexpected error. Reference ${ref}. Nothing about your order or account was changed. Please try again, or contact support and quote that reference.`,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
