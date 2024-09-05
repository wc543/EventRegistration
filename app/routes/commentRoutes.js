const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authenticateToken');
const pool = require('../db');

router.post('/:eventId', authMiddleware, async (req, res) => {
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
  
  
  router.get('/:eventId', async (req, res) => {
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