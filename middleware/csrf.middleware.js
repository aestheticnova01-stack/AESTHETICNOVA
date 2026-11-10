'use strict';
/**
 * AESTHETICNOVA — CSRF Middleware
 * Protects state-changing HTTP methods (POST, PUT, PATCH, DELETE) against Cross-Site Request Forgery.
 */

function validCsrf(req) {
  const sent = (req.body && (req.body._csrf || req.body.csrf))
    || req.get('x-csrf-token') || '';
  return req.session && sent && req.session.csrf === sent;
}

function csrfMiddleware(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (!validCsrf(req)) {
      if (req.accepts(['html', 'json']) === 'json') {
        return res.status(403).json({ ok: false, error: 'Session expired. Please refresh the page and try again.' });
      }
      return res.status(403).render('error', {
        title: 'Session expired',
        status: 403,
        message: 'For your security, forms expire if left idle. Please go back, refresh the page and try again.',
      });
    }
  }
  next();
}

module.exports = {
  validCsrf,
  csrfMiddleware,
};
