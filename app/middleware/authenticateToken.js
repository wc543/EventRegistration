const jwt = require('jsonwebtoken');
const env = require('../../env.json'); // Adjust the path as needed

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, env.session_key, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; // Attach user info to req object
    next();
  });
};

module.exports = authenticateToken;
