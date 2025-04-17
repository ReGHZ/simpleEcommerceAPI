const express = require('express');
const {
  register,
  verifyEmail,
  login,
} = require('../controllers/Auth.controllers');

const router = express.Router();

// All routes related to Auth
router.post('/register', register);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);

// Export the router
module.exports = router;
