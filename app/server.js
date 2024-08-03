const pg = require("pg");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const session = require('express-session');

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
});
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.use(session({
  secret: env.session_key,
  saveUninitialized: true,
  resave: true
}));

app.use('/login', function(req, res){
  res.cookie('user', user, {
    httpOnly: true,
    secure: false
  });

  res.redirect('/home.html');
});

app.get('/publicevents', async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM events WHERE "isPrivate" = false');
    if (result.rows.length > 0) {
      res.json({ username: result.rows });
    } else {
      res.status(404).json({ error: 'No public events were found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});