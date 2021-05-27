const { Pool } = require('pg');

const pool = new Pool({
  user: "mitchelsarauer",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

pool.connect(()=>{
  console.log('You are connected to the database.');
})

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  },
};