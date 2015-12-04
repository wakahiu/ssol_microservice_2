
var loadconfig = require('../../config/loadconfig.js');
var defaultOptions = loadconfig.DEFAULTS;


var mongoServer = 'mongodb://'+defaultOptions.host;
var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;


	var students_model = new Schema({
		  uni	   : String,
	});

//module.exports = function() {
	var courses_model = new Schema;

	courses_model.add({
		user_id    : String,
	    course_id :  { type: Number, min: 0000, max: 9999 },
		name	   : String,
		students   : [students_model],
		updated_at : Date
	});


	mongoose.model( 'courses_model', courses_model ); // model





// READ IN ATTRIBUTES FROM CONFIG FILE TO UPDATE SCHEMA
	var pathToConfigJSON = '/../../config/config.json';
	var fs    = require('fs'),
	nconf = require('nconf');
	nconf.argv()
	  .env()
	  .file({ file: pathToConfigJSON });

	var attributes = nconf.get('courseAttributes');

	for (var i in attributes){
		// add the attribute to the schema
		  var path_= attributes[i];
		  var update = {};
		  update[path_] = ''; 

		  courses_model.add( update );
	}







// Set the connection to the db
	var courses_db = mongoose.createConnection(mongoServer);
	courses_db.on('error', function(err){
	  if(err) throw err;
	});

	courses_db.once('open', function callback () {
	  console.info('Mongo db connected successfully on: '+mongoServer);
	});


	exports.getModel = courses_model;
	exports.getdb = courses_db;
//};


