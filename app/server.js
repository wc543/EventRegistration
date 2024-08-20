const pg = require("pg");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const session = require('express-session');

const port = 3000;
const hostname = "localhost";

const env = require("../env.json"); // Ensure the path to env.json is correct
const accountRoutes = require('./routes/accountRoutes.js');
const eventRoutes = require('./routes/eventRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(session({
  secret: env.session_key || 'fallbackSecret',  // Fallback in case env.session_key is undefined
  saveUninitialized: true,
  resave: true
}));
app.use('/events', eventRoutes);
app.use('/account', accountRoutes);
app.use('/notifications', notificationRoutes);


app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
