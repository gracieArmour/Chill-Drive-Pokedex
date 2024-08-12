// dependencies
require('dotenv').config();
const express = require('express');
const exhandle = require('express-handlebars');
const path = require('path');
var { queryPromise } = require('./db-functions')  // Import the database connector
var { entitiesList,
    codedError,
    errorHandler,
    capFirst,
    toPretty,
    prettyTable,
    validateFields,
    validateId } = require('./utility-functions');  // Import the database connector
const e = require('express');

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

    let entityName = capFirst(entity);
    console.log(req.query);
    let searchTerms = Object.keys(req.query).map((key) => ({field: key, value: req.query[key]}));
    let responseContext = new contextBlock(entity);

    validateFields(entityName, searchTerms, res)
    .then((valid) => {
        if (!valid) return next(new codedError('Invalid field',403));

        // Prepare search data if it exists
        let searchStr = searchTerms.length > 0 ? `WHERE ${searchTerms.map((term) => (`${term.field}=?`)).join(' AND ')}` : '';
        let argArr = [entityName];
        if (searchTerms.length > 0) {
            searchTerms.forEach((term) => {argArr.push(term.value)});
        }

        // Render page with table data
        queryPromise(`SELECT * FROM ?? ${searchStr} ORDER BY id ASC`, argArr)
        .catch((err) => errorHandler(err,res,500))
        .then((rows) => prettyTable(responseContext, rows, res))
        .then((resultingContext) => {
            // send page with data to frontend client
            res.status(200).render(path.join('entities',entity), resultingContext.rawify());
        });
    });
});


/*
POST REPLIES
*/

// Universal route for processing database queries
app.post('/database/:ent', (req,res,next) => {
    // print request for debugging
    console.log(`Database request received ${JSON.stringify(req.body)}`);
    
    let entity = req.params.ent.toLowerCase();

    // skip to 404 if invalid entity
    if (!entitiesList.includes(entity)) return next();
    
    
    let entityName = capFirst(entity);
    let command = req.body.command;
    let data = req.body.data;

    switch (command) {
        case 'INSERT':
            validateFields(entityName, data.insertTerms, res)
            .then((valid) => {
                if (!valid) return next(new codedError('Invalid field',403));

                let fieldsStr = data.insertTerms.map((term) => (term.field)).join(', ');
                let valuePlaceholders = []
                data.insertTerms.forEach((term) => {
                    valuePlaceholders.push('?')
                })

                queryPromise(`INSERT INTO ?? (${fieldsStr}) VALUES (${valuePlaceholders.join(', ')})`,[entityName,...data.insertTerms.map((term) => (term.value))])
                .catch((err) => errorHandler(err,res,500))
                .then((rows) => {
                    res.status(200).send('Insert successful');
                });
            });
            break;

        case 'UPDATE':
            validateFields(entityName, data.updateTerms, res)
            .then((valid) => {
                if (!valid) return next(new codedError('Invalid field',403));

                validateId(entityName, data.id, res)
                .then((valid) => {
                    if (!valid) next(new codedError('ID does not exist',403));
                    
                    let updateStr = data.updateTerms.map((term) => (`${term.field}=?`)).join(', ');
                    queryPromise(`UPDATE ?? SET ${updateStr} WHERE id=?`, [entityName,...data.updateTerms.map((term) => (term.value)),id])
                    .catch((err) => errorHandler(err,res,500))
                    .then((rows) => {
                        res.status(200).send('Insert successful');
                    });
                });
            });
            break;
            
        case 'DELETE':
            validateId(entityName, data.id, res)
            .then((valid) => {
                if (!valid) return next(new codedError('ID does not exist',403));

                queryPromise('DELETE FROM ?? WHERE id=?', [entityName,data.id])
                .catch((err) => errorHandler(err,res,500))
                .then((rows) => {
                    res.status(200).send('Insert successful');
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
