var utils    = require( '../../utils' );

// require the database, which has already been connected
var requireDB = require('../schemas/courses_db.js');
var courses_db = requireDB.getdb;
var courses_model = requireDB.getModel;
 
var model = courses_db.model('courses_model');


var root = '/courses/';



// GET course info based on the client's query
exports.returnCourseInfo = function () {
	// need this return syntax because we are passing io from app.js
	return function(req, res, next ){


  // Read in the client query 	
	var clientQuery = req.query;

/*
	console.log(clientQuery);
*/


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
