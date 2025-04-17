const express = require('express');

const router = express.Router();

// All routes related to Auth
router.post('/register');
router.post('/login');

// Export the router
module.exports = router;
