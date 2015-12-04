var utils    = require( '../../utils' );

// require the database, which has already been connected
var requireDB = require('../schemas/courses_db.js');
var courses_db = requireDB.getdb;
var courses_model = requireDB.getModel;
 
var model = courses_db.model('courses_model');
var paths = ["user_id","course_id","name", "students", "updated_at"];

var root = '/courses/';



// READ IN CONFIG FILE
var pathToConfigJSON = '/../../config/config.json';
var fs    = require('fs'),
nconf = require('nconf');
nconf.argv()
  .env()
  .file({ file: pathToConfigJSON });



exports.deleteKEY = function( ){

  return function ( req, res, next ){

	var clientQuery = req.query;
	var key = clientQuery.key;

	if (typeof key === 'undefined'){
		console.log("-> key entry is of type 'undefined' ");
		res.send(false);
	} else {

	// store the key-value pair to be 
	  var update_exists = {};
	  update_exists[ key ] = { $exists : true };

	// check if the field exists in the schema
		model.findOne(update_exists, function (find_err, result){

			if (find_err) return find_err;

			if ( result != null ) {

			// search and destroy the attribute from the config file

			  var attributes = nconf.get('courseAttributes');
			  var index = attributes.indexOf(key);
				if (index > -1){
					attributes.splice(index,1);							
					nconf.save(function(er){});
				}

			// destroy the attribute from the models
			  model.find({}, function(err, success){
			// need to find() then iterate through all of them to add the values

			  for (var j in success) {


				// preallocate
					var userKeys = [];
					var userKeyValues = [];

				// find and return all keys and keyValues within model p
					getKeysAndValues(success[j],userKeys,userKeyValues);

					//remove the Key value corresponding to the key was deleted 
						if (index > -1){					
							userKeyValues.splice(index,1);
						}



					var keyValues = [req.cookies.user_id, success[j].course_id, success[j].name, success[j].students, Date.now()];	


					keyValues = keyValues.concat(userKeyValues);
	
						success[j].remove(function(err, success){});

					// add the attributes to the model
						addAttributesToSchema(attributes,courses_model);

					// go to create course
					createCourseHandler(model, paths, keyValues);

					// Reset the paths variable for each iteration
					paths = ["user_id","course_id","name", "students", "updated_at"];
					
			  } // ends for loop



			// check if user attempted to modify an inherent key
			  	var ind = paths.indexOf(key);
				if (ind > -1){
					console.log('-> '+key+' key removal from schema is restricted');
					res.send(false);
				} else {
					console.log('-> '+key+' key removed from schema');
					res.send( true );
				}


			  }); // ends model.findOne


			} else {
				console.log('-> '+key+' key cannot be removed from schema');
				res.send(false);

			} // ends else

		}); // ends .findOne()

	}

  }; // ends return

}; // ends exports.updateCourse





exports.addKEY = function( ){

  return function ( req, res, next ){

	var clientQuery = req.query;
	var key = clientQuery.key;


	if (typeof key === 'undefined'){
	console.log("-> key entry is of type 'undefined' ");
	res.send(false);
	} else {

	// store the key-value pair to be 
	  var update_exists = {};
	  update_exists[ key ] = { $exists : true };

	// check if the field exists in the schema
		model.findOne(update_exists, function (find_err, result){

			if (find_err) return find_err;

			if ( result != null ) {

				console.log('-> '+key+' key already exists in schema');
				res.send(false);

			} else {

			// update nconf
			  var attributes = nconf.get('courseAttributes');
			  attributes.push(key);
			  nconf.save(function(err){});

			// need to find() all models
			  model.find({}, function(err, success){


			// iterate through all models to add the keys
			  for (var j in success){

				
				// preallocate
					var userKeys = [];
					var userKeyValues = [];

				// find and return all keys and keyValues within model p
					getKeysAndValues(success[j],userKeys,userKeyValues);

					var keyValues = [req.cookies.user_id, success[j].course_id, success[j].name, success[j].students, Date.now()];	
					keyValues = keyValues.concat(userKeyValues);

					//console.log(keyValues);
					//console.log(userKeys);

						success[j].remove(function(err, success){});				

					// add the attributes to the model
						addAttributesToSchema(attributes,courses_model);

					// go to create course
						createCourseHandler(model, paths, keyValues);

					// Reset the paths variable for each iteration
						paths = ["user_id","course_id","name", "students", "updated_at"];
				
			  } // ends for loop


			// check if user attempted to modify an inherent key
			  	var ind = paths.indexOf(key);
				if (ind > -1){
					console.log('-> '+key+' key already exists in schema');
					res.send(false);
				} else {
					console.log('-> '+key+' key added to schema');
					res.send( true );
				}


			  }); // ends model.findOne


			} // ends else

		}); // ends .findOne()

	}

  }; // ends return

}; // ends exports.updateCourse


// routes.create handler
exports.createCourse = function () {

    return function(req, res, next) {

  // Read in the client query 	

	var clientQuery = req.query;

	var course_id = clientQuery.course_id;
	var name = clientQuery.name;

	// business logic
	if ( (typeof course_id === 'undefined') && (typeof name === 'undefined') ) {
	    console.log("-> invalid client queries - course_id || name is undefined");
		res.send(false);

	} else {

		model.findOne(clientQuery, function (find_err, result){

			if (find_err) return find_err;

			if ( result == null ) {


			  var keyValues = [req.cookies.user_id, course_id, name, req.body.students, Date.now()];
			  var attributes = nconf.get('courseAttributes');


			  for (var i = 0; i < attributes.length; i++){
				keyValues.push(null);
				paths.push(attributes[i]);

				// add the attribute to the schema
				  var path_= attributes[i];
				  var update = {};
				  update[path_] = ''; 
				  courses_model.add( update );
			  }

			// subroutine to create the new model within the db
			  createCourseHandler(model, paths, keyValues);

			// Reset the paths variable
			  paths = ["user_id","course_id","name", "students", "updated_at"];
			
			// Log and Return to User
			  console.log('-> Course Number:'+course_id+' created');
			  res.send( true );

			} else {

				console.log('-> course_id:'+course_id+' already exists');
				res.send( false );

			};

		});  // ends .findOne()

	};

  }; // ends return

}; // ends createCourse


createCourseHandler = function(model, paths, keyValues){

	var newModel = {};

	for (var i in paths){
  		newModel[paths[i]] = keyValues[i]; 
  	}

	new model(
		newModel

/* 
// new Model takes the following structure (in addition to config 'attributes')

		{
		  user_id    : req.cookies.user_id,
		  course_id : Number,
		  name		 : name,
		  students   : req.body.students,//["randcourse1","randcourse2"],
		  updated_at : Date.now()
	  	}

*/
	).save( function ( err, model, next ){

		if( err ) return next( err );


	}); // ends save
}


getKeysAndValues = function(p,userKeys,userKeyValues){

	for (var key1 in p) {
	  if ( (p.hasOwnProperty(key1)) &&
		   (key1 == "_doc") ) {
		  var p2 = p._doc;
			for (var key2 in p2){
			// Search for keys that are user defined
				if ( (p2.hasOwnProperty(key2) ) &&
					 (key2 != "name") && 
					 (key2 != "course_id") && 
					 (key2 != "students") && 
					 (key2 != "updated_at") && 
					 (key2 != "_id") && 
					 (key2 != "__v") ) {
						userKeys.unshift(key2); // unshift -> prepend to array
						userKeyValues.unshift(p2[key2]);
				}
			} // ends inner for
			break;
		} // ends if key1 == _doc
	  }// ends outer for

	// since a key was just created, push a new value
	userKeyValues.push(null);
}


addAttributesToSchema = function (attributes,courses_model){

	  for (var i = 0; i < attributes.length; i++){

		paths.push( attributes[i] );

		// add the attribute to the schema
		  var path_= attributes[i];
		  var update = {};
		  update[path_] = ''; 
		  courses_model.add( update );

	  }
}

