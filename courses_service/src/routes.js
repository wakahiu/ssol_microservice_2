

// require the database, which has already been connected
var requireDB = require('./schemas/courses_db.js');
var courses_db = requireDB.getdb;
var courses_model = requireDB.getModel;
 
var model = courses_db.model('courses_model');


// require redis
var redis = require("redis")
clientRISub = redis.createClient(); // Subscribes to ri channel
var subChannel = "courses_micro_service";
clientRISub.subscribe(subChannel);
clientRISub.on("subscribe", function (channel, count) {
    console.log("Subscribed to " + channel + " channel.")
});



// ROUTER
module.exports = function(app){


	// ROUTING FOR COURSES
	var schema_controller = require('./routes_controllers/schema_controller');
	var update_controller = require('./routes_controllers/update_controller');


	var root = '/courses';

	// create
	app.post( root,    								schema_controller.createCourse() );

	// read
	app.get(  root,		            				update_controller.returnCourseInfo() );

	// schema changes
	app.post( root+'/schema',    					schema_controller.addKEY() );
	app.delete( root+'/schema',    					schema_controller.deleteKEY() );

	// update
	app.put(  root+'/:course_id',					update_controller.updateCourse() );
	app.post(  root+'/:course_id/:resource',		update_controller.addStudentToCourse() );

	// delete 
	app.delete(  root, 								update_controller.removeCourse() ); 
	app.delete( root + '/:course_id/:resource' ,	update_controller.removeStudentFromCourse() );
	app.delete( root + '/:resource',				update_controller.removeStudent() );




    clientRISub.on("message", function (channel, message) { // Listens for referential integrity channel JSON messgages
        console.log("Channel name: " + channel);
        console.log("Message: " + message);
        
        //Switch statement for three RI cases
        var obj = JSON.parse(message);
        var uni = obj.uni.toLowerCase();

	/* Message takes the following form
		sender:
		service_action:
		course_name: (the ID number)
		uni:
	*/


		// BUILD the arguments for switch/case functions
            var res = {}, 
				//params = {}, 
				//collectionQuery, 
				resource = "students";
				//resourceQuery, 
				//clientQuery;

			var params = obj;
			params['resource'] = resource;
			
		  // BUILD THE QUERY FOR THE COLLECTION
		  //	Note: the collection identifier (/:collection_id/) == param_keys[0]
			var collectionQuery = {};
			var collection_keys = Object.keys(params);
			collectionQuery['course_id'] = parseInt(obj.course_id);

			//   Note: parseInt() called for the collection query id

			var clientQuery = {};
			clientQuery['uni'] = uni;

		  // BUILD THE QUERY for the RESOURCE -- for Mongo's collection.aggregation function
			var resourceQuery = {};
			var query_keys = Object.keys(clientQuery);
			for (var i = 0; i < query_keys.length; i++){
				resourceQuery[resource+"."+query_keys[i]] = clientQuery[query_keys[i]];
			}	


			console.log("\n RI Channel Debugger");
			console.log(res);
			console.log(params);
			console.log(collectionQuery);
			console.log(resource);
			console.log(resourceQuery);
			console.log(clientQuery);
			console.log("");

			var resmode = false; // disables sending a response to the client
			
        switch (obj.service_action) {
            case "update course add student":
            update_controller.POSTresource(model, res, params, collectionQuery, resource, resourceQuery, clientQuery, resmode, 
				function (err) {	
                    if (err != null) {
                        //error handling
                    } else {
                        //handle correct case
                    }
                });
                break;

            case "update course delete student":
            update_controller.DELETEresource(model, res, params, collectionQuery, resource, resourceQuery, clientQuery, resmode, 
				function(err) {	
                    if (err != null) {
                        //error handling
                    } else {
                        //handle correct case
                    }
                });
                break;

            case "delete student":
            update_controller.DELETEresourceFromAll(model, res, params, collectionQuery, resource, resourceQuery, clientQuery,resmode, 
				function(err) {
                
                    if (err != null) {
                        //error handling
                    } else {
                        //handle correct case
                    }
                });
                break;
               
        }
    });  






};
