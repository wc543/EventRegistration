const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust the path if necessary
const authMiddleware = require('../middleware/authenticateToken');

// Create a new event
router.post('/create', authMiddleware, async (req, res) => {
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
  
router.post('/:eventId/comments', authMiddleware, async (req, res) => {
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


router.get('/:eventId/comments', async (req, res) => {
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

  router.get('/getpublic', authMiddleware, async (req, res) => {
    try {
        let result;
        const userId = req.user.userId;
        if (req.user !== 0 && userId) {
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

  router.get('/:id', async (req, res) => {
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

module.exports = router;