const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const {
  createPaymentIntent,
  handleWebhook,
} = require('../controllers/Payment.controllers');
const router = express.Router();

// All routes related to Payments
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Export the router
module.exports = router;
