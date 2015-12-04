var utils    = require( '../../utils' );

// require the database, which has already been connected
var requireDB = require('../schemas/courses_db.js');
var courses_db = requireDB.getdb;
var courses_model = requireDB.getModel;
var model = courses_db.model('courses_model');



var root = '/courses/';



// Redis RI
var redis = require("redis")
clientRI = redis.createClient() // Publishes to ri channel
var pub_channel = "referential_integrity";




// GET course info based on the client's query
exports.returnCourseInfo = function () {
	// need this return syntax because we are passing io from app.js
	return function(req, res, next ){


  // Read in the client query 	
	var clientQuery = req.query;

		model.find( clientQuery, function ( err, course_found ){
			if ( err || (course_found.length == 0) ) {
				console.log("-> Query not found : "+JSON.stringify(clientQuery));
				res.send([]);
			} else { 
				console.log("-> Query found     : "+JSON.stringify(clientQuery));
				res.json(course_found);
			}

		}); //ends findOne()

	}; // ends return

}; // ends exports.




// subroutine to build the client's inputted query
buildQuery = function(query, params, iterations){
	var param_keys = Object.keys(params);
	for (var i = 0; i < iterations; i++) {
		query[param_keys[i]] = parseInt(params[param_keys[i]]);
	}
}

// subroutine to post a resource
POSTresource = exports.POSTresource = function (model, res, params, collectionQuery, resource, resourceQuery, clientQuery, resmode){

  // First use the collection Query to query the db
	model.findOne(collectionQuery, function(err, course_found){

	// If the collection exists, check resource entries to make sure no duplicate exists
		if (course_found) { 
			course_found.collection.aggregate([
				{"$match"	: collectionQuery } // NEED TO PARSE INT() !!!
				,{"$unwind"	: "$"+resource }
				,{"$match"	: resourceQuery } 
			], 
			function (err_lastname, student_found){

			// If the resource already exists
					if ( err_lastname || (student_found.length > 0) ) {

						console.log('-> '+JSON.stringify(resourceQuery)+' was NOT POSTED to '+JSON.stringify(collectionQuery));
						if (resmode)
							res.send(false);

			// If the resource does not exist, add it to the db
					} else	{		

						course_found[resource].push(clientQuery);					
						course_found.save();
						console.log('-> '+JSON.stringify(clientQuery)+' was POSTED to '+JSON.stringify(collectionQuery));

							  var uni = clientQuery.uni;
							  var course_id = parseInt(params.course_id);


						if (resmode){
						  	// redis message
								var ri_message = {
									'sender' : 'courses_micro_service',
									'service_action' : 'update student add course',
									'course_id': course_id,
									'uni': uni };
								
								var message = JSON.stringify(ri_message).toLowerCase();
								clientRI.publish(pub_channel, message);

					
							res.send(true);
						}

					};
			}); // ends model.findOne

	// If the course does not exist
		} else {

			// If the request came from the students microservices throught RI, send back the message
			// with the timestamp.
			if (params.sender === 'students_micro_service') {
				console.log('-> Query not found, rolling back students_micro_service : '+JSON.stringify(collectionQuery) );
				var ri_message = {
					'sender' : 'courses_micro_service',
					'service_action' : "update student add course dne",
					'uni': params.uni,
					'datetime': params.datetime,
					'course_id': params.course_id
				};
				var message = JSON.stringify(ri_message).toLowerCase();
				clientRI.publish(pub_channel, message);

			} else {
				console.log('-> Query not found : '+JSON.stringify(collectionQuery));
				if (resmode)
					res.send(false);
			}

		};

	}); // ends model.findOne
}





// subroutine to DELETE a resource
DELETEresource = exports.DELETEresource = function (model, res, params, collectionQuery, resource, resourceQuery, clientQuery,resmode){

  // First use the collection Query to query the db
	model.findOne(collectionQuery, function(err, course_found){

	// If the collection exists, check resource entries to make sure no duplicate exists
		if (course_found) { 
			course_found.collection.aggregate([
				{"$match"	: collectionQuery } // NEED TO PARSE INT() !!!
				,{"$unwind"	: "$"+resource }
				,{"$match"	: resourceQuery } 
			], 
			function (err_lastname, student_found){

			// If the entry already exists
				if (student_found.length > 0 ) {

				var deleteQuery = {};
				deleteQuery[resource] = clientQuery;

				// pull (remove) the student from the student collection withing the course 
					model.findOneAndUpdate( collectionQuery, {
						$pull: deleteQuery
					}, function (e, s){
						if (s){


							if (resmode){
					  	// redis message
							var ri_message = {
								'sender' : 'courses_micro_service',
								'service_action' : 'update student delete course',
								'course_id': params.course_id,
								'uni': clientQuery.uni };
		
							var message = JSON.stringify(ri_message).toLowerCase();
							clientRI.publish(pub_channel, message);


							console.log('-> '+JSON.stringify(deleteQuery)+' DELETED from '+JSON.stringify(collectionQuery));

							res.send(true);
							}
						} else {
							console.log('-> '+JSON.stringify(deleteQuery)+' NOT DELETED from '+JSON.stringify(collectionQuery));
							if (resmode)
								res.send(false);
						}
					});

			// If the student entry does not exist
				} else	{		

					console.log('-> '+JSON.stringify(resourceQuery)+' does not exist in '+JSON.stringify(collectionQuery));
					if (resmode)
						res.send(false);

				};


		})// ends aggregate

	// If the course does not exist
		} else {

			console.log('-> Query not found : '+JSON.stringify(collectionQuery));
			if (resmode)
				res.send(false);

		};

	}); // ends model.findOne
}


DELETEresourceFromAll = exports.DELETEresourceFromAll = function(model, res, params, collectionQuery, resource, resourceQuery, clientQuery,resmode){
	// First find the course in the db model
	  model.find({}, function(err, course_found){

	// Iterate through each document and delete the resource
		course_found.forEach( 

		  function( coursedata ) {

			coursedata.collection.aggregate( [
				{"$unwind"	: "$"+resource }
				,{"$match"	: resourceQuery }
				//,{"$match"	: {"students.firstname": firstname} }
			],
				function (err_lastname, student_found){
	
				// Build the delete query
					var deleteQuery = {};
					deleteQuery[resource] = clientQuery;

				// If the entry already exists
					if (student_found.length > 0 ) {

					// pull (remove) the student from the student collection withing the course 
						coursedata.update({
							$pull: deleteQuery

						}, function (e, s){
							if (s){
								console.log('-> '+JSON.stringify(resourceQuery)+' DELETED from '+JSON.stringify(coursedata.course_id));
								//res.send(true);
							} else {
								console.log('-> '+JSON.stringify(resourceQuery)+' NOT DELETED from '+JSON.stringify(coursedata.course_id));
								//res.send(false);
							}
						});


				// If the student entry does not exist
					} else	{		

						console.log('-> Query NOT found : '+JSON.stringify(resourceQuery));
						//res.send(false);

					};
			}); // ends collection.aggregate

		}); // ends .forEach()

		if (resmode)
			res.send(true);

	 }); // ends model.findOne
}


exports.removeStudent = function( ) {

  return function ( req, res, next ){

  // exported from:
  // 	app.delete(  root+'/:resource' )

  // Read in the params and client query 	
	var params = req.params;
	var clientQuery = req.query;
	var resource = params.resource;


  // BUILD THE QUERY FOR THE COLLECTION
  //	Note: the collection identifier (/:collection_id/) == param_keys[0]
	var collectionQuery = {};
	var collection_keys = Object.keys(params);
	collectionQuery[collection_keys[0]] = parseInt(params[collection_keys[0]]);
	//   Note: parseInt() called for the collection query id


  // BUILD THE QUERY for the RESOURCE -- for Mongo's collection.aggregation function
	var resourceQuery = {};

	var query_keys = Object.keys(clientQuery);
	for (var i = 0; i < query_keys.length; i++){
		resourceQuery[resource+"."+query_keys[i]] = clientQuery[query_keys[i]];
	}	

/*
	console.log(clientQuery.uni)
	console.log(params);
	console.log(clientQuery);
	console.log(resource);
	console.log(collectionQuery);
	console.log(resourceQuery);
*/

	var resmode = true; // enables sending response to client
	DELETEresourceFromAll(model, res, params, collectionQuery, resource, resourceQuery, clientQuery,resmode);

  }; // ends return

}; // ends exports.updateCourse






exports.removeStudentFromCourse = function( ) {

  return function ( req, res, next ){

  // exported from:
  // 	app.post(  root+'/:course_id/:resource' )

  // Read in the params and client query 	
	var params = req.params;
	var clientQuery = req.query;
	var resource = params.resource;


  // BUILD THE QUERY FOR THE COLLECTION
  //	Note: the collection identifier (/:collection_id/) == param_keys[0]
	var collectionQuery = {};
	var collection_keys = Object.keys(params);
	collectionQuery[collection_keys[0]] = parseInt(params[collection_keys[0]]);
	//   Note: parseInt() called for the collection query id


  // BUILD THE QUERY for the RESOURCE -- for Mongo's collection.aggregation function
	var resourceQuery = {};

	var query_keys = Object.keys(clientQuery);
	for (var i = 0; i < query_keys.length; i++){
		resourceQuery[resource+"."+query_keys[i]] = clientQuery[query_keys[i]];
	}	

/*
	console.log(clientQuery.uni)
	console.log(params);
	console.log(clientQuery);
	console.log(resource);
	console.log(collectionQuery);
	console.log(resourceQuery);
*/

  // business logic
	var resmode = true; // enables sending response to client
	// update db - remove the student from the course
		DELETEresource(model, res, params, collectionQuery, resource, resourceQuery, clientQuery, resmode);

  } // ends return

} // ends export




exports.addStudentToCourse = function( ) {

  return function ( req, res, next ){

  // exported from:
  // 	app.post(  root+'/:course_id/:resource' )

  // Read in the params and client query 	
	var params = req.params;
	var clientQuery = req.query;
	var resource = params.resource;


  // BUILD THE QUERY FOR THE COLLECTION
  //	Note: the collection identifier (/:collection_id/) == param_keys[0]
	var collectionQuery = {};
	var collection_keys = Object.keys(params);
	collectionQuery[collection_keys[0]] = parseInt(params[collection_keys[0]]);
	//   Note: parseInt() called for the collection query id


  // BUILD THE QUERY for the RESOURCE -- for Mongo's collection.aggregation function
	var resourceQuery = {};
	var query_keys = Object.keys(clientQuery);
	for (var i = 0; i < query_keys.length; i++){
		resourceQuery[resource+"."+query_keys[i]] = clientQuery[query_keys[i]];
	}	

/*
	console.log(res)
	console.log(typeof res)
	console.log(params);
	console.log(collectionQuery);
	console.log(resource);
	console.log(resourceQuery);
	console.log(clientQuery);
*/

  // business logic
	if ( (typeof clientQuery.uni === 'undefined') ) {
	    console.log("-> uni is not defined");
		res.send(false);

	} else {

	var resmode = true; // enables sending response to client
	// update db - post the student to the course
		POSTresource(model, res, params, collectionQuery, resource, resourceQuery, clientQuery, resmode);

	} // ends else

  } // ends return

} // ends export



PUTdocument = function (res, collectionQuery, clientQuery){
	model.findOneAndUpdate( collectionQuery, {
		$set: clientQuery//req.body[key]
	}, function (e, s){
		if (s){

			console.log('-> '+JSON.stringify(clientQuery)+' PUT to '+JSON.stringify(collectionQuery));
			res.send(true);

		} else {
		
			console.log('-> '+JSON.stringify(clientQuery)+' NOT PUT to '+JSON.stringify(collectionQuery));
			res.send(false);

		}
	});
}


exports.updateCourse = function( ) {

  return function ( req, res, next ){


  // exported from:
  // 	app.post(  root+'/:course_id/:resource' )

  // Read in the params and client query 	
	var params = req.params;
	var clientQuery = req.query;


  // BUILD THE QUERY FOR THE COLLECTION
  //	Note: the collection identifier (/:collection_id/) == param_keys[0]
	var collectionQuery = {};
	var collection_keys = Object.keys(params);
	collectionQuery[collection_keys[0]] = parseInt(params[collection_keys[0]]);
	//   Note: parseInt() called for the collection query id

/*
	console.log(params);
	console.log(clientQuery);
	console.log(collectionQuery);
*/


// business logic
	// not allowed to modify students from here
	if ( (clientQuery.students == null) ) {

	// update db - post the student to the course
		PUTdocument(res, collectionQuery, clientQuery);

	} else {

	    console.log("-> restricted key");
		res.send(false);

	}

  }; // ends return

}; // ends exports.updateCourse


exports.removeCourse = function () {
    return function(req, res, next) {


		// local variable to save the query
		var collectionQuery = req.query;//.toUpperCase();

		
		model.findOne( collectionQuery, function ( err, destroy_model ){
			var user_id = req.cookies ?
			   req.cookies.user_id : undefined;

			// if the course does exist, then delete it
			if (destroy_model != null) {

				destroy_model.remove( function ( err, destroy_model ){

				  	if (destroy_model) {
						console.log('-> '+JSON.stringify(collectionQuery)+' DELETED');

					  	// redis message
							var ri_message = {
								'sender' : 'courses_micro_service',
								'service_action' : 'delete course',
								'course_id': collectionQuery.course_id
							};
		
							var message = JSON.stringify(ri_message).toLowerCase();
							clientRI.publish(pub_channel, message);
						
						res.send(true);

					// there was an error deleting
					} else {
						console.log('-> '+JSON.stringify(collectionQuery)+' NOT DELETED');
						res.send(false);
					}

				}); // ends .remove()
			
			// if the course does not exist, then return an error
			} else {

				console.log("-> Query NOT found : "+JSON.stringify(collectionQuery));
				res.send(false);

			}; // ends else
				
		}); // ends findOne

    }; // ends return

}; // ends remove course




