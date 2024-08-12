const fs = require('fs');
const path = require('path');
var { queryPromise } = require('./db-functions')  // Import the database connector

// get list of current entity pages
const entitiesList = fs.readdirSync(path.join(__dirname,'views','entities')).map((name) => (name.replace(".handlebars","")));

// foreign key to table name dictionary
const foreignKeyTable = {
    pokemonId: 'Pokemon',
    abilityId: 'Abilities',
    typeId: 'Types',
    categoryId: 'Categories',
    rangeId: 'Ranges',
    moveId: 'Moves'
};

// custom error class, pulled from an old personal project
class codedError extends Error {
    constructor(message, code) {
        super(message);
        this.status = code;
        this.statusCode = code;
    }
}

function errorHandler(res,err,code) {
    res.status(code).send(err);
}

/*
Citation for string capitalizing helper function below
Date: 8/3/2024
Copied from stackoverflow post
URL: https://stackoverflow.com/a/1026087
*/
function capFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/*
Citation for the regex replace usage below
Date: 8/5/2024
Copied and then modified from stackoverflow post
URL: https://stackoverflow.com/a/54246501
*/
function toPretty(name) {
    let prettyName;

    // foreign key case using dictionary
    if (Object.keys(foreignKeyTable).includes(name)) {
        prettyName = name.replace('Id','');
    }else {
        // split camelCase attribute name into Title Case words
        prettyName = name.replace(/[A-Z]/g, letter => ` ${letter}`);
    }
    
    return capFirst(prettyName);
};

// Make SELECT results human-readable
async function prettyTable(responseContext, rows, res) {
    // iterate through rows returned
    for (let row of rows) {
        // make list of attributes
        responseContext.pageContext.columns = Object.keys(row).map((column) => (toPretty(column)));

        let entry = {}

        // add attributes to entry
        for (let key of Object.keys(row)) {
            let value;

            // if foreign key attribute
            if (Object.keys(foreignKeyTable).includes(key)) {
                // go get foreign key name value from referenced table
                await queryPromise('SELECT name FROM ?? WHERE id=?', [foreignKeyTable[key], row[key]])
                .catch((err) => errorHandler(res,err,500))
                .then((fkNames) => {
                    value = fkNames[0].name; 
                });
            }else {
                value = row[key];
            }

            entry[key] = value;
        }

        // add entry to table array
        responseContext.pageContext.tableEntries.push(entry);
    }

    return responseContext;
};

// Validate that all fields sent by client are real fields in the table
async function validateFields(entityName, dataTerms, res) {
    let valid = false;

    if (!dataTerms || !(dataTerms.length > 0)) return true;

    await queryPromise('SELECT * FROM ?? LIMIT 1', [entityName])
    .catch((err) => errorHandler(err,res,500))
    .then((rows) => {
        if (dataTerms.every((term) => (Object.keys(rows[0]).includes(term.field)))) valid = true;
    });

    return valid;
}

// Validate that id sent by client exists in the table
async function validateId(entityName, id, res) {
    let valid = false;

    await queryPromise('SELECT id FROM ??',[entityName])
    .catch((err) => errorHandler(err,res,500))
    .then((rows) => {
        if (rows.map((row) => (row.id)).includes(id)) valid = true;
    });

    return valid;
}

// Export functions/objects for external use
module.exports = {
    entitiesList,
    foreignKeyTable,
    capFirst,
    toPretty,
    prettyTable,
    errorHandler,
    codedError,
    validateFields,
    validateId
};