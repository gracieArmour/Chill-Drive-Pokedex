const fs = require('fs');
const path = require('path');

// get list of current entity pages
var entitiesList = fs.readdirSync(path.join(__dirname,'views','entities')).map((name) => (name.replace(".handlebars","")));
console.log(entitiesList);

// foreign key to table name dictionary
const foreignKeyTable = {
    pokemonId: 'Pokemon',
    abilityId: 'Abilities',
    typeId: 'Types',
    categoryId: 'Categories',
    rangeId: 'Ranges',
    moveId: 'Moves'
};

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
async function prettyTable(responseContext, rows) {
    // iterate through rows returned
    await rows.forEach(async function(row) {
        // make list of attributes
        responseContext.pageContext.columns = toPretty(Object.keys(row));

        // add attributes to entry
        await Object.keys(row).forEach(async function(key) {
            let value;

            // if foreign key attribute
            if (Object.keys(foreignKeyTable).includes(row[key])) {
                // go get foreign key name value from referenced table
                await queryPromise('SELECT name FROM ? WHERE id=?', [foreignKeyTable[key], row[key]])
                .catch(next)
                .then((fkNames) => {
                    value = fkNames[0]; 
                });
            }else {
                value = row[key];
            }

            // add entry to table array
            responseContext.pageContext.tableEntries.push({key: value});
        });
    });

    return responseContext;
};

// Validate that all fields sent by client are real fields in the table
async function validateFields(entity, data, next) {
    let valid = false;

    await queryPromise('SELECT TOP 1 * FROM ??', [entity])
    .catch(next)
    .then((rows) => {
        if (data.searchTerms.every((term) => (Object.keys(rows[0]).includes(term.field)))) valid = true;
    });

    return valid;
}

// Validate that id sent by client exists in the table
async function validateId(entity, id, next) {
    let valid = false;

    await queryPromise('SELECT id FROM ??',[entity])
    .catch(next)
    .then((rows) => {
        if (rows.map((row) => (row[0].id)).includes(id)) valid = true;
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
    validateFields,
    validateId
};