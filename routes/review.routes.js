'use strict';
/**
 * AESTHETICNOVA — Review Routes
 * Customer review submission.
 */

const express = require('express');
const reviewController = require('../controllers/review.controller');

const router = express.Router();

router.post('/reviews', reviewController.submitReview);

module.exports = router;
