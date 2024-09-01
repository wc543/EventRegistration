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

router.get('/getprivate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch private events where the user is either the creator or an invited member
    const result = await pool.query(`
        SELECT e.* FROM events e
        LEFT JOIN private_event_members pem ON e.id = pem.event_id
        WHERE e.is_private = true AND (e.admin_id = $1 OR pem.user_id = $1)`, [userId]);

    if (result.rows.length > 0) {
        res.json({ events: result.rows });
    } else {
      res.json({});
    }
} catch (err) {
    res.status(500).json({ error: err.message });
}
});

  router.get('/getpublic', authMiddleware, async (req, res) => {
    console.log("public inside");
    try {
        let result = await pool.query('SELECT * FROM events WHERE "is_private" = false');
        if (result.rows.length > 0) {
            res.json({ events: result.rows });
        } else {
            res.json({ });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    console.log("leaving public")
  });

  router.post('/inviteUser', authMiddleware, async (req, res) => {
    const { eventId, username } = req.body;
    const adminId = req.user.userId;

    try {
        // Check if the user making the request is the event creator
        const eventCheck = await pool.query('SELECT * FROM events WHERE id = $1 AND admin_id = $2', [eventId, adminId]);

        if (eventCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You do not have permission to invite users to this event' });
        }

        // Fetch the user ID based on the username
        const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

        if (userCheck.rows.length === 0) {
            console.log(`User not found for username: ${username}`);
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = userCheck.rows[0].id;
        console.log(`Retrieved userId: ${userId} for username: ${username}`);

        if (!userId) {
            console.log('Failed to retrieve user ID');
            return res.status(500).json({ error: 'Failed to retrieve user ID' });
        }

        // Check if the user is already invited to the event
        const existingInvite = await pool.query('SELECT * FROM private_event_members WHERE user_id = $1 AND event_id = $2', [userId, eventId]);

        if (existingInvite.rows.length > 0) {
            console.log(`User with userId: ${userId} is already invited to eventId: ${eventId}`);
            return res.status(400).json({ error: 'User is already invited to this event' });
        }

        // Add the user to the private_event_members table
        await pool.query('INSERT INTO private_event_members (user_id, event_id) VALUES ($1, $2)', [userId, eventId]);
        console.log(`User with userId: ${userId} invited to eventId: ${eventId}`);

        // Generate a unique URL hash for the invitation
        const urlHash = require('crypto').randomBytes(16).toString('hex');
        await pool.query('INSERT INTO pending_invitation (event_id, url_hash) VALUES ($1, $2)', [eventId, urlHash]);

        res.status(200).json({ message: 'User invited successfully', invitationLink: `/joinEvent/${urlHash}` });
    } catch (err) {
        console.error('Error inviting user:', err.message);
        res.status(500).json({ error: 'An error occurred while inviting the user' });
    }
});

  router.get('/join/:urlHash', authMiddleware, async (req, res) => {
    const { urlHash } = req.params;
    const userId = req.user.userId;
  
    try {
        const result = await pool.query('SELECT * FROM pending_invitation WHERE url_hash = $1', [urlHash]);
  
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid invitation link' });
        }
  
        const { event_id } = result.rows[0];
  
        // Add the user to the private_event_members table
        await pool.query('INSERT INTO private_event_members (user_id, event_id) VALUES ($1, $2)', [userId, event_id]);
  
        // Optionally, delete the invitation after it's been used
        await pool.query('DELETE FROM pending_invitation WHERE url_hash = $1', [urlHash]);
  
        res.redirect('/api/events/getpublic');
    } catch (err) {
        console.error('Error joining event:', err.message);
        res.status(500).json({ error: 'An error occurred while joining the event' });
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
  
// In eventRoutes.js
router.delete('/:eventId', authMiddleware, async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.userId;

  try {
      // Verify if the event exists and the user is the creator
      const event = await pool.query('SELECT * FROM events WHERE id = $1 AND admin_id = $2', [eventId, userId]);

      if (event.rows.length === 0) {
          return res.status(403).json({ error: 'You do not have permission to delete this event' });
      }

      await pool.query('DELETE FROM private_event_members WHERE event_id = $1', [eventId]);
      await pool.query('DELETE FROM comments WHERE event_id = $1', [eventId]);
      await pool.query('DELETE FROM pending_invitation WHERE event_id = $1', [eventId]);
      await pool.query('DELETE FROM notifications WHERE event_id = $1', [eventId]);

      // Proceed to delete the event
      await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
      res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
      console.error('Error deleting event:', err.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;