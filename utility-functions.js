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

// Export functions/objects for external use
module.exports = {
    entitiesList,
    foreignKeyTable,
    capFirst,
    toPretty
};