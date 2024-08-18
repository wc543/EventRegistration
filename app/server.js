const pg = require("pg");
const express = require("express");
const path = require("path");
const app = express();
const cookieParser = require("cookie-parser");
const session = require('express-session');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const port = 3000;
const hostname = "localhost";

const env = require("../env.json"); // Ensure the path to env.json is correct
const Pool = pg.Pool;
const pool = new Pool(env);
const authMiddleware = require('./middleware/authenticateToken.js');
const authorizeEventAccess = require('./middleware/authorizeEventAccess.js');

pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
}).catch(err => {
  console.error('Error connecting to the database:', err.message);
});

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());


app.use(session({
  secret: env.session_key || 'fallbackSecret',  // Fallback in case env.session_key is undefined
  saveUninitialized: true,
  resave: true
}));

app.post('/createEvent', authMiddleware, async (req, res) => {
  console.log("waffles");
  console.log(req.user);
  const { eventName, eventDate, eventTime, eventDescription, isPrivate, ytLink, address, created_at } = req.body;
  console.log(eventName, eventDate, eventTime, eventDescription, isPrivate, ytLink, address, created_at);
  adminId = req.user.userId;
  console.log(adminId);
  
  try {
    // Check if the adminId exists in the users table
    const adminCheck = await pool.query('SELECT id FROM users WHERE id = $1', [adminId]);
    if (adminCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid adminId' });
    }

    const result = await pool.query(
      `INSERT INTO events("is_private", "yt_link", "admin_id", "event_name", "description", created_at, address, event_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [isPrivate, ytLink, adminId, eventName, eventDescription, created_at, address, eventDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error executing query:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.post('/events/:eventId/comments', authMiddleware, async (req, res) => {
  const { eventId } = req.params;
  const { body, created_at } = req.body;
  const poster_id = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO comments("body", "poster_id", "event_id", "created_at")
      VALUES ($1, $2, $3, $4) RETURNING id;`,
      [body, poster_id, eventId, created_at]
    );
    res.status(201).json({ commentId: result.rows[0].id });
  } catch (err) {
    console.error('Error executing query:', err.message, err.stack);
    res.status(500).json({ error: err.message });
}});

app.get('/events/:eventId/comments', async (req, res) => {
  const { eventId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM comments WHERE "event_id" = $1 ORDER BY created_at ASC;`,
      [eventId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query:', err.message, err.stack);
    res.status(500).json({ error: err.message });
}});

// User registration endpoint
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, email, hashed_password) VALUES ($1, $2, $3) RETURNING id', [username, email, hashedPassword]);
    res.status(201).json({ userId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User login endpoint
app.post('/login', async (req, res) => {
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


app.post('/signup', async (req, res) => {
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

app.get('/publicevents', authMiddleware, async (req, res) => {
  try {
      let result;
      const userId = req.user.userId;
      if (userId) {
          result = await pool.query('SELECT * FROM events WHERE "is_private" = false OR ("is_private" = true AND "admin_id" = $1)', [userId]);
      } else {
          result = await pool.query('SELECT * FROM events WHERE "is_private" = false');
      }

      if (result.rows.length > 0) {
          res.json({ events: result.rows });
      } else {
          res.status(404).json({ error: 'No events were found' });
      }
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Apply the authenticateToken middleware to all routes

// Route to get event details
app.get('/event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
      const result = await pool.query('SELECT * FROM events WHERE "id" = $1', [eventId]);
      const event = result.rows[0]; // Extract the first row from the result

      if (event) {
          res.json(event);
      } else {
          res.status(404).json({ message: 'Event not found' });
      }
  } catch (error) {
      console.error('Error fetching event details:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/auth/status', authMiddleware, (req, res) => {
  // If the user is authenticated, the authMiddleware will attach user info to req.user
  if (req.user) {
      res.json({ loggedIn: true, user: req.user });
  } else {
      res.json({ loggedIn: false });
  }
});

// Add this to your existing server code
app.post('/logout', authMiddleware, async (req, res) => {
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

app.get('/notifications', authMiddleware, async (req, res) => {
  try {
      // Get user ID from req.user set by authMiddleware
      const user_id = req.user.userId;
      console.log(user_id);

      if (!user_id) {
          return res.status(401).json({ message: 'Unauthorized' });
      }

      // Query the database for notifications associated with the user
      const result = await pool.query(
          'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
          [user_id]
      );

      // Respond with the notifications
      res.status(200).json(result.rows);
  } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/notification', authMiddleware, async (req, res) => {
  const { event_id, body, created_at } = req.body;

  if (!body || !created_at) {
      return res.status(400).json({ message: 'Body and created_at are required' });
  }

  try {
      // Fetch the event to get the author ID
      const eventResult = await pool.query(
          'SELECT admin_id FROM events WHERE id = $1',
          [event_id]
      );

      if (eventResult.rows.length === 0) {
          return res.status(404).json({ message: 'Event not found' });
      }

      const admin_id = eventResult.rows[0].admin_id;

      // Insert notification into the database
      const result = await pool.query(
          'INSERT INTO notifications (user_id, event_id, body, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
          [admin_id, event_id, body, created_at]
      );

      const newNotification = result.rows[0];
      res.status(201).json(newNotification);
  } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
