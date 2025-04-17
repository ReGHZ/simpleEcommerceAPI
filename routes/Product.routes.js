const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const adminMiddleware = require('../middleware/Admin.middleware');
const {
  insertProduct,
  getAllProducts,
} = require('../controllers/Order.controllers');
const upload = require('../helpers/Upload.helper');

const router = express.Router();

// All routes related to Products
router.get('/all', getAllProducts);
router.post(
  '/insert',
  authMiddleware,
  adminMiddleware,
  upload.array('images'),
  insertProduct
);

// Export the router
module.exports = router;
