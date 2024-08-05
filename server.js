// dependencies
require('dotenv').config();
const express = require('express');
const exhandle = require('express-handlebars');
const mysql = require('mysql');
var { dbpool, queryPromise } = require('./db-functions')  // Import the database connector
const fs = require('fs');
const path = require('path');
// const cfUtils = require('./public/crossFileUtils.js');

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

/*
Citation for string capitalizing helper function below
Date: 8/3/2024
Copied from stackoverflow post
URL: https://stackoverflow.com/a/1026087
*/
function capFirst(str) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// foreign key to table name dictionary
const foreignKeyTable = {
    pokemonId: 'Pokemon',
    abilityId: 'Abilities',
    typeId: 'Types',
    categoryId: 'Categories',
    rangeId: 'Ranges',
    moveId: 'Moves'
};

const prettyNameTable = {
    pokemonId: 'Pokemon',
    abilityId: 'Ability',
    typeId: 'Type',
    categoryId: 'Category',
    rangeId: 'Range',
    moveId: 'Move'
};

// get list of current entity pages
var entitiesList = fs.readdirSync(path.join(__dirname,'views','entities'));
entitiesList.forEach((name,index) => {
    let filename = name.replace(".handlebars","");

    entitiesList[index] = {
        file: filename,
        pretty: capFirst(filename)
    }
});

// context class for providing page routing
class contextBlock {
    pageTitle;
    entityName;
    pageDescription;
    entities = entitiesList;
    pageContext = {
        tableEntries: []
    }

    constructor(title,entity) {
        this.pageTitle = title;
        if (entity) {
            this.entityName = entity;
            this.layout = "entity";
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
    let entity = req.params.ent;

    // skip to 404 if invalid page
    if (!foreignKeyTable.values().includes(entity)) return next();

    let responseContext = new contextBlock(capFirst(ent),ent);

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
                entry[prettyNameTable[key]] = value;
            });

            // add entry to table array
            responseContext.tableEntries.push(entry);
        });
    })

    // send page with data to frontend client
    res.status(200).render('entity', responseContext.rawify());
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
