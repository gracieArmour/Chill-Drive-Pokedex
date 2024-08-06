// dependencies
require('dotenv').config();
const express = require('express');
const exhandle = require('express-handlebars');
const mysql = require('mysql');
const path = require('path');
var { queryPromise } = require('./db-functions')  // Import the database connector
var { entitiesList,
    foreignKeyTable,
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
    entities = entitiesList.map((entity) => ({file: entity, pretty: toPretty(entity)}));
    pageContext = {
        columns: [],
        tableEntries: []
    }

    constructor(entity) {
        console.log(this.entities);
        if (entity) {
            this.layout = 'entity';
            this.pageTitle = capFirst(entity);
            this.entityName = entity;
            this.pageDescription = `Enter a ${this.pageTitle} by completing the below form, or edit an existing ${this.pageTitle} by clicking on the ${this.pageTitle}'s name.`;
        }else {
            this.layout = 'main';
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
    if (!entitiesList.includes(entity)) return next();

    let responseContext = new contextBlock(entity);

    // get table entries from database
    queryPromise('SELECT * FROM ??', [capFirst(entity)])
    .catch(next)
    .then((rows) => {
        // iterate through rows returned
        rows.forEach((row) => {
            // make list of attributes
            responseContext.pageContext.columns = Object.keys(row);

            let entry = {};

            // add attributes to entry
            Object.keys(row).forEach((key) => {
                let value;

                // if foreign key attribute
                if (Object.keys(foreignKeyTable).includes(row[key])) {
                    // go get foreign key name value from referenced table
                    queryPromise('SELECT name FROM ? WHERE id=?', [foreignKeyTable[key], row[key]])
                    .then((fkNames) => {
                        value = fkNames[0]; 
                    });
                }else {
                    value = row[key];
                }

                // add attributes and values to entry
                entry[key] = value;
            });

            // add entry to table array
            responseContext.pageContext.tableEntries.push(entry);
        });

        // send page with data to frontend client
        res.status(200).render(path.join('entities',entity), responseContext.rawify());
    })
});


/*
POST REPLIES
*/

// unfinished post to handle database queries
app.post('/database', (req,res,next) => {
    let entity = req.body.entity;
    let command = req.body.command;
    let data = req.body.data;
    let id = req.body.id;

    switch (command) {
        case 'SELECT':
            queryPromise('SELECT * FROM ?? WHERE name=?', [entity,data.name]);
            break;
        case 'CREATE':
            break;
        case 'UPDATE':
            break;
        case 'DELETE':
            break;
    }
});


// 404 ERROR PAGE ROUTING
app.use((req, res) => {res.status(404).render('404', new contextBlock())});


// START SERVER
app.listen(port, function(){
    console.log('Express started on http://localhost:' + port + '; press Ctrl-C to terminate.')
});
