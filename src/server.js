'use strict';
/**
 * AESTHETICNOVA — Server Adapter (Legacy Compatibility)
 * Delegates to the root /server.js entry point.
 */
module.exports = require('../server');

if (require.main === module) {
  const app = module.exports;
  const config = require('../config');
  app.listen(config.PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`AESTHETICNOVA listening on 0.0.0.0:${config.PORT} (env=${config.NODE_ENV}, payments=${config.PAYMENT_MODE}${config.paymentsLive ? '-live' : '-simulated'})`);
  });
}
