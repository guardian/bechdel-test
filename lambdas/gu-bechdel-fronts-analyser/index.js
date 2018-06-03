var const { Pool, Client } = require('pg');
var dbUrl = 'tcp://user:psw@localhost:5432/test-db';
const pool = new Pool()


function x() {
    pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res)
    pool.end()
})

}

exports.handler = function (event, context, callback) {
    x();
}
