'use strict';
/**
 * AESTHETICNOVA — Admin Routes
 * Protected administrative console routes.
 */

const express = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Admin Authentication
router.get('/login', adminController.renderAdminLogin);
router.post('/login', adminController.processAdminLogin);
router.post('/logout', adminController.adminLogout);

// Admin Console (Protected by requireAdmin)
router.get('/', requireAdmin, adminController.renderDashboard);

// Orders
router.get('/orders', requireAdmin, adminController.renderOrders);
router.get('/orders/:ref', requireAdmin, adminController.renderOrderDetail);
router.post('/orders/:ref/status', requireAdmin, adminController.updateOrderStatus);

// Privacy & DSAR
router.get('/data-requests', requireAdmin, adminController.renderDataRequests);
router.get('/data-requests/:ref', requireAdmin, adminController.renderDataRequestDetail);
router.post('/data-requests/:ref/verify', requireAdmin, adminController.verifyDataRequest);
router.post('/data-requests/:ref/execute-deletion', requireAdmin, adminController.executeDataDeletion);
router.post('/data-requests/:ref/resolve', requireAdmin, adminController.resolveDataRequest);

// Support & Grievances
router.get('/tickets', requireAdmin, adminController.renderTickets);
router.get('/tickets/:ref', requireAdmin, adminController.renderTicketDetail);
router.post('/tickets/:ref/update', requireAdmin, adminController.updateTicket);

// Reviews Moderation
router.get('/reviews', requireAdmin, adminController.renderReviews);
router.post('/reviews/:id/:action', requireAdmin, adminController.moderateReview);

// Inventory
router.get('/inventory', requireAdmin, adminController.renderInventory);
router.post('/inventory/:id', requireAdmin, adminController.updateInventoryStock);

// Settings
router.get('/settings', requireAdmin, adminController.renderSettings);
router.post('/settings', requireAdmin, adminController.updateSettings);

// Logs & Compliance
router.get('/consent-log', requireAdmin, adminController.renderConsentLog);
router.get('/audit-log', requireAdmin, adminController.renderAuditLog);
router.post('/audit-log/dark-pattern', requireAdmin, adminController.logDarkPatternAudit);

// Retention
router.get('/retention', requireAdmin, adminController.renderRetention);
router.post('/retention/run', requireAdmin, adminController.runRetentionJob);

module.exports = router;
