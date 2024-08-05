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

// Export functions/objects for external use
module.exports = {
    capFirst,
    foreignKeyTable,
    prettyNameTable,
    entitiesList
};