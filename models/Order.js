const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
    },
  ],
  totalAmount: Number,
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'] },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  stripePaymentId: String,
  createdAt: Date,
});

module.exports = mongoose.model('Order', orderSchema);
