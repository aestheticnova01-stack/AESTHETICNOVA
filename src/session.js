'use strict';
/**
 * AESTHETICNOVA — Session Adapter
 * Delegates to /middleware/session.middleware and /middleware/csrf.middleware for backwards compatibility.
 */
const sessionMiddleware = require('../middleware/session.middleware');
const csrfMiddleware = require('../middleware/csrf.middleware');

module.exports = {
  ...sessionMiddleware,
  ...csrfMiddleware,
};
