const Order = require('../models/Order');
const stripe = require('../config/stripe.conf');

const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the request object
    const { orderId } = req.body; // Extract the orderId from the request body

    const order = await Order.findOne({
      _id: orderId, // Match the order ID
      user: userId, // Match the user ID
    });

    if (!order) {
      // If no order is found, return a 404 response
      return res.status(404).json({
        success: false, // Indicate failure
        message: 'Order not found', // Error message
      });
    }

    if (order.paymentStatus !== 'pending') {
      // If the payment status is not pending, return a 400 response
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'This order has been paid or failed ', // Error message
      });
    }

    const paymentIntent = await stripe.paymentIntent.create({
      ammout: Math.round(order.totalAmount * 100), // Convert total amount to cents
      currency: 'usd', // Set the currency to USD
      metadata: {
        orderId: order._id.toString(), // Add the order ID to metadata
        userId: userId.toString(), // Add the user ID to metadata
      },
    });

    order.stripePaymentId = paymentIntent.id; // Save the Stripe payment ID to the order
    await order.save(); // Save the updated order to the database

    return res.status(200).json({
      success: false, // Indicate success (should be true, this seems like a bug)
      message: 'Payment intent successfully created ', // Success message
    });
  } catch (e) {
    console.error('Error during create payment intent:', e); // Log the error
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Error message
    });
  }
};

module.exports = {
  createPaymentIntent,
};
