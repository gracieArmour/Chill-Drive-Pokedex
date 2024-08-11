// dependencies
require('dotenv').config();
const express = require('express');
const exhandle = require('express-handlebars');
const path = require('path');
var { queryPromise } = require('./db-functions')  // Import the database connector
var { entitiesList,
    capFirst,
    toPretty,
    prettyTable,
    validateFields,
    validateId } = require('./utility-functions')  // Import the database connector

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
            this.pageDescription = `Enter a ${toPretty(this.pageTitle)} by completing the below form, or edit an existing ${toPretty(this.pageTitle)} by clicking on the ${toPretty(this.pageTitle)}'s name.`;
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

    // skip to 404 if invalid entity
    if (!entitiesList.includes(entity)) return next();

    let responseContext = new contextBlock(entity);

    // get table entries from database
    queryPromise('SELECT * FROM ??', [capFirst(entity)])
    .catch(next)
    .then((rows) => prettyTable(responseContext, rows))
    .then((resultingContext) => {
        // send page with data to frontend client
        res.status(200).render(path.join('entities',entity), resultingContext.rawify());
    });
});


/*
POST REPLIES
*/

// Universal route for processing database queries
app.post('/database', (req,res,next) => {
    // print request for debugging
    console.log(`Database request received ${JSON.stringify(req.body)}`);

    let entity = req.body.entity;

    // skip to 404 if invalid entity
    if (!entitiesList.includes(entity)) return next();
    
    let command = req.body.command;
    let data = req.body.data;
    let responseContext = new contextBlock();

    switch (command) {
        case 'SELECT':
            validateFields(entity, data, next)
            .then((valid) => {
                if (!valid) return res.send('Invalid field');

                let searchStr = data.searchTerms.map((term) => (`${term.field}=?`)).join(' AND ');
                queryPromise(`SELECT * FROM ?? WHERE ${searchStr}`, [entity,...data.searchTerms.map((term) => (term.value))])
                .catch(next)
                .then((rows) => prettyTable(responseContext, rows))
                .then((resultingContext) => {
                    // send page with data to frontend client
                    res.status(200).render(path.join('entities',entity), resultingContext.rawify());
                });
            });
            break;
            
        case 'INSERT':
            validateFields(entity, data, next)
            .then((valid) => {
                if (!valid) return res.send('Invalid field');

                let fieldsStr = data.insertTerms.map((term) => (term.field)).join(', ');
                let valuePlaceholders = []
                data.insertTerms.forEach((term) => {
                    valuePlaceholders.push('?')
                })

                queryPromise(`INSERT INTO ?? (${fieldsStr}) VALUES (${valuePlaceholders.join(', ')})`,[entity,...data.insertTerms.map((term) => (term.value))])
                .catch(next)
                .then((rows) => queryPromise('SELECT * FROM ??', [entity]))
                .catch(next)
                .then((rows) => prettyTable(responseContext, rows))
                .then((resultingContext) => {
                    // send page with data to frontend client
                    res.status(200).render(path.join('entities',entity), resultingContext.rawify());
                });
            });
            break;

        case 'UPDATE':
            validateFields(entity, data, next)
            .then((valid) => {
                if (!valid) return res.send('Invalid field');

                validateId(entity, data.id, next)
                .then((valid) => {
                    if (!valid) return res.send('ID does not exist');
                    
                    let updateStr = data.updateTerms.map((term) => (`${term.field}=?`)).join(', ');
                    queryPromise(`UPDATE ?? SET ${updateStr} WHERE id=?`, [entity,...data.updateTerms.map((term) => (term.value)),id])
                    .catch(next)
                    .then((rows) => queryPromise('SELECT * FROM ??', [entity]))
                    .catch(next)
                    .then((rows) => prettyTable(responseContext, rows))
                    .then((resultingContext) => {
                        // send page with data to frontend client
                        res.status(200).render(path.join('entities',entity), resultingContext.rawify());
                    });
                });
            });
            break;
            
        case 'DELETE':
            validateId(entity, data.id, next)
            .then((valid) => {
                if (!valid) return res.send('ID does not exist');

                queryPromise('DELETE FROM ?? WHERE id=?', [entity,data.id])
                .then((rows) => prettyTable(responseContext, rows))
                .then((resultingContext) => {
                    // send page with data to frontend client
                    res.status(200).render(path.join('entities',entity), resultingContext.rawify());
                });
            })
            break;
    }
});


// 404 ERROR PAGE ROUTING
app.use((req, res) => {res.status(404).render('404', new contextBlock())});


// START SERVER
app.listen(port, function(){
    console.log('Express started on http://localhost:' + port + '; press Ctrl-C to terminate.')
});
