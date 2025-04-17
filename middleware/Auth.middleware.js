const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Please login to continue',
    });
  }

  // decode this token
  try {
    const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log(decodedTokenInfo);

    req.user = decodedTokenInfo;
    next();
  } catch (e) {
    console.error('Error during decode token:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = authMiddleware;
