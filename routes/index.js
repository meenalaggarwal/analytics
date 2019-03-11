var express = require('express');
var analytics = require('./analytics');
var jobs = require('./jobs');

module.exports = function(app) {

	var router = express.Router();
	analytics(router, app);
	jobs(router, app);
	
	return router;	
};
