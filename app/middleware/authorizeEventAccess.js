const { getEventById, getUserById } = require('../../env.json'); // Replace with your actual database functions

async function authorizeEventAccess(req, res, next) {
    try {
        const eventId = req.params.id;
        const userId = req.user.id; // Assuming user information is attached to req.user

        // Fetch the event details
        const event = await getEventById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.isPublic) {
            // If the event is public, grant access
            return next();
        }

        // Fetch the user details
        const user = await getUserById(userId);

        if (!user) {
            return res.status(403).json({ message: 'User not found' });
        }

        if (event.adminId === userId) {
            // If the event is private but the user is the admin, grant access
            return next();
        }

        // If the event is private and the user is not the admin, deny access
        return res.status(403).json({ message: 'Access denied' });
    } catch (error) {
        console.error('Error in authorizeEventAccess middleware:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = authorizeEventAccess;
