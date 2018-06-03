var { Pool, Client } = require('pg');
var pool = new Pool({
  user: 'bechdelmaster',
  host: 'bechdel-fronts.cii9twl865uw.eu-west-1.rds.amazonaws.com',
  database: 'fronts',
  password: process.env.PGPASSWORD,
  port: 5432,
})


function x() {
    pool.query('SELECT count(*) as abc from links', (err, res) => {
    console.log(err, res);
    pool.end()
})

}

exports.handler = function (event, context, callback) {
    x();
}
