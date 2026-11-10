'use strict';
/**
 * AESTHETICNOVA — Auth Route Adapter (Legacy Compatibility)
 * Delegates to /routes/auth.routes and /middleware/auth.middleware.
 */

const authRoutes = require('./auth.routes');
const { requireUser } = require('../middleware/auth.middleware');

module.exports = authRoutes;
module.exports.requireUser = requireUser;
