/*
CITATIONS

Initial mysql and dotenv code, from line 11 to line 23
Date: 8/3/2024
Initial code copied and then modified from my Activity 2 solution
URL: https://canvas.oregonstate.edu/courses/1967354/assignments/9690199
*/

// use ENV file to store sensitive data like database passwords
require('dotenv').config();

// Get an instance of mysql we can use in the app
var mysql = require('mysql')

// Create a 'connection pool' using the provided credentials
var dbpool = mysql.createPool({
    connectionLimit : 10,
    host            : process.env.DBHOST,
    user            : process.env.DBUSER,
    password        : process.env.DBPASS,
    database        : process.env.DBNAME
})

// custom wrapper function to make queries return promises, so .then() can easily be used with them
function queryPromise(queryStr,arr) {
    return new Promise((resolve,reject) => {
        dbpool.query(queryStr, arr, (err,rows) => {
            if (err) {
                return reject(err);
            }
            return resolve(rows);
        })
    })
}

// Export it for use in our application
module.exports = {
    dbpool,
    queryPromise
};