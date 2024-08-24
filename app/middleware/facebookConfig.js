const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('../db');
const env = require("../../env.json");

// Environment variables for Facebook credentials
const FACEBOOK_APP_ID = env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = env.FACEBOOK_APP_SECRET;
const CALLBACK_URL = env.CALLBACK_URL || 'https://events.cpxducky.com/api/account/auth/facebook/callback';

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: CALLBACK_URL,
    profileFields: ['id', 'emails', 'name'] // Fields you want to get from Facebook
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const { id, emails, name } = profile;

            const email = emails && emails.length > 0 ? emails[0].value : null;
            const firstName = name?.givenName || '';
            const lastName = name?.familyName || '';

            // Generate a username (this could be more sophisticated)
            let username = `${firstName}.${lastName}`.toLowerCase();
            if (!firstName || !lastName) {
                username = `user_${id}`;
            }

            console.log("about to hash");
            const hashedPassword = await bcrypt.hash('social_login', 10);

            // Generate a session token
            console.log("creating session token");
            const sessionToken = jwt.sign({ email }, env.session_key, { expiresIn: '1h' });

            // Check if the user already exists in the database
            let user = await db.query('SELECT * FROM users WHERE facebook_id = $1 OR email = $2', [id, email]);

            if (!user.rows.length) {
                // If user doesn't exist, create a new one
                user = await db.query(
                    `INSERT INTO users (facebook_id, email, first_name, last_name, username) 
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    [id, email, firstName, lastName, username]
                );
            } else {
                user = user.rows[0];
            }

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, user.rows[0]);
    } catch (error) {
        done(error, false);
    }
});

module.exports = passport;
