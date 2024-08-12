# Chill-Drive-Pokedex
School project for Introduction to Databases. Pokemon database management website implemented using express-handlebars.


## CITATIONS
External libraries used can be found in package.json

### utility-function.js
**String capitalization helper function (line 46)**<br/>
Date: 8/3/2024<br/>
Copied from stackoverflow post<br/>
URL: https://stackoverflow.com/a/1026087

**Regex replace usage (line 59)**<br/>
Date: 8/5/2024<br/>
Copied and then modified from stackoverflow post<br/>
URL: https://stackoverflow.com/a/54246501

### db-functions.js
**Initial mysql and dotenv code, from line 11 to line 23**<br/>
Date: 8/3/2024<br/>
Initial code copied and then modified from my Activity 2 solution<br/>
URL: https://canvas.oregonstate.edu/courses/1967354/assignments/9690199

### index.js
**unhandlerejection override (line 9)**<br/>
Date: 8/11/2024<br/>
Copied from stackoverflow post<br/>
URL: https://stackoverflow.com/a/60782386


## NOTE FOR USAGE
Not included in this git repo is a file titled `.env` in the root directory, containing database credential info and the port required for the app to function.
It looks like this:

```
PORT=####
DBHOST="DATABASEHOSTURL"
DBUSER="USERNAME"
DBPASS="PASSWORD"
DBNAME="DATABASENAME"
```
