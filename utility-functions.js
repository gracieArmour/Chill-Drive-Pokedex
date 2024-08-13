/*
CITATIONS

String capitalization helper function (line 47)
Date: 8/3/2024
Copied from stackoverflow post
URL: https://stackoverflow.com/a/1026087

Regex replace usage (line 60)
Date: 8/5/2024
Copied and then modified from stackoverflow post
URL: https://stackoverflow.com/a/54246501
*/

const fs = require('fs');
const path = require('path');
var { queryPromise } = require('./db-functions')  // Import the database connector

// toLower name to proper EntityName dictionary
const entitiesList = {
    abilities: 'Abilities',
    categories: 'Categories',
    moves: 'Moves',
    pokemon: 'Pokemon',
    pokemonabilities: 'PokemonAbilities',
    pokemonmoves: 'PokemonMoves',
    pokemontypes: 'PokemonTypes',
    ranges: 'Ranges',
    types: 'Types'
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

// function to reverse search foreignKeyTable
function getForeignKey(table) {
    return Object.keys(foreignKeyTable).find((fk) => (foreignKeyTable[fk] === table));
}

// custom error class, pulled from an old personal project
class codedError extends Error {
    constructor(message, code) {
        super(message);
        this.status = code;
        this.statusCode = code;
    }
}

// Error handling function primarily for rejected queryPromises
function errorHandler(res,err,code) {
    res.status(code).send(err);
}

// string capitalization helper function, citation at top of file
function capFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const intersectionTables = {
    Pokemon: ['PokemonAbilities','PokemonMoves','PokemonTypes']
}

// string manipulation helper function, citation at top of file
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

async function getDropdownData(fields, dropdownContext, res) {
    if (!dropdownContext) dropdownContext = {};

    for (let key of fields) {
        if (!Object.keys(foreignKeyTable).includes(key)) continue;

        await queryPromise('SELECT id, name FROM ??', [foreignKeyTable[key]])
        .catch((err) => errorHandler(res,err,500))
        .then((rows) => {
            dropdownContext[key] = {
                key: key,
                prettyKey: toPretty(key),
                entries: rows.map((row) => ({id: row.id, name: row.name}))
            };
        });
    }

    return dropdownContext;
}

// Make SELECT results human-readable
async function prettyTable(responseContext, rows, res) {
    // if table is empty, skip
    if (!(rows?.length > 0)) return responseContext;

    // make list of attributes
    responseContext.pageContext.columns = Object.keys(rows[0]).map((column) => (toPretty(column)));

    // get data for dynamic dropdowns
    responseContext.dropdownContext = await getDropdownData(Object.keys(rows[0]),responseContext.dropdownContext,res);

    // add intersection table columns and dropdown data
    let entityName = entitiesList[responseContext.entityName];
    for (let intersectionEntity of (intersectionTables[entityName] || [])) {
        responseContext.pageContext.columns.push(intersectionEntity.replace(entityName,''));

        // get data for dynamic dropdowns
        await queryPromise('SELECT * FROM ?? LIMIT 1', [intersectionEntity])
        .catch((err) => errorHandler(res,err,500))
        .then((rows) => getDropdownData(Object.keys(rows[0]),responseContext.dropdownContext,res))
        .then((dropdownContext) => {
            responseContext.dropdownContext = dropdownContext;
        });
    }

    // iterate through rows returned
    for (let row of rows) {
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
                    if (fkNames.length > 0) {
                        value = fkNames[0].name;
                    }else {
                        value = 'NULL';
                    }
                });
            }else {
                value = row[key];
            }

            entry[key] = value;
        }

        // add intersection table links
        for (let intersectionEntity of (intersectionTables[entityName] || [])) {
            // get all arguments for complex SELECT JOIN query
            let otherEntity = intersectionEntity.replace(entityName,'');
            let argsArr = [
                intersectionEntity,
                otherEntity,
                intersectionEntity,
                getForeignKey(otherEntity),
                otherEntity,
                intersectionEntity,
                getForeignKey(entityName),
                entry.id
            ];

            await queryPromise('SELECT name FROM ?? JOIN ?? ON ??.?? = ??.id WHERE ??.?? = ?',argsArr)
            .catch((err) => errorHandler(res,err,500))
            .then((rows) => {
                entry[intersectionEntity] = rows.map((row) => (row.name)).join(', ');
            });
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

// handler for both normal and composite primary keys
function pkHandler(data) {
    let argsArr = [];

    if (!data.id) {
        data.compositeId.forEach((term) => argsArr.push(term.value));
    }else {
        argsArr.push(data.id);
    }
    
    argsArr.push(`WHERE ${data.id ? `id=?` : data.compositeId.map((term) => (`${term.field}=?`)).join(" AND ")}`);
    
    return argsArr;
}

// Validate that id sent by client exists in the table
async function validateId(entityName, data, res) {
    let valid = false;

    let argsArr = pkHandler(data);
    let searchStr = argsArr.pop();

    await queryPromise(`SELECT * FROM ?? ${searchStr}`,[entityName,...argsArr])
    .catch((err) => errorHandler(res,err,500))
    .then((rows) => {
        if (rows?.length > 0) valid = true;
    });

    return valid;
}

// Export functions/objects for external use
module.exports = {
    entitiesList,
    foreignKeyTable,
    codedError,
    errorHandler,
    capFirst,
    toPretty,
    prettyTable,
    validateFields,
    pkHandler,
    validateId
};