'use strict';
/**
 * AESTHETICNOVA — Support Route Adapter (Legacy Compatibility)
 * Delegates to /routes/support.routes and /controllers/support.controller.
 */

const supportRoutes = require('./support.routes');
const { KINDS } = require('../controllers/support.controller');

module.exports = supportRoutes;
module.exports.KINDS = KINDS;
