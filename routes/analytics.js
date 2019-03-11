var express = require('express');
var multer  = require('multer');
var router = express.Router();
var parse = require('csv-parse/lib/sync');

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

module.exports = function(router, app) {
	/**
	 * @swagger
	 * /analytics/upload:
	 *   post:
	 *     tags:
	 *       - Analytics
	 *     description: Upload an analytics file [csv]
	 *     consumes:
     *       - multipart/form-data
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - in: formData
     *         name: upfile
     *         type: file
     *         required: true
     *         description: The file to upload.
	 *     responses:
	 *       200:
	 *         description: Successfully uploading
	 */
	router.post('/analytics/upload', upload.single('upfile'), function (req, res, next) {
	  	if (req.file.mimetype === 'text/csv') {
	  		var jobId;
	  		// Create a Job ID
	  		app.db.jobCreation({file: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size})
	  		.then(function(jid) {
	  			jobId = jid;
	  			var input = req.file.buffer.toString();
				var records = parse(input, {
				  columns: true,
				  skip_empty_lines: true
				});
				app.db.processCSV(records)
				.then(function(data) {
					app.db.jobUpdate(jobId, 'completed', 'success', null);
					return res.status(200).send({jobId: jobId});
				})
				.catch(function(err) {
					app.db.jobUpdate(jobId, 'completed', 'error', err);
					return res.status(200).send({jobId: jobId});
				});
	  		})
	  		.catch(function(err) {
	  			return res.status(400).send(err);
	  		});
	  	} else {
	  		return res.status(400).send('File type npt supported [only text/csv]');
	  	}
	});

	/**
	 * @swagger
	 * /analytics:
	 *   get:
	 *     tags:
	 *       - Analytics
	 *     description: Get analytics on platform filter
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - in: query
     *         name: platform
     *         schema:
     *           type: file
     *         required: true
     *         description: Platform filter
	 *     responses:
	 *       200:
	 *         description: Analytics data
	 */
	router.get('/analytics', function (req, res, next) {
  		app.db.getAnalytics(req.query.platform)
  		.then(function(analytic) {
  			return res.status(200).send(analytic);
  		})
  		.catch(function(err) {
  			return res.status(400).send(err);
  		});
	});
};