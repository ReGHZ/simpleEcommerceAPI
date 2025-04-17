const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']; // get the authorization header from the request
  const token = authHeader && authHeader.split(' ')[1]; // extract the token from the header if it exists

  if (!token) {
    // check if the token is not provided
    return res.status(401).json({
      success: false, // indicate failure
      message: 'Access denied. No token provided. Please login to continue', // error message for missing token
    });
  }

  // decode this token
  try {
    const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET_KEY); // verify and decode the token using the secret key
    console.log(decodedTokenInfo); // log the decoded token information

    req.user = decodedTokenInfo; // attach the decoded token info to the request object
    next(); // proceed to the next middleware or route handler
  } catch (e) {
    // handle errors during token verification
    console.error('Error during decode token:', e); // log the error
    return res.status(500).json({
      success: false, // indicate failure
      message: 'Something went wrong!', // generic error message
    });
  }
};

module.exports = authMiddleware;
