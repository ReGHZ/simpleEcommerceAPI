const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with the necessary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Cloudinary cloud name from environment variables
  api_key: process.env.CLOUDINARY_API_KEY, // Cloudinary API key from environment variables
  api_secret: process.env.CLOUDINARY_API_SECRET, // Cloudinary API secret from environment variables
});

module.exports = cloudinary;
