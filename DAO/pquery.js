var Promise = require('bluebird');
var async =require('async');
var pg = require('pg');
var uuidv1 = require('uuid/v1');

function PQuery(dbType, config) {
	this.host = config.host;
	this.user = config.user;
	this.password = config.password;
	this.database = config.dbName;
	this.dbType = dbType;
}

PQuery.prototype.getConnection = function() {
	var self = this;
	return new Promise(function (resolve, reject) {
		self.dbClient = new pg.Pool({
			host: self.host,
			user: self.user,
			password: self.password,
			database: self.database
		});
	});
};

PQuery.prototype.processCSV = function(records) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var queries = [];
        for (var rec = 0; rec < records.length; rec = rec + 500) {
            var recs = records.slice(rec, rec + 500);
            var query = 'INSERT INTO records (platform, uid) VALUES ';
            for (var i = 0; i < recs.length; i++) {
            	query += "('" + recs[i].platform + "','" + recs[i].uid + "')";
            	if (i !== recs.length - 1) {
            		query += ',';
            	}
            }
            queries.push(query);
        }
		for (var q = 0; q < queries.length; q++) {
			(function(index) {
				self.dbClient.query(queries[q], function(err, res) {
					if (err) {
						if (parseInt(index) === queries.length - 1) {
							return reject(err);	
						}
					} else {
						if (parseInt(index) === queries.length - 1) {
							return resolve();	
						}
					}
				});
			})(q);
		}
	});
};

PQuery.prototype.getAnalytics = function(platform) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var query = 'SELECT * from records where platform = $1';
		var value = [platform];
		self.dbClient.query(query, value, function(err, res) {
			if (err) {
				return reject(err);
			} else {
				var hash = {};
				for (var row in res.rows) {
					if(!hash[res.rows[row].uid]) {
						hash[res.rows[row].uid] = true;
					} 
				}
				var uniqueIDs = Object.keys(hash);
				return resolve({totalUIDs: res.rows.length, totalUniqueUIDs: uniqueIDs.length, UIDs: uniqueIDs});	
			}
		});
	});
};

PQuery.prototype.jobCreation = function(jobData) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var jobid = uuidv1();
		var query = 'INSERT INTO jobs (jobid, file, mimetype, size, status) VALUES ($1, $2, $3, $4, $5)';
		var value = [jobid, jobData.file, jobData.mimetype, jobData.size, 'pending'];
		self.dbClient.query(query, value, function(err, res) {
			if (err) {
				return reject(err);
			} else {
				return resolve(jobid);
			}
		});
	});
};

PQuery.prototype.jobUpdate = function(jobId, jobStatus, jobState, error) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var query = 'UPDATE jobs SET status = $1, state = $2 where jobid = $3';
		var value = [jobStatus, jobState, jobId];
		self.dbClient.query(query, value, function(err, res) {
			if (err) {
				return reject(err);
			} else {
				return resolve();
			}
		});
	});
};

PQuery.prototype.getAllJobs = function() {
	var self = this;
	return new Promise(function (resolve, reject) {
		var query = 'SELECT * from jobs';
		self.dbClient.query(query, function(err, res) {
			if (err) {
				return reject(err);
			} else {
				return resolve(res.rows);	
			}
		});
	});
};

PQuery.prototype.getJob = function(jobId) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var query = 'SELECT * from jobs where jobid=$1';
		var value = [jobId];
		self.dbClient.query(query, value, function(err, res) {
			if (err) {
				return reject(err);
			} else {
				return resolve(res.rows[0]);	
			}
		});
	});
};

module.exports = PQuery;