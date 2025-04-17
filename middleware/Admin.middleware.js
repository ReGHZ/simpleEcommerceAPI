const adminMiddleware = (req, res, next) => {
  // Check if the user's role is not 'admin'
  if (req.user.role !== 'admin') {
    // Return a 403 Forbidden response with a JSON error message
    return res.status(403).json({
      success: false, // Indicate the operation was not successful
      message: 'Access denied! Admin rights required', // Error message for the client
    });
  }
  // Proceed to the next middleware or route handler
  next();
};

module.exports = adminMiddleware;
