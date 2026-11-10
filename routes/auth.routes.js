'use strict';
/**
 * AESTHETICNOVA — Auth Routes
 * Customer account registration, sign in, sign out, dashboard, and profile management.
 */

const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireUser } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/account/register', authController.renderRegister);
router.post('/account/register', authController.processRegister);

router.get('/account/login', authController.renderLogin);
router.post('/account/login', authController.processLogin);
router.post('/account/logout', authController.logout);

router.get('/account', requireUser, authController.renderAccount);
router.get('/account/profile', requireUser, authController.renderProfile);
router.post('/account/profile', requireUser, authController.updateProfile);
router.get('/account/orders/:ref', requireUser, authController.renderCustomerOrder);

module.exports = router;
