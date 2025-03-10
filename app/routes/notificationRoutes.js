const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust the path if necessary
const authMiddleware = require('../middleware/authenticateToken');

router.get('/getall', authMiddleware, async (req, res) => {
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


router.post('/createComment', authMiddleware, async (req, res) => {
    const {event_id, body, created_at } = req.body;
  
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
            'INSERT INTO notifications (type, user_id, event_id, body, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            ["event", admin_id, event_id, body, created_at]
        );
  
        const newNotification = result.rows[0];
        res.status(201).json(newNotification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.post('/createContact', authMiddleware, async (req, res) => {
    const {recipientId, body, created_at } = req.body;
  
    if (!body || !created_at) {
        return res.status(400).json({ message: 'Body and created_at are required' });
    }
  
    try {
        // Insert notification into the database
        const result = await pool.query(
            'INSERT INTO notifications (type, user_id, body, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
            ["new contact", recipientId, body, created_at]
        );
  
        const newNotification = result.rows[0];
        res.status(201).json(newNotification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.post('/createRegistration', authMiddleware, async (req, res) => {
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

        // Check if a notification for this event_id already exists
        const existingNotification = await pool.query(
            'SELECT * FROM notifications WHERE event_id = $1',
            [event_id]
        );

        if (existingNotification.rows.length === 0) {
            const result = await pool.query(
                'INSERT INTO notifications (type, user_id, event_id, body, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                ["registration", admin_id, event_id, body, created_at]
            );

            const newNotification = result.rows[0];
            return res.status(201).json(newNotification); // Ensure response is sent
        } else {
            return res.status(200).json({ message: 'Notification already exists' }); // Response when notification exists
        }
    } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


  
module.exports = router;


