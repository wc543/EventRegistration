const jwt = require('jsonwebtoken');
const env = require('../../env.json'); // Adjust the path as needed

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    req.user = 0; // Set user to 0 if no token is provided
    return next(); // Proceed to the next middleware or route handler
  }

  jwt.verify(token, env.session_key, (err, user) => {
    if (err) {
      req.user = 0; // Set user to 0 if token is invalid
      return next(); // Proceed to the next middleware or route handler
    }

    req.user = user; // Attach user info to req object
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = authenticateToken;
