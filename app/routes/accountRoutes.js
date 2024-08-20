const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust the path if necessary
const authMiddleware = require('../middleware/authenticateToken');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const env = require("../../env.json"); // Ensure the path to env.json is correct

router.post('/register', async (req, res) => {
    console.log("in register");
    const { email, username, password, address, emailOptIn } = req.body;
    try {
        console.log("pre");
  
        // Check if the email or username already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );
  
        console.log("signup");
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email or username already exists' });
        }
  
        console.log("about to hash");
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
  
        // Generate a session token
        console.log("creating session token");
        const sessionToken = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });
  
        // Insert the new user into the database
        console.log("Inserting new user to db");
        const result = await pool.query(
            'INSERT INTO users (email, username, hashed_password, address, session_token, email_opt_in) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [email, username, hashedPassword, address, sessionToken, emailOptIn]
        );
  
        // Retrieve the new user's ID
        console.log("Retrieving user ID");
        const userId = result.rows[0].id;
  
        // Optionally set the session token as a cookie
        console.log("set session token as cookie");
        res.cookie('token', sessionToken, {
            httpOnly: true,
            secure: false // Set to true if you're using HTTPS
        });
  
        res.status(201).json({ message: 'User registered successfully', userId, sessionToken });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
  });


  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.hashed_password);
            if (match) {
                const token = jwt.sign({ userId: user.id }, env.session_key, { expiresIn: '1h' });
                // Set both the token and email in cookies
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: false // Change to true if using HTTPS
                });
                res.cookie('user_email', email, {
                  httpOnly: false, // Make sure it's not httpOnly if you want to access it from JavaScript
                  secure: false, // Set to true if using HTTPS
                  path: '/' // Ensure it's available throughout the site
              });
  
                await pool.query('UPDATE users SET session_token = $1 WHERE id = $2', [token, user.id]);
                res.redirect('/home.html');
            } else {
                res.status(401).json({ error: 'Invalid password' });
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });

  router.post('/logout', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    try {
      // Clear the session token for the logged-out user
      await pool.query('UPDATE users SET session_token = $1 WHERE id = $2', ['', userId]);
  
      // Clear cookies
      res.clearCookie('token');
      res.clearCookie('user_email');
      
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error('Error logging out:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/status', authMiddleware, (req, res) => {
    // If the user is authenticated, the authMiddleware will attach user info to req.user
    if (req.user) {
        res.json({ loggedIn: true, user: req.user });
    } else {
        res.json({ loggedIn: false });
    }
  });

module.exports = router;