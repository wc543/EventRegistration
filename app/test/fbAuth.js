// test code for auth over fb
const express = require("express");
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const env = require("../env.json");

app.use(express.json());
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    pool.query('SELECT * FROM users WHERE id = $1', [id], (err, result) => {
        if (err) { return done(err); }
        done(null, result.rows[0]);
    });
});

// Facebook strategy configuration
passport.use(new FacebookStrategy({
    clientID: env.FACEBOOK_APP_ID,
    clientSecret: env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
},
    function (accessToken, refreshToken, profile, done) {
        const email = profile.emails[0].value;
        pool.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
            if (err) { return done(err); }
            if (result.rows.length > 0) {
                return done(null, result.rows[0]);
            } else {
                const newUser = {
                    facebook_id: profile.id,
                    first_name: profile.name.givenName,
                    last_name: profile.name.familyName,
                    email: email,
                    created_at: new Date()
                };
                pool.query('INSERT INTO users(facebook_id, first_name, last_name, email, created_at) VALUES($1, $2, $3, $4, $5) RETURNING *',
                    [newUser.facebook_id, newUser.first_name, newUser.last_name, newUser.email, newUser.created_at],
                    (err, result) => {
                        if (err) { return done(err); }
                        return done(null, result.rows[0]);
                    });
            }
        });
    }
));

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login', failureFlash: true }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });