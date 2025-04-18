require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectToDB = require('./database/MongoDB');
const {
  authRoutes,
  productRoutes,
  orderRoutes,
  paymentRoutes,
} = require('./config/routes.conf');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to DB
connectToDB();

// Raw parser
app.use(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }) // raw body just for webhook
);

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('🚀 API is running...');
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global Error Handler
app.use((e, req, res, next) => {
  console.error('🔥 Error:', e.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});
