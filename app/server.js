const express = require("express");
const app = express();
const path = require('path');
const cookieParser = require("cookie-parser");
const session = require('express-session');

const port = 3000;
const hostname = "localhost";

const env = require("../env.json"); // Ensure the path to env.json is correct
const accountRoutes = require('./routes/accountRoutes.js');
const eventRoutes = require('./routes/eventRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const videoRoutes = require('./routes/videoRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');


app.use(express.json());
app.use(express.static(path.join(__dirname, 'style')));
app.use(express.static(path.join(__dirname, 'helpers')));
app.use(cookieParser());
app.use(session({
  secret: env.session_key || 'fallbackSecret',  // Fallback in case env.session_key is undefined
  saveUninitialized: true,
  resave: true
}));
app.use('/api/events', eventRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/video', videoRoutes);
app.use('/api', geocodeRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'home.html'));
});
app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'events.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'signup.html'));
});
app.get('/event/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'event.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
