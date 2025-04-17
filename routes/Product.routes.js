const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const adminMiddleware = require('../middleware/Admin.middleware');
const upload = require('../helpers/Upload.helper');
const {
  getAllProducts,
  insertProduct,
} = require('../controllers/Product.controllers');

const router = express.Router();

// All routes related to Products
router.post(
  '/insert',
  authMiddleware,
  adminMiddleware,
  upload.array('images'),
  insertProduct
);
router.get('/all', getAllProducts);

// Export the router
module.exports = router;
