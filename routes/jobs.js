var express = require('express');
var router = express.Router();

module.exports = function(router, app) {
	/**
	 * @swagger
	 * /jobs:
	 *   get:
	 *     tags:
	 *       - Jobs
	 *     description: Get all the jobs
	 *     produces:
	 *       - application/json
	 *     responses:
	 *       200:
	 *         description: Jobs Details
	 */
	router.get('/jobs',function (req, res, next) {
  		app.db.getAllJobs()
  		.then(function(response) {
  			return res.status(200).send(response);
  		})
  		.catch(function(err) {
  			return res.status(400).send(err);
  		});
	});

	/**
	 * @swagger
	 * /jobs/{jobid}:
	 *   get:
	 *     tags:
	 *       - Jobs
	 *     description: Get a job
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - in: path
     *         name: jobid
     *         schema:
     *           type: string
     *         required: true
     *         description: JobId to be fetched.
	 *     responses:
	 *       200:
	 *         description: Job Detail
	 */
	router.get('/jobs/:jobid',function (req, res, next) {
		var jobid = req.params.jobid;
  		app.db.getJob(jobid)
  		.then(function(response) {
  			if (response) {
  				return res.status(200).send(response);	
  			} else {
  				return res.status(404).send();
  			}
  			
  		})
  		.catch(function(err) {
  			return res.status(400).send(err);
  		});
	});
};