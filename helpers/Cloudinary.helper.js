const cloudinary = require('../config/cloudinary.conf');

const uploadProductPicture = async (filePath) => {
  try {
    // Attempt to upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'products', // Specify the folder where the file will be stored
    });

    // Return the secure URL and public ID of the uploaded file
    return {
      url: result.secure_url, // The URL to access the uploaded file
      publicId: result.public_id, // The unique identifier for the uploaded file
    };
  } catch (e) {
    // Log the error if the upload fails
    console.error('Error while uploading to cloudinary', e);
    // Throw a new error to indicate the upload failure
    throw new Error('Error while uploading to cloudinary');
  }
};

module.exports = { uploadProductPicture };
