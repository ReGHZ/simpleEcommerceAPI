const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const {
  addToCart,
  checkout,
  getOrderHistory,
} = require('../controllers/Order.controllers');
const router = express.Router();

// All routes related to Orders
router.post('/cart', authMiddleware, addToCart);
router.post('/checkout', authMiddleware, checkout);
router.get('/history', authMiddleware, getOrderHistory);

// Export the router
module.exports = router;
