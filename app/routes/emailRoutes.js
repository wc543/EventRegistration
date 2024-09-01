const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authenticateToken');
const pool = require('../db');
const cron = require('node-cron');
const env = require("../../env.json");
const sendEventReminder = require('../helpers/email');

// Use for testing
router.post("/sendemail", authMiddleware, async (req, res) => {
    const user_email = req.user.email;

    try {
        await sendEventReminder(user_email);
        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error('Error sending Email:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Use https://crontab.guru/examples.html to see different 'x x x x x' for when it runs
// Example: '* * * * *' runs every minute - Use for testing
// Change to something like '0 0 * * *' so it doesn't spam
cron.schedule('* * * * *', async () => {
    try {
        const result = await pool.query('SELECT email FROM users');
        const users = result.rows

        for(const user of users) {
            await sendEventReminder(user.email);
        }
    } catch (error) {
        console.error('Error running cron job:', error);
    }
});

module.exports = router;