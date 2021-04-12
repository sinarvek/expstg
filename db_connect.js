const dbConfig = require('./dbconfig');

const pg = require('pg')
const db = new pg.Pool(dbConfig);


module.exports = db;
