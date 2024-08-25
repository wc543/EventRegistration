const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('../db');
const env = require("../../env.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
            console.log("profile:\n", profile);
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
                    `INSERT INTO users (facebook_id, first_name, last_name, email, username, hashed_password, address, session_token, email_opt_in) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                    [id, firstName, lastName, email, username, hashedPassword, '', sessionToken, false]
                );
                user = user.rows[0];
                console.log("User created successfully:\n", user);
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
  if (user && user.id) {
    done(null, user.id);
  } else {
    done(new Error('User ID is missing for serialization'));
  }
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (user.rows.length > 0) {
      done(null, user.rows[0]);
    } else {
      done(new Error('User not found during deserialization'));
    }
  } catch (error) {
    done(error, false);
  }
});

module.exports = passport;
