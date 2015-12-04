var utils    = require( '../../utils' );

// require the database, which has already been connected
var requireDB = require('../schemas/courses_db.js');
var courses_db = requireDB.getdb;
var courses_model = requireDB.getModel;
 
var model = courses_db.model('courses_model');


var root = '/courses/';




exports.removeStudent = function( ) {

  return function ( req, res, next ){

  try {

	var students_request = req.body;
	var uni = students_request.uni.toUpperCase();

	// First find the course in the db model
	  model.find({}, function(err, course_found){

	// If the course exists, check student entries to make sure no duplicate exists

		course_found.forEach( 

		  function( coursedata ) {

			coursedata.collection.aggregate( [
				{"$match"	: {course_id : parseInt(coursedata.course_id) } }
				,{"$unwind"	: "$students" }
				,{"$match"	: {"students.uni" : uni} }
				//,{"$match"	: {"students.firstname": firstname} }
			],
				function (err_lastname, student_found){

				// If the entry already exists
					if (student_found.length > 0 ) {

					// pull (remove) the student from the student collection withing the course 
						coursedata.update(  {
							$pull: {
								students: {	
									uni : uni
									//lastname: lastname,
									//firstname: firstname
								}
							} // ends $pull
						}, function (e, s){
							if (s){
								console.log('-> '+uni+' removed from '+coursedata.name);
								//res.send(true);
							} else {
								console.log('-> Error removing '+uni+' from '+coursedata.name+'.');
								//res.send(false);
							}
						});


				// If the student entry does not exist
					} else	{		

						console.log('-> '+uni+' does not exist in '+coursedata.name+'.');
						//res.send(false);

					};
			}); // ends collection.aggregate

		}); // ends .forEach()

		res.send(true);

	 }); // ends model.findOne

  } catch (e){
	console.log(e);
	res.send(false);
  }

  }; // ends return

}; // ends exports.updateCourse





exports.removeStudentFromCourse = function( ) {

  return function ( req, res, next ){

  try {

	// local variable to store the course name, which comes from the url /courses/<coursename>
	var course_id = req.params.course_id;
	var students_request = req.body;
	var uni = students_request.uni.toUpperCase();


	// First find the course in the db model
	  model.findOne({course_id: course_id}, function(err, course_found){

	// If the course exists, check student entries to make sure no duplicate exists
		if (course_found) { 
			course_found.collection.aggregate([
				{"$match"	: {course_id : parseInt(course_id)} }
				,{"$unwind"	: "$students" }
				,{"$match"	: {"students.uni" : uni} }
			],
				function (err_lastname, student_found){

			// If the entry already exists
					if (student_found.length > 0 ) {

					// pull (remove) the student from the student collection withing the course 
						model.findOneAndUpdate( {course_id:course_id}, {
							$pull: {
								students: {	
									uni : uni
								}
							} // ends $pull
						}, function (e, s){
							if (s){
								console.log('-> '+uni+' removed from '+course_found.name);
								res.send(true);
							} else {
								console.log('-> Error removing '+uni+' from '+course_found.name+'.');
								res.send(false);
							}
						});

			// If the student entry does not exist
					} else	{		

						console.log('-> '+uni+' does not exist in '+course_found.name+'.');
						res.send(false);

					};
			}); // ends collection.aggregate

	// If the course does not exist
		} else {

			console.log('-> course_id:'+course_id+' doesnt exist.');
			res.send(false);

		}; // ends else

	 }); // ends model.findOne

  } catch(e) {
	console.log(e);
	res.send(false);
  }

  }; // ends return

}; // ends exports.updateCourse








exports.removeCourse = function () {
    return function(req, res, next) {

	  try{

		// local variable to save the query
		var course_id = req.query.course_id;//.toUpperCase();

		model.findOne( {course_id: course_id}, function ( err, destroy_model ){
			var user_id = req.cookies ?
			   req.cookies.user_id : undefined;

			// if the course does exist, then delete it
			if (destroy_model != null) {

				destroy_model.remove( function ( err, destroy_model ){

				  	if (destroy_model) {
						console.log('-> course_id:'+course_id+' removed');
						res.send(true);

					// there was an error deleting
					} else {
						console.log("-> Error deleting course_id:"+course_id);
						res.send(false);
					}

				}); // ends .remove()
			
			// if the course does not exist, then return an error
			} else {

				console.log("-> "+course_id+" cannot be removed because it does not exist");
				res.send(false);

			}; // ends else
				
		}); // ends findOne

	  } catch (e){
		console.log(e);
	  }

    }; // ends return

}; // ends remove course






