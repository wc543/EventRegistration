const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust the path if necessary
const authMiddleware = require('../middleware/authenticateToken');
const env = require("../../env.json"); // Ensure the path to env.json is correct


router.post("/createContact/:contactId", authMiddleware, async (req, res) => {
    console.log("user: ", req.user);
    const userId = req.user.userId; // Get the user ID from the authenticated user
    const contactId = req.params.contactId; // Get the contact ID from the request parameters

    // Check if the sender is trying to add themselves
    if (userId === contactId) {
        return res.status(400).json({ message: "You cannot add yourself as a contact." });
    }

    try {
        // Check if the contact already exists
        const existingContact = await pool.query(
            `SELECT * FROM active_conversations WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)`,
            [userId, contactId]
        );

        if (existingContact.rows.length > 0) {
            return res.status(400).json({ message: "Contact already exists." });
        }

        // Insert the first entry into the active_conversations table
        await pool.query(
            `INSERT INTO active_conversations (sender_id, recipient_id)
            VALUES ($1, $2)`,
            [userId, contactId]
        );

        // Insert the second entry into the active_conversations table
        await pool.query(
            `INSERT INTO active_conversations (sender_id, recipient_id)
            VALUES ($1, $2)`,
            [contactId, userId]
        );

        res.status(200).json({ message: "Contact created successfully" });
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get("/getContacts", authMiddleware, async (req, res) => {
    const userId = req.user.userId; // Get the user ID from the authenticated user

    try {
        // Query to get all recipient IDs where the sender_id is the userId
        const result = await pool.query(
            `SELECT recipient_id FROM active_conversations WHERE sender_id = $1`,
            [userId]
        );
        // Send the result as a JSON response
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving contacts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get("/getdms/:contactId", authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const contactId = req.params.contactId;

    try {
        // SQL query to fetch messages between user and contact
        const query = `
            SELECT *
            FROM direct_message
            WHERE (poster_id = $1 AND recepient_id = $2)
               OR (poster_id = $2 AND recepient_id = $1)
            ORDER BY sent_at ASC;
        `;

        // Execute the query
        const result = await pool.query(query, [userId, contactId]);

        // Return the messages as JSON
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching direct messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;