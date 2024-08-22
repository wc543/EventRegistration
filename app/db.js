const { Pool } = require('pg');
const env = require('../env.json');

const pool = new Pool(env);

pool.connect()
    .then(() => console.log(`Connected to database ${env.database}`))
    .catch(err => console.error('Error connecting to the database:', err.message));

module.exports = pool;