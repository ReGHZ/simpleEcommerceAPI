const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination folder for uploaded files
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    // Set the filename for the uploaded file
    cb(null, `${Date.now()}-${file.originalname}`); // Use timestamp and original name
  },
});

// Filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  // Get the file extension
  const ext = path.extname(file.originalname);
  // Check if the file extension is allowed
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
    return cb(new Error('Only images are allowed'), false); // Reject non-image files
  }
  cb(null, true); // Accept the file
};

// Configure multer with storage and file filter
const upload = multer({ storage, fileFilter });

module.exports = upload;
