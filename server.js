// dependencies
require('dotenv').config();
const express = require('express');
const exhandle = require('express-handlebars');
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
var { queryPromise } = require('./db-functions')  // Import the database connector
var { foreignKeyTable,
    capFirst,
    toPretty } = require('./utility-functions')  // Import the database connector

// collect environmentally stored variables
var port = process.env.PORT;

// initialize express app
const app = express();

// middlewear for parsing json form data
app.use(express.json());

// serve static files (global css, js, etc.)
app.use(express.static('public'));

// setup handlebars
app.engine('handlebars', exhandle.engine({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// context class for providing page routing
class contextBlock {
    pageTitle;
    entityName;
    pageDescription;
    entities = foreignKeyTable.values();
    pageContext = {
        tableEntries: []
    }

    constructor(entity) {
        if (entity) {
            this.pageTitle = capFirst(entity);
            this.entityName = entity;
            this.pageDescription = `Enter a ${this.pageTitle} by completing the below form, or edit an existing ${this.pageTitle} by clicking on the ${this.pageTitle}'s name.`;
        }else {
            this.pageDescription = 'Welcome to the Chill Drive Pokedex! Here you can find information on Pokemon, moves, types, and abilities.';
        }
    }

    rawify() {
        this.raw = JSON.stringify(this,undefined,4);

        return this;
    }
}


/*
GET ROUTES
*/

// HOME PAGE ROUTING
app.get('/:homePath(home|Home|index|index.html)?', (req, res) => {res.status(200).render('home', new contextBlock())});


// ENTITY PAGE ROUTING
app.get('/entity/:ent', (req, res, next) => {
    // get url variable
    let entity = req.params.ent.toLowerCase();

    // skip to 404 if invalid page
    if (!foreignKeyTable.values().includes(capFirst(entity))) return next();

    let responseContext = new contextBlock(entity);

    // get table entries from database
    queryPromise('SELECT * FROM ?', [entity])
    .catch(next)
    .then((rows) => {
        // iterate through rows returned
        rows.forEach((row) => {
            let entry = {};

            // add attributes to entry
            row.keys().forEach((key) => {
                let value;

                // if foreign key attribute
                if (foreignKeyTable.keys().includes(row[key])) {
                    // go get foreign key name value from referenced table
                    queryPromise('SELECT name FROM ? WHERE id=?', [foreignKeyTable[key], row[key]])
                    .then((fkNames) => {
                        value = fkNames[0]; 
                    });
                }else {
                    value = row[key];
                }

                // add attributes and values to entry
                entry[toPretty(key)] = value;
            });

            // add entry to table array
            responseContext.tableEntries.push(entry);
        });

        // send page with data to frontend client
        res.status(200).render('entity', responseContext.rawify());
    })
});


/*
POST REPLIES
*/



// 404 ERROR PAGE ROUTING
app.use((req, res) => {res.status(404).render('404', new contextBlock(req,'Page Not Found'))});


// START SERVER
app.listen(port, function(){
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});
