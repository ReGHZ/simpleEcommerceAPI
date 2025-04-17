// Import all individual routes
const authRoutes = require('../routes/Auth.routes');
const orderRoutes = require('../routes/Order.routes');
const productRoutes = require('../routes/Product.routes');
const paymentRoutes = require('../routes/Payment.routes');

// Export all routes
module.exports = {
  authRoutes,
  orderRoutes,
  productRoutes,
  paymentRoutes,
};
