'use strict';
/**
 * AESTHETICNOVA — Authentication & Authorization Middleware
 * Protects customer accounts and admin console routes.
 */

const db = require('../src/db');
const config = require('../config');

function requireUser(req, res, next) {
  if (!req.user) {
    return res.redirect('/account/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.redirect('/admin/login?next=' + encodeURIComponent(req.originalUrl));
  }

  // Check whether the authenticated user has admin privileges
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
  if (!user || !user.is_admin) {
    return res.redirect('/admin/login?next=' + encodeURIComponent(req.originalUrl));
  }

  const role = db.prepare('SELECT role FROM sessions WHERE id = ?').get(req.session.id);
  if (!role || role.role !== 'admin') {
    db.prepare("UPDATE sessions SET role = 'admin' WHERE id = ?").run(req.session.id);
  }

  next();
}

module.exports = {
  requireUser,
  requireAdmin,
};
