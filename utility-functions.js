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
    return string.charAt(0).toUpperCase() + string.slice(1);
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
    if (foreignKeyTable.keys().includes(name)) {
        prettyName = name.replace('Id','');
    }else {
        // split camelCase attribute name into Title Case words
        prettyName = name.replace(/[A-Z]/g, letter => ` ${letter}`);
    }
    
    return capFirst(prettyName);
};

// Export functions/objects for external use
module.exports = {
    foreignKeyTable,
    prettyNameTable,
    capFirst,
    toPretty
};