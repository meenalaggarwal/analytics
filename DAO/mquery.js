var Promise = require('bluebird');
var async =require('async');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

function MQuery(dbType, config) {
	this.url = config.url;
	this.dbName = config.dbName;
	this.dbType = dbType;
}

MQuery.prototype.getConnection = function() {
	var self = this;
	return new Promise(function (resolve, reject) {
		// Use connect method to connect to the server
		MongoClient.connect(self.url, function(err, client) {
			if(err) {
				return reject(err);
			} else {
				self.dbClient = client.db(self.dbName);		
				return resolve();
			}
		});
	});
};

MQuery.prototype.processCSV = function(records) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var recordObj = {};
		for (var rec = 0; rec < records.length; rec++) {
			if (recordObj[records[rec].platform]) {	
				recordObj[records[rec].platform].push(records[rec].uid);
			} else {
				recordObj[records[rec].platform] = [records[rec].uid];
			}
		}
		var collection = self.dbClient.collection('records');
		async.forEachOf(recordObj, function(uids, platform, callback) {
			collection.update({platform: platform}, {$push: {uids: {$each: uids}}}, { upsert: true },
			    function(err) {
				return callback(err);
			});
		}, function(err, results) {
			if (err) {
				return reject(err);	
			} else {
				return resolve();
			}
		});
	});
};

MQuery.prototype.getAnalytics = function(platform) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var collection = self.dbClient.collection('records');
		collection.findOne({platform: platform}).toArray(function(err, result) {
			if (err) {
				return reject(err);
			} else {
				if (result[0]) {
					var uniqueIDs = result[0].uids.filter(function(value, index) {
						return result[0].uids.indexOf(value) === index; 
					});
					return resolve({totalUIDs: result[0].uids.length, totalUniqueUIDs: uniqueIDs.length, UIDs: uniqueIDs});	
				} else {
					return resolve({totalUIDs: 0, totalUniqueUIDs: 0, UIDs: []})
				}
			}
		});
	});
};

MQuery.prototype.jobCreation = function(jobData) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var collection = self.dbClient.collection('jobs');
		jobData.status = 'pending';
		collection.insert(jobData, function(err, res) {
			if (err) {
				return reject(err);
			} else {
				return resolve(res.insertedIds['0']);
			}
		});
	});
};

MQuery.prototype.jobUpdate = function(jobId, jobStatus, jobState, error) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var collection = self.dbClient.collection('jobs');
		collection.update({_id: jobId}, {$set: {status: jobStatus, state: jobState, error: error}} , function(err, res) {
			if (err) {
				return reject(err);
			} else {
				return resolve(res);
			}
		});
	});
};

MQuery.prototype.getAllJobs = function() {
	var self = this;
	return new Promise(function (resolve, reject) {
		var collection = self.dbClient.collection('jobs');
		collection.find().toArray(function(err, result) {
			if (err) {
				return reject(err);
			} else {
				return resolve(result);
			}
		});
	});
};

MQuery.prototype.getJob = function(jobId) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var collection = self.dbClient.collection('jobs');
		collection.find(ObjectId(jobId)).toArray(function(err, result) {
			if (err) {
				return reject(err);
			} else {
				return resolve(result[0]);
			}
		});
	});
};

module.exports = MQuery;