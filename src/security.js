'use strict';
/**
 * AESTHETICNOVA — Security Adapter
 * Delegates to /services/security.service and /middleware/security.middleware for backwards compatibility.
 */
const securityService = require('../services/security.service');
const securityMiddleware = require('../middleware/security.middleware');

function sanitizeText(input, max = 2000) {
  if (input === undefined || input === null) return '';
  return String(input).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

module.exports = {
  ...securityService,
  ...securityMiddleware,
  sanitizeText,
  escapeHtml,
};
