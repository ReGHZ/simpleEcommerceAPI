const Product = require('../models/Product');
const Media = require('../models/Media');
const { uploadProductPicture } = require('../helpers/Cloudinary.helper');
const fs = require('fs');
const mongoose = require('mongoose');

const insertProduct = async (req, res) => {
  const session = await mongoose.startSession(); // Start a new MongoDB session
  try {
    session.startTransaction(); // Begin a transaction

    if (!req.body.products) {
      // Check if the products data is present in the request body
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'Products data is required', // Error message for missing products data
      });
    }

    let products; // Declare a variable to hold the parsed products array
    try {
      products = JSON.parse(req.body.products); // Parse the products data from JSON string to an array
    } catch (e) {
      console.error('Error during parsing JSON array:', e); // Log the error if JSON parsing fails
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'Products must be a valid JSON array', // Error message for invalid JSON format
      });
    }

    // Check if products is an array
    if (!products || !Array.isArray(products)) {
      return res
        .status(400) // Set HTTP status to 400 (Bad Request)
        .json({ success: false, message: 'Products must be an array' }); // Return error if products is not an array
    }

    const files = req.files || []; // Get the uploaded files (optional)
    // Array to store inserted products
    const insertedProducts = [];

    // Loop through each product in the products array
    for (let i = 0; i < products.length; i++) {
      const product = products[i]; // Get the current product
      let mediaDoc = null; // Initialize media document as null

      const file = files[i]; // Get the corresponding file for the product
      if (file) {
        const uploadedImage = await uploadProductPicture(file.path); // Upload the image to Cloudinary
        mediaDoc = new Media({
          url: uploadedImage.url, // Set the uploaded image URL
          publicId: uploadedImage.publicId, // Set the Cloudinary public ID
          uploadedBy: req.user._id, // Set the user who uploaded the media
        });
        await mediaDoc.save({ session }); // Save the media document in the session

        fs.unlinkSync(file.path); // Delete the local file after upload
      }

      const newProduct = new Product({
        ...product, // Spread the product details
        images: mediaDoc ? mediaDoc._id : null, // Link the media document if available
        createdAt: new Date(), // Set the creation date
      });

      await newProduct.save({ session }); // Save the product in the session
      insertedProducts.push(newProduct); // Add the product to the inserted products array
    }

    await session.commitTransaction(); // Commit the transaction
    session.endSession(); // End the session

    return res.status(200).json({
      success: true, // Indicate success
      message: 'Products inserted successfully', // Success message
      data: insertedProducts, // Return the inserted products
    });
  } catch (e) {
    await session.abortTransaction(); // Abort the transaction in case of error
    session.endSession(); // End the session
    console.error('Error during insert products:', e); // Log the error
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Error message
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products from the database

    if (products.length === 0) {
      // Check if no products are found
      return res.status(200).json({
        success: true, // Indicate success
        message: 'No products found', // Message for no products
        data: [], // Return an empty array
      });
    }

    return res.status(200).json({
      success: true, // Indicate success
      message: 'All products retrieved successfully', // Success message
      data: products, // Return the retrieved products
    });
  } catch (e) {
    console.error('Error during get products:', e); // Log the error
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Error message
    });
  }
};

module.exports = { insertProduct, getAllProducts };
