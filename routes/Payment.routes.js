const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const { createPaymentIntent } = require('../controllers/Payment.controllers');
const router = express.Router();

// All routes related to Payments
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);

// Export the router
module.exports = router;
