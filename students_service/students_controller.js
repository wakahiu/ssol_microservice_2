'use strict';

var redis = require("redis");
var http = require('http');

var service_name = "students_micro_service";

clientRISub = redis.createClient();	// Subscribes to ri channel
clientRIPub = redis.createClient(); // Publishes to ri channel


clientRISub.subscribe(service_name);

var pub_channel = "referential_integrity";

var _ = require('lodash');
var required_keys = ['first_name', 'last_name', 'uni'];
var no_delete_keys = ['first_name', 'last_name', 'uni', 'courses'];
var host = 'localhost';

clientRIPub = redis.createClient(); // Publishes to ri channel

exports.find = function(req, res, next) {
	const db = req.app.locals.db;
	var collection = db.collection('Students');
	var params = req.query;
	collection.findAsync(params).then(function(cursor) {
			return cursor.toArrayAsync();
		})
	.then(function(content) {
			res.json(content);
		})
};

exports.create = function(req, res, next) {
	const db = req.app.locals.db;
	var collection = db.collection('Students');
	var params = req.body;
	console.log(params);
	var param_keys = Object.keys(params);

	// Set error responses for invalid parameters
	

	// Check if any extraneous parameters not in line with schema
	collection.findOneAsync({}).then(function(content) {
		return Object.keys(content)
	}).then(function(schema_keys) {
		var valid = true;
		_(param_keys).forEach(function(key) {
			if (_.indexOf(schema_keys, key) == -1) {
				valid = false;
			}
		});

		if (!valid ||
			_.intersection(param_keys, required_keys).length != required_keys.length) {
			var err = new Error('Request parameters invalid');
			err.status = 400;
			next(err);
		} else { // All parameters okay

			//UNI's should be unique
			collection.findAsync({uni: params.uni}).then(function(cursor) { 
				return cursor.countAsync();
			}).then(function(count) {
				// If uni provided is not unique
				if (count > 0) {
					var err = new Error('Provided UNI must be unique');
					err.status = 400;
					next(err);
				} else { // All parameters valid
					// Add missing fields not specified in the parameter, associated with null
					var missing_fields = _.difference(schema_keys, param_keys);
					_(missing_fields).forEach(function(field) {
						params[field] = null;
					});

					collection.insertOne(params, function(error, result) {
						console.log(error);
						if (error === null ) {
							res.sendStatus(200);
						} else {
							var err = new Error('Database error');
							err.status = 500;
							next(err);
						}
					});
				}
			});
		}
	});
};

exports.show = function(req, res, next) {
	var db = req.app.locals.db;
	var collection = db.collection('Students');
	var uni_param = req.params.uni;
	collection.findOneAsync({uni: uni_param})
	.then(function(content) {
			if (content == null) {
				var err = new Error('Specified student not found. Uni: ' + JSON.stringify(req.params));
				err.status = 404;
				next(err);
			} else {
				res.json(content);
			}
		})
};

exports.remove = function(req, res, next) {
	var db = req.app.locals.db;
	var collection = db.collection('Students');
	var uni_param = req.params.uni;

	collection.findOneAsync({uni: uni_param})
	.then(function(content) {
		console.log(content);
			if (content == null) {
				var err = new Error('Specified student not found');
				err.status = 404;
				next(err);
			} else {
				collection.deleteOne({uni: uni_param}, null, 
					function(error, result) {
						if (error == null) {
							res.sendStatus(200);

							//  Publishing to referential integrity channel the event
							var event_message = {
								'sender' : 'students_micro_service',
								'service_action' : 'delete student',
								'uni': uni_param }
							clientRIPub.publish(pub_channel, JSON.stringify(event_message));
						} else {
							var err = new Error('Database error');
							err.status = 500;
							next(err);
						}
				});
			}
	});
};

exports.add_attribute = function(req, res, next) {
	var db = req.app.locals.db;
	var collection = db.collection('Students');
	var attribute = req.body.attribute.toLowerCase();

	if (attribute === undefined) {
		var err = new Error('Must specify attribute');
		err.status = 400;
		next(err);
	} else {
		// Check is attribute already exists
		collection.findOneAsync({}).then(function(content) {
			return Object.keys(content)
		}).then(function(schema_attributes) {
			// If attribute already existing, send error
			if (_.indexOf(schema_attributes, attribute) >= 0) {
				var err = new Error('Attribute already exists');
				err.status = 400;
				next(err);
			} else {
				var query = {};
				query[attribute] = null;
				collection.updateMany({$isolated:1},
															{$set: query}, function(error, result) {
																if (error === null) {
																	res.sendStatus(200);
																} else {
																	var err = new Error('Database error');
																	err.status = 500;
																	next(err);
																}
															});
			}
		});
	}
};

exports.remove_attribute = function(req, res, next) {
	var db = req.app.locals.db;
	var collection = db.collection('Students');
	var attribute = req.body.attribute.toLowerCase();

	if (attribute === undefined) {
		var err = new Error('Must specify attribute');
		err.status = 400;
		next(err);
	} else {
		// Check is attribute already exists
		collection.findOneAsync({}).then(function(content) {
			return Object.keys(content)
		}).then(function(schema_attributes) {
			// If attribute does not exist, send error
			if (_.indexOf(schema_attributes, attribute) == -1) {
				var err = new Error('Specified attribute does not exist');
				err.status = 400;
				next(err);
			} else if (_.indexOf(no_delete_keys, attribute) >= 0) {
				var err = new Error('Specified attribute cannot be deleted');
				err.status = 403;
				next(err);
			} else {
				var query = {};
				query[attribute] = null;
				collection.updateMany({$isolated:1},
															{$unset: query}, function(error, result) {
																if (error === null) {
																	res.sendStatus(200);
																} else {
																	var err = new Error('Database error');
																	err.status = 500;
																	next(err);
																}
															});
			}
		});
	}
};


exports.add_course = function(req, res, next) {
	var db = req.app.locals.db;
	var collection = db.collection('Students');
	var ss_collection = db.collection('Students_courselist_snapshot');
	var course_id = req.body.course_id;
	var uni_param = req.params.uni;
 
	if (course_id === undefined) {
		var err = new Error('Must specify course_id to add ' + uni_param );
		err.status = 400;
		next(err);
	} else {
		var callNumber = parseInt(course_id);
		if (isNaN(callNumber)) {
			var err = new Error('Invalid call number');
			err.status = 400;
			next(err);
		} else {
			collection.findOneAsync({uni: uni_param})
			.then(function(student) {
				if (student == null) {
					var err = new Error('Specified student not found : ' + uni_param);
					err.status = 404;
					next(err);
				} else {
					var courseList = student.courses;
					
					// If courses list does not exist, initialize empty array
					if (courseList == null) {
						courseList = [];
					}

					if (_.indexOf(courseList, callNumber) != -1) {
						var err = new Error('Student '+ uni_param +' is already registered for course_id '+ callNumber);
						err.status = 400;
						next(err);
					} else {
						var date = new Date();
						var datetime = date.toISOString().toLowerCase();
						var ss_params = {
							datetime : datetime,
							uni : uni_param,
							courseList : courseList
						}



						ss_collection.insert(ss_params, function(error, result) {

							if (error !== null ) {
								var err = new Error('Snapshot database error');
								err.status = 500;
								next(err);
							} else {
								var old_courses = courseList;
								courseList.push(callNumber);
								collection.updateOne({_id: student._id},
																		 {$set: {courses: courseList}}, 
																		 function(error, result) {
																		 	if (error === null) {
																				res.sendStatus(200); //Handle failure - Harry/Peter N

																				//  Publishing to referential integrity channel the event
																				var event_message = {
																					'sender' : 'students_micro_service',
																					'service_action' : 'update course add student',
																					'course_id': course_id,
																					'uni': uni_param,
																					'datetime' : datetime,
																					'courseList' : courseList
																				}
																				clientRIPub.publish(pub_channel, JSON.stringify(event_message));
																			} else {
																				var err = new Error('Database error');
																				err.status = 500;
																				next(err);
																			}
																		 });
							}
						});
					}
				}
			});
		}
	}
};

exports.remove_course = function(req, res, next) {
	var db = req.app.locals.db;
	var collection = db.collection('Students');
	var course_id = req.body.course_id;
	var uni_param = req.params.uni;

	if (course_id === undefined) {
		var err = new Error('Must specify course_id to remove');
		err.status = 400;
		next(err);
	} else {
		var callNumber = parseInt(course_id);
		if (isNaN(callNumber)) {
			var err = new Error('Invalid call number');
			err.status = 400;
			next(err);
		} else {
			collection.findOneAsync({uni: uni_param})
			.then(function(student) {
				if (student == null) {
					var err = new Error('Specified student not found');
					err.status = 404;
					next(err);
				} else {
					var courseList = student.courses;
					var index;
					if (courseList == null || 
							(index = _.indexOf(courseList, callNumber)) == -1) {
						var err = new Error('Student is not registered for course_id specified');
						err.status = 400;
						next(err);
					} else {
						var removed = courseList.splice(index, 1);
						collection.updateOne({_id: student._id},
																 {$set: {courses: courseList}}, 
																 function(error, result) {
																 	if (error === null) {
																		res.sendStatus(200);
																		//  Publishing to referential integrity channel the event

																		var event_message = {
																			'sender' : 'students_micro_service',
																			'service_action' : 'update course delete student',
																			'course_id': course_id,
																			'uni': uni_param}
																		clientRIPub.publish(pub_channel, JSON.stringify(event_message));

																	} else {
																		var err = new Error('Database error');
																		err.status = 500;
																		next(err);
																	}
																 });
					}
				}
			});
		}
	}
};

exports.update = function(req, res, next) {
	var db = req.app.locals.db;
	var collection = db.collection('Students');
	var uni_param = req.params.uni;
	var params = req.body;
	var param_keys = Object.keys(params);

	collection.findOneAsync({uni: uni_param})
	.then(function(student) {
			if (student == null) {
				var err = new Error('Specified student not found');
				err.status = 404;
				next(err);
			} else {
					collection.findOneAsync({}).then(function(content) {
						return Object.keys(content)
					}).then(function(schema_keys) {
						var valid = true;
						var contains_uni = false;
						_(param_keys).forEach(function(key) {
							// Disallow changing courses through this endpoint
							if (key == "courses" ||  _.indexOf(schema_keys, key) == -1) {
								valid = false;
							}
							if (key == "uni") {
								contains_uni = true;
							}
						});

						if (!valid) {
							var err = new Error('Specified attribute(s) are not valid');
							err.status = 400;
							next(err);
						} else {
							var updateContent = {};
							_(param_keys).forEach(function(key) {
								updateContent[key] = params[key];
							});

							if (contains_uni) {
									collection.findOneAsync({uni: params["uni"]}).then(function(result) {
											if (result != null && result._id != student._id) {
												var err = new Error('UNI must be unique');
												err.status = 400;
												next(err);
											} else {
												collection.updateOne({_id: student._id},
																						 {$set: updateContent}, 
																						 function(error, result) {
																						 	if (error === null) {
																								res.sendStatus(200);
																							} else {
																								var err = new Error('Database error');
																								err.status = 500;
																								next(err);
																							}
																						 });
											}
									});
								} else {
									collection.updateOne({_id: student._id},
																			 {$set: updateContent}, 
																			 function(error, result) {
																			 	if (error === null) {
																					res.sendStatus(200);
																				} else {
																					var err = new Error('Database error');
																					err.status = 500;
																					next(err);
																				}
																			 });
						}
					}
			});

		}
	});
};

exports.ref_add_course = function(callNumber, uni_param, app, callback) {
	console.log("In ref_add_course");

	var db = app.locals.db;
	var collection = db.collection('Students');

	collection.findOneAsync({uni: uni_param})
	.then(function(student) {
		if (student == null) {
			var err = new Error('Specified student not found |' + uni_param);
			err.status = 404;
			callback(err);
		} else {
			var courseList = student.courses;
			
			// If courses list does not exist, initialize empty array
			if (courseList == null) {
				courseList = [];
			}

			if (_.indexOf(courseList, callNumber) != -1) {
				var err = new Error('Student is already registered for course specified');
				err.status = 400;
				callback(err);
			} else {
				courseList.push(callNumber);
				collection.updateOne({_id: student._id},
														 {$set: {courses: courseList}}, 
														 function(error, result) {
														 	if (error === null) {
														 		callback(null);
															} else {
																var err = new Error('Database error');
																err.status = 500;
																callback(err);
															}
														 });

				}
			}
		});
};

exports.ref_remove_course = function(callNumber, uni_param, app, callback) {
	var db = app.locals.db;
	var collection = db.collection('Students');

	collection.findOneAsync({uni: uni_param})
	.then(function(student) {
		if (student == null) {
			var err = new Error('Specified student not found');
			err.status = 404;
			callback(err);
		} else {
			var courseList = student.courses;
			var index;
			if (courseList == null || 
					(index = _.indexOf(courseList, callNumber)) == -1) {
				var err = new Error('Student is not registered for course specified');
				err.status = 400;
				callback(err);
			} else {
				var removed = courseList.splice(index, 1);
				collection.updateOne({_id: student._id},
														 {$set: {courses: courseList}}, 
														 function(error, result) {
														 	if (error === null) {
														 		callback(null);
															} else {
																var err = new Error('Database error');
																err.status = 500;
																callback(err);
															}
														 });
				}
			}
	});
};

exports.ref_remove_course_on_all_students = function(callNumber, app, callback) {
	var db = app.locals.db;
	var collection = db.collection('Students');

	collection.updateMany({$isolated:1},
												{$pull: {courses: callNumber}}, function(error, result) {
													if (error === null) {
														callback(null);
													} else {
														var err = new Error('Database error');
														err.status = 500;
														callback(err);
													}
												});
};


exports.ref_rollback_course = function(app, message, callback) {

	var obj = JSON.parse(message);
	var uni_param = obj.uni.toLowerCase();
	var datetime_param = obj.datetime;

	var db = app.locals.db;
	var collection = db.collection('Students');
	var ss_collection = db.collection('Students_courselist_snapshot');

	ss_collection.findOne({uni: uni_param, datetime: datetime_param})
	.then(function(student) {


		console.log("In findOneAsync! " + message);

		if (student == null) {
			var err = new Error('Specified datetime not found ' + datetime_param);
			console.log(err);
			err.status = 404;
			callback(err);
		} else {
			var courseList = student.courseList;
			if (courseList == null) {
				var err = new Error('Specified datetime not found ' + datetime_param);
				err.status = 400;
				callback(err);
			} else {
				collection.updateOne({uni: uni_param},
														 {$set: {courses: courseList}}, 
														 function(error, result) {
														 	if (error === null) {
														 		callback(null);
															} else {
																var err = new Error('Database error');
																err.status = 500;
																callback(err);
															}
														 });
				}
			}
	});
};





