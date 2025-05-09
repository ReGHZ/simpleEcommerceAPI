const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the request object

    const { productId, quantity: rawQuantity } = req.body; // Destructure productId and quantity from the request body
    let quantity = rawQuantity; // Assign rawQuantity to quantity

    if (!productId || quantity === undefined || quantity === null) {
      // Check if productId or quantity is missing
      return res
        .status(400) // Set HTTP status to 400 (Bad Request)
        .json({
          success: false, // Indicate failure
          message: 'ProductId and quantity must be filled', // Error message for missing fields
        }); // Return error if ProductId and quantity not filled
    }

    quantity = Number(quantity); // Convert quantity to a number
    if (isNaN(quantity) || quantity <= 0) {
      // Check if quantity is not a positive number
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'Quantity must be a positive number', // Error message for invalid quantity
      });
    }

    const product = await Product.findById(productId); // Find the product by its ID
    if (!product) {
      // Check if the product exists
      return res.status(404).json({
        success: false, // Indicate failure
        message: 'Product not found', // Error message if product does not exist
      });
    }

    // Check product stock
    if (product.stock < quantity) {
      // Check if the stock is insufficient
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'Insufficient stock for this product', // Error message for insufficient stock
      });
    }

    let cart = await Cart.findOne({ user: userId }); // Find the cart associated with the user
    if (!cart) {
      // Check if the cart does not exist
      cart = new Cart({
        user: userId, // Set the user ID for the cart
        items: [], // Initialize an empty array for items
        totalPrice: 0, // Initialize total price to 0
        createdAt: new Date(), // Set the creation date
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId // Check if the product already exists in the cart
    );

    if (existingItemIndex > -1) {
      // Check if the product already exists in the cart
      if (cart.items[existingItemIndex].quantity + quantity > product.stock) {
        // Check if the updated quantity exceeds the stock
        return res.status(400).json({
          success: false, // Indicate failure
          message: 'Insufficient stock for this product', // Error message for insufficient stock
        });
      }

      cart.items[existingItemIndex].quantity += quantity; // Update the quantity if the product exists
    } else {
      cart.items.push({ product: productId, quantity }); // Add a new item to the cart if it doesn't exist
    }

    let totalPrice = 0; // Initialize total price to 0
    for (const item of cart.items) {
      // Loop through each item in the cart
      const productInfo = await Product.findById(item.product); // Fetch product details for each item
      if (!productInfo) {
        // Check if the product no longer exists
        return res.status(400).json({
          success: false, // Indicate failure
          message: 'One of the products in your cart no longer exists', // Error message for missing product
        });
      }
      totalPrice += productInfo.price * item.quantity; // Calculate the total price
    }
    cart.totalPrice = totalPrice; // Update the cart's total price

    await cart.save(); // Save the updated cart to the database
    return res.status(200).json({
      success: true, // Indicate success
      message: 'Product successfully added to cart', // Success message
    });
  } catch (e) {
    console.error('Error during add to cart:', e); // Log the error
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Error message
    });
  }
};

const checkout = async (req, res) => {
  const session = await mongoose.startSession(); // Start a new session for transaction
  try {
    session.startTransaction(); // Start a transaction
    const userId = req.user._id; // Get the user ID from the request object

    const cart = await Cart.findOne({ user: userId }) // Find the cart associated with the user
      .populate('items.product') // Populate the product details in the cart items
      .session(session); // Use the session for the query

    if (!cart || cart.items.length === 0) {
      // Check if the cart is empty
      await session.abortTransaction(); // Abort the transaction
      session.endSession(); // End the session
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'Cart empty', // Error message for empty cart
      });
    }

    // Validate stock
    for (const item of cart.items) {
      if (!item.product) {
        // Check if the product in the cart item no longer exists
        await session.abortTransaction(); // Abort the transaction if the product is missing
        session.endSession(); // End the session
        return res.status(400).json({
          // Return a 400 Bad Request response
          success: false, // Indicate failure
          message: 'One of the products in your cart no longer exists', // Error message for missing product
        });
      }
      // Loop through each item in the cart
      if (item.quantity > item.product.stock) {
        // Check if the quantity exceeds the stock
        await session.abortTransaction(); // Abort the transaction
        session.endSession(); // End the session
        return res.status(400).json({
          success: false, // Indicate failure
          message: `insufficient stock for product ${item.product.name}`, // Error message for insufficient stock
        });
      }
    }

    // Validate deliveryAddress
    const deliveryAddress = req.body.deliveryAddress || {}; // Get the delivery address from the request body or use an empty object
    if (
      !deliveryAddress.street || // Check if the street field is missing
      !deliveryAddress.city || // Check if the city field is missing
      !deliveryAddress.state || // Check if the state field is missing
      !deliveryAddress.zipCode // Check if the zipCode field is missing
    ) {
      await session.abortTransaction(); // Abort the transaction if the delivery address is incomplete
      session.endSession(); // End the session
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'Delivery address is incomplete', // Error message for incomplete delivery address
      });
    }

    // Make order
    const orderItem = cart.items.map((item) => ({
      // Map cart items to order items
      product: item.product._id, // Product ID
      quantity: item.quantity, // Quantity of the product
      price: item.product.price, // Price of the product
    }));

    const totalAmount = orderItem.reduce(
      // Calculate the total amount
      (sum, item) => sum + item.quantity * item.price, // Sum up the price of each item
      0 // Initial value of the sum
    );

    const newOrder = new Order({
      // Create a new order
      user: userId, // Set the user ID for the order
      items: orderItem, // Set the order items
      totalAmount, // Set the total amount
      paymentStatus: 'pending', // Set the payment status to pending
      deliveryAddress: req.body.deliveryAddress || {}, // Set the delivery address from the request body
      stripePaymentId: null, // Set the Stripe payment ID to null
      createdAt: new Date(), // Set the creation date
    });

    await newOrder.save({ session }); // Save the new order using the session

    // Empty cart (optional)
    cart.items = []; // Clear the cart items
    cart.totalPrice = 0; // Reset the total price to 0
    await cart.save({ session }); // Save the updated cart using the session

    await session.commitTransaction(); // Commit the transaction

    return res.status(200).json({
      success: true, // Indicate success
      message: 'Order successfully created, proceed to payment', // Success message
      data: newOrder, // Include the newly created order in the response
    });
  } catch (e) {
    await session.abortTransaction(); // Abort the transaction in case of an error
    session.endSession(); // End the session
    console.error('Error during checkout:', e); // Log the error
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Error message
    });
  } finally {
    session.endSession(); // End session with finnaly
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the request object

    const orders = await Order.find({ user: userId }) // Find all orders associated with the user
      .populate('items.product', 'name price') // Populate product details (name and price) in the order items
      .sort({ createdAt: -1 }); // Sort the orders by creation date in descending order

    return res.status(200).json({
      success: true, // Indicate success
      message: 'Order successfully retrieved', // Success message
      data: orders, // Include the retrieved orders in the response
    });
  } catch (e) {
    console.error('Error during checkout:', e); // Log the error
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Error message
    });
  }
};

module.exports = {
  addToCart,
  checkout,
  getOrderHistory,
};
