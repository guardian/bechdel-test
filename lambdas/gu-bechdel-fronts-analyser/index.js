const { Pool, Client } = require('pg');
const uuidv1 = require('uuid/v1');
const format = require('pg-format');


function x() {
    const pool = new Pool({
      user: 'bechdelmaster',
      host: 'bechdel-fronts.cii9twl865uw.eu-west-1.rds.amazonaws.com',
      database: 'fronts',
      password: process.env.PGPASSWORD,
      port: 5432,
    })

    var values = [
      [uuidv1()], [uuidv1()],
    ];
    var queryText = format('INSERT INTO links (id) VALUES %L', values);
    console.log(queryText);
    pool.query(queryText, (err, res) => {
      console.log(err, res);
      pool.end();
    });
}

exports.handler = function (event, context, callback) {
    x();
}
