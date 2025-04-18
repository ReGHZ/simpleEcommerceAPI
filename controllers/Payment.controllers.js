const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const stripe = require('../config/stripe.conf');
const { default: mongoose } = require('mongoose');

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

    // Check if totalAmount is valid (e.g., not zero or undefined)
    if (!order.totalAmount || order.totalAmount <= 0) {
      // Return a 400 response if totalAmount is invalid
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'Invalid total amount in the order', // Error message
      });
    }

    // Convert totalAmount to cents (for USD) or use directly (for IDR)
    const currency = 'usd'; // Set the currency to 'usd' or 'idr'
    const amount =
      currency === 'usd'
        ? Math.round(order.totalAmount * 100) // Convert USD to cents
        : Math.round(order.totalAmount); // Use the amount directly for IDR

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Set the amount for the payment intent
      currency, // Set the currency for the payment intent
      metadata: {
        orderId: order._id.toString(), // Add the order ID to metadata
        userId: userId.toString(), // Add the user ID to metadata
      },
      /* eslint-disable camelcase */
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // prevent Stripe asking for return_url
      },
      /* eslint-enable camelcase */
    });

    order.stripePaymentId = paymentIntent.id; // Save the Stripe payment ID to the order
    await order.save(); // Save the updated order to the database

    return res.status(200).json({
      success: true, // Indicate success (should be true, this seems like a bug)
      message: 'Payment intent successfully created ', // Success message
      clientSecret: paymentIntent.client_secret, // Return the client secret for the payment intent
    });
  } catch (e) {
    console.error('Error during create payment intent:', e); // Log the error
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Error message
    });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']; // Get the Stripe signature from headers
  let event; // Initialize the event variable
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Request body
      sig, // Stripe signature
      process.env.STRIPE_WEBHOOK_SECRET // Webhook secret from environment variables
    );
  } catch (e) {
    console.error('Error during webhook signature verification:', e); // Log the error
    return res.status(400).json({
      success: false, // Indicate failure
      message: 'Invalid Stripe signature!', // Error message
    });
  }

  if (event.type === 'payment_intent.succeeded') {
    // Check if the event type is 'payment_intent.succeeded'
    const paymentIntent = event.data.object; // Extract the payment intent object from the event

    const session = await mongoose.startSession(); // Start a new MongoDB session

    try {
      session.startTransaction(); // Start a transaction

      const order = await Order.findOne({
        stripePaymentId: paymentIntent.id, // Match the Stripe payment ID
      }).session(session); // Use the session for the query

      if (!order) {
        // Check if the order is not found
        throw new Error(
          // Throw an error with a descriptive message
          `Order not found for paymentIntent ID: ${paymentIntent.id}`
        );
      }

      // Update stock for each product in the order
      for (const item of order.items) {
        // Iterate over the items in the order
        const product = await Product.findById(item.product).session(session); // Find the product by ID using the session

        if (!product) {
          // If the product is not found
          throw new Error(`Product with ID ${item.product} not found!`); // Throw an error
        }

        if (product.stock < item.quantity) {
          // Check if the stock is insufficient
          throw new Error(`Insufficient stock of ${product.name} products!`); // Throw an error
        }

        product.stock -= item.quantity; // Deduct the quantity from the product stock
        await product.save({ session }); // Save the updated product using the session
      }

      // Mark the order as complete
      order.paymentStatus = 'completed'; // Set the payment status to 'completed'
      await order.save({ session }); // Save the updated order using the session

      // Empty the user's cart
      await Cart.findOneAndUpdate(
        { user: order.user }, // Match the user's cart
        { items: [], totalPrice: 0 }, // Set the cart items to an empty array and total price to 0
        { session } // Use the session for the update
      );

      await session.commitTransaction(); // Commit the transaction
      session.endSession(); // End the session

      return res.status(200).json({
        received: true, // Indicate the event was received
        success: true, // Indicate success
        message: `Order ${order._id} paid and stock updated`, // Success message
      });
    } catch (e) {
      await session.abortTransaction(); // Abort the transaction in case of an error
      session.endSession(); // End the session
      console.error('Error during update order + stock:', e); // Log the error
      return res.status(500).json({
        success: false, // Indicate failure
        message: 'Something went wrong!', // Error message
      });
    }
  }

  // If there is another event, the response remains 200
  res.json({ received: true }); // Respond with a generic success message
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
};
