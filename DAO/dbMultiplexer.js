module.exports = function(dbType, config) {
	var dbConst;
	if (dbType === 'mongodb') {
		dbConst = require('./mquery.js');
	} else if (dbType === 'pg') {
		dbConst = require('./pquery.js');
	} else {
		throw 'DB not supported [only mongodb/pg]'
	}
	return new dbConst(dbType, config);
};