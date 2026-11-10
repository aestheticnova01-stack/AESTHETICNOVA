'use strict';
/**
 * AESTHETICNOVA — Cart Route Adapter (Legacy Compatibility)
 * Delegates to /routes/cart.routes and /services/cart.service.
 */

const cartRoutes = require('./cart.routes');
const { getCartLines, totalsFor, ensureCart } = require('../services/cart.service');

module.exports = cartRoutes;
module.exports.cartLines = getCartLines;
module.exports.totalsFor = totalsFor;
module.exports.ensureCart = ensureCart;
