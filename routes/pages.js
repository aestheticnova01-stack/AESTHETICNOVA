'use strict';
/**
 * AESTHETICNOVA — Pages Route Adapter (Legacy Compatibility)
 * Delegates to /routes/index.routes and /services/product.service.
 */

const indexRoutes = require('./index.routes');
const { productCards, reviewStats, getCategories } = require('../services/product.service');

module.exports = indexRoutes;
module.exports.productCards = productCards;
module.exports.reviewStats = reviewStats;
module.exports.getCategories = getCategories;
