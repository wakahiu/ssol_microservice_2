var aws = require( "aws-sdk" );
var Q = require( "q" );
var chalk = require( "chalk" );
var config = require( "../config.json" );
var _ = require('lodash');

aws.config.update({
	region: config.aws.region,
	accessKeyId: config.aws.accessID,
	secretAccessKey: config.aws.secretKey,
});
var dynamodbDoc = new aws.DynamoDB.DocumentClient();
var table = config.table;
var schema_table = config.schema_table;

exports.echoMessage = function (incoming){

	console.log("\nfunction controller.echoMessage(incoming):");
		//console.log(incoming)
		console.log("Parsed Message:")
		console.log("\t"+incoming.Header.OP)
		console.log("\t"+incoming.Header.ResQ)
		console.log("\t"+incoming.Header.ID)
		console.log("\t"+incoming.Header.CID)
		console.log("\t"+incoming.Body)

	// echo the same message back to the client
	ResponseMessageTo(incoming.Header.ResQ, incoming)
}

// TODO: (Peter) Scan all if ID not specified?
exports.GEThandler = function (incoming) {

	var response = {};
	var header = {};
	var message = {};

	header['CID'] = incoming.Header.CID;
	response['Header'] = header;

	var schema_params = {
		TableName : schema_table,
		KeyConditionExpression: "#key = :value",
		ExpressionAttributeNames:{
			"#key": "table_name"
		},
		ExpressionAttributeValues: {
			":value":"micro"
		}
	};

	// Fetch schema first
	dynamodbDoc.query(schema_params, function(err, data) {
		if (err) {
			console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
			message = JSON.stringify(err, null, 2);
			response['Body'] = message;
			response['Code'] = '500 Internal Server Error';
			ResponseMessageTo(incoming.Header.ResQ, response);
		} else {
			console.log("Schema query succeeded.");
			if (data.Count == 0) {
				console.log("Troubleshoot: Schema not found!");
				var message = "Internal server error";
				response['Body'] = message;
				response['Code'] = '500';
			} else {
				var schema = data.Items[0].attributes.values;
				if (incoming.Body.id !== undefined) {
					var params = {
						TableName : table,
						KeyConditionExpression : "#key = :value",
						ExpressionAttributeNames:{
							"#key": "id"
						},
						ExpressionAttributeValues: {
							":value":incoming.Body.id
						}
					};

					console.log("troubleshoot body id: " + incoming.Body.id);

					dynamodbDoc.query(params, function(err, data) {
						if (err) {
							console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
							message = JSON.stringify(err, null, 2);
							response['Body'] = message;
							response['Code'] = '500 Internal Server Error';
							ResponseMessageTo(incoming.Header.ResQ, response);
						} else {
							console.log("Query succeeded.");
							var returnObj = data;
							if(data.Count == 0) {
								console.log("Troubleshoot: Item not found!");
								returnObj.Message = "Not Found: Item not found!";
								message = JSON.stringify(returnObj);
								response['Body'] = message;
								response['Code'] = '404';
							} else {
								var items = data.Items;
								_(items).forEach(function(item) {

									// Add schema fields that do not exist
									_(schema).forEach(function(key) {
										if (item[key] == undefined) {
											item[key] = null;
										}
									});

									// Remove outdated attributes not in schema
									var attributes = Object.keys(item);
									_(attributes).forEach(function(attribute) {
										if (_.indexOf(schema, attribute) == -1) {
											delete item[attribute];
										}
									});
								});
								data.Items = items;
								returnObj.Message = "OK: Found " + data.Items.length + " Items";
								message = JSON.stringify(returnObj);
								response['Body'] = message;
								response['Code'] = '200';
							}

							ResponseMessageTo(incoming.Header.ResQ, response);
						}
					});
				} else {
					var query_fields = Object.keys(incoming.Body);
					var expression = "";
					var attribute_names = {};
					var attribute_values = {};

					//construct query
					for (var i = 0; i < query_fields.length; i++)  {
						var name = "#" + query_fields[i];
						var value = ":" + query_fields[i];

						// Do not include duplicate params
						if (attribute_names[name] == undefined) {
							attribute_names[name] = query_fields[i];
							attribute_values[value] = incoming.Body[query_fields[i]];
						}

						//construct expression
						expression += name + " = " +  value;

						//if not last element
						if (i < query_fields.length - 1) 
							expression += " AND ";
					}

					var params = {
						TableName : table,
						Select: "ALL_ATTRIBUTES"
					}

					if (Object.keys(attribute_names).length > 0) {
						params["FilterExpression"] =  expression;
						params["ExpressionAttributeNames"] = attribute_names;
						params["ExpressionAttributeValues"] = attribute_values;
					};

					dynamodbDoc.scan(params, function(err, data) {
						if (err) {
							console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
							message = JSON.stringify(err, null, 2);
							response['Body'] = message;
							response['Code'] = '500 Internal Server Error';
							ResponseMessageTo(incoming.Header.ResQ, response);
						} else {
							console.log("Query succeeded.");
							var returnObj = data;
							if (data.Count == 0) {
								console.log("Troubleshoot: Item not found!");
								returnObj.Message = "Not Found: Item not found!";
								message = JSON.stringify(returnObj);
								response['Body'] = message;
								response['Code'] = '404';
							}

							else {
								var items = data.Items;
								_(items).forEach(function(item) {

									// Add schema fields that do not exist
									_(schema).forEach(function(key) {
										if (item[key] == undefined) {
											item[key] = null;
										}
									});

									// Remove outdated attributes not in schema
									var attributes = Object.keys(item);
									_(attributes).forEach(function(attribute) {
										if (_.indexOf(schema, attribute) == -1) {
											delete item[attribute];
										}
									});
								});
								data.Items = items;
								returnObj.Message = "OK: Found " + data.Items.length + " Items";
								message = JSON.stringify(returnObj);
								console.log("returnObj: " + message);
								response['Body'] = message;
								response['Code'] = '200';
							}

							ResponseMessageTo(incoming.Header.ResQ, response);
						}
					});
				}
			}
		}
	});
}

exports.POSThandler = function(incoming) {
	var schema = incoming.Header.SCHEMA_ACTION;
	var response = {};
	var header = {};
	var message = {};

	if (schema == undefined || schema == null) {
		message['Message'] = 'Bad Request: undefined SCHEMA_ACTION';
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	} else if (schema){
		addAttribute(incoming);
	} else {
		createStudent(incoming);
	} 
}

var addAttribute = function(incoming) {
	var response = {};
	var header = {};
	var message = {};

	header['CID'] = incoming.Header.CID;
	response['Header'] = header;

	var attribute = incoming.Body.attribute;
	if (attribute == undefined) {
		message = "Bad Request: undefined body field \'attribute\'";
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	}

	var schema_params = {
		TableName : schema_table,
		KeyConditionExpression: "#key = :value",
		ExpressionAttributeNames:{
			"#key": "table_name"
		},
		ExpressionAttributeValues: {
			":value":"micro"
		}
	};

	dynamodbDoc.query(schema_params, function(err, data) {
		if (err) {
			console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
			message = JSON.stringify(err, null, 2);
			response['Body'] = message;
			response['Code'] = '500 Internal Server Error';
			ResponseMessageTo(incoming.Header.ResQ, response);
		} else {
			console.log("Schema query succeeded.");
			if (data.Count == 0) {
				console.log("Troubleshoot: Schema not found!");
				var message = "Internal server error";
				response['Body'] = message;
				response['Code'] = '500';
			} else {
				var schema = data.Items[0].attributes.values;
				if (_.indexOf(schema, attribute) >= 0) {
					message = "Bad Request: Attribute specified already exists";
					response['Body'] = message;
					response['Code'] = '400';
					ResponseMessageTo(incoming.Header.ResQ, response);
					return;
				} else {
					data.Items[0].attributes.values.push(attribute);
					var params = {
						TableName: schema_table,
						Item: data.Items[0]
					};
					dynamodbDoc.put(params, function(err, dataToPut) {
						if (err) {
							console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
							message['Message'] = "Internal Server Error: " + JSON.stringify(err, null, 2);
							response['Body'] = message;
							response['Code'] = '500';

							ResponseMessageTo(incoming.Header.ResQ, response);
						} else {
							console.log("Added item:", JSON.stringify(dataToPut, null, 2));
							message = 'OK: Schema attribute succesfully created';
							response['Body'] = message;
							response['Code'] = '201';
							ResponseMessageTo(incoming.Header.ResQ, response);
						}

					});
				}
			}
		}
	}); 

}

var createStudent = function (incoming){
	var response = {};
	var header = {};
	var message = {};

	header['CID'] = incoming.Header.CID;
	response['Header'] = header;

	var params = {
		TableName : table,
		Item : incoming.Body
	};

	if (incoming.Body.id == undefined) {
		message['Message'] = 'Bad Request: undefined id';
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	} else if (incoming.Body.firstname == undefined) {
		message['Message'] = 'Bad Request: undefined firstname';
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	} else if (incoming.Body.lastname == undefined) {
		message['Message'] = 'Bad Request: undefined lastname';
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	}

	//console.log(Object.keys(incoming.Body));

	//console.log(incoming.Body == {});
	//console.log(params);

	var queryParams = {
		TableName : table,
		KeyConditionExpression: "#key = :value",
		ExpressionAttributeNames:{
			"#key": "id"
		},
		ExpressionAttributeValues: {
			":value":incoming.Body.id
		}
	};

	dynamodbDoc.query(queryParams, function(err, data) {
		if (err) {
			console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
			message['Message'] = JSON.stringify(err, null, 2);
			response['Body'] = message;
			response['Code'] = '500 Internal Server Error';
			ResponseMessageTo(incoming.Header.ResQ, response);
		} else {
			if(data.Count == 0) {

				var schema_params = {
					TableName : schema_table,
					KeyConditionExpression: "#key = :value",
					ExpressionAttributeNames:{
						"#key": "table_name"
					},
					ExpressionAttributeValues: {
						":value":"micro"
					}
				};
				
				// Fetch schema first
				dynamodbDoc.query(schema_params, function(err, data) {
					if (err) {
						console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
						message = JSON.stringify(err, null, 2);
						response['Body'] = message;
						response['Code'] = '500 Internal Server Error';
						ResponseMessageTo(incoming.Header.ResQ, response);
					} else {
						console.log("Schema query succeeded.");
						if (data.Count == 0) {
							console.log("Troubleshoot: Schema not found!");
							var message = "Internal server error";
							response['Body'] = message;
							response['Code'] = '500';
						} else {

							//Check if any attribute specified not part of schema
							var valid = true;
							var schema = data.Items[0].attributes.values;
							var param_keys = Object.keys(incoming.Body);
							
							_(param_keys).forEach(function(key) {
								if (_.indexOf(schema, key) == -1) {
									console.log(key);
									console.log(schema);
									valid = false;
								}
							});

							if (!valid) {
								message = 'Bad Request: invalid attribute included';
								response['Body'] = message;
								response['Code'] = '400';
								ResponseMessageTo(incoming.Header.ResQ, response);
								return;
							} 

							dynamodbDoc.put(params, function(err, dataToPut) {
								if (err) {
									console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
									message = JSON.stringify(err, null, 2);
									response['Body'] = message;

									//response['Code'] = '400 Bad Request';
									response['Code'] = '500 Internal Server Error';

									ResponseMessageTo(incoming.Header.ResQ, response);
								} else {
									var returnObj = incoming.Body;
									console.log("Added item:", JSON.stringify(dataToPut, null, 2));
									returnObj.Message = "OK: Student successfully added";
									message = JSON.stringify(returnObj);
									response['Body'] = message;
									response['Code'] = '201';
									ResponseMessageTo(incoming.Header.ResQ, response);
								}
							});
						}
					}
				});
			} else {
				message['Message'] = "Bad Request: Student with id " + incoming.Body.id + " already exists";
				response['Body'] = message;

				//response['Code'] = '400 Bad Request';
				response['Code'] = '400';

				ResponseMessageTo(incoming.Header.ResQ, response);
			}
		}
	});
	
	console.log("Adding a new item...");
}

// TODO: Should entries be updated one at a time. (Jivtesh ask T.A.)
exports.PUThandler = function (incoming){
	var response = {};
	var header = {};
	var message = {};

	header['CID'] = incoming.Header.CID;
	response['Header'] = header;

	var params = {
		TableName:table,
		Item:incoming.Body
	};

	if (incoming.Body.id == undefined) {
		message['Message'] = 'Bad Request: undefined id';
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	}

	var queryParams = {
		TableName : table,
		KeyConditionExpression: "#key = :value",
		ExpressionAttributeNames:{
			"#key": "id"
		},
		ExpressionAttributeValues: {
			":value":incoming.Body.id
		}
	};

	dynamodbDoc.query(queryParams, function(err, data) {
		if (err) {
			console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
			message['Message'] = "Internal Server Error: " + JSON.stringify(err, null, 2);
			response['Body'] = message;
			response['Code'] = '500';
			ResponseMessageTo(incoming.Header.ResQ, response);
		} else {
			if(data.Count == 1) {

				var schema_params = {
					TableName : schema_table,
					KeyConditionExpression: "#key = :value",
					ExpressionAttributeNames:{
						"#key": "table_name"
					},
					ExpressionAttributeValues: {
						":value":"micro"
					}
				};

				// Fetch schema first
				dynamodbDoc.query(schema_params, function(err, data) {
					if (err) {
						console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
						message = "Internal Server Error: " + JSON.stringify(err, null, 2);
						response['Body'] = message;
						response['Code'] = '500';
						ResponseMessageTo(incoming.Header.ResQ, response);
					} else {
						console.log("Schema query succeeded.");
						if (data.Count == 0) {
							console.log("Troubleshoot: Schema not found!");
							var message = "Internal server error";
							response['Body'] = message;
							response['Code'] = '500';
						} else {

							//Check if any attribute specified not part of schema
							var valid = true;
							var schema = data.Items[0].attributes.values;
							var param_keys = Object.keys(incoming.Body);
							
							_(param_keys).forEach(function(key) {
								if (_.indexOf(schema, key) == -1) {
									console.log(key);
									console.log(schema);
									valid = false;
								}
							});

							if (!valid) {
								message = 'Bad Request: invalid attribute included';
								response['Body'] = message;
								response['Code'] = '400';
								ResponseMessageTo(incoming.Header.ResQ, response);
								return;
							} 

							console.log("Updating a new item...");
							dynamodbDoc.put(params, function(err, dataToPut) {
								if (err) {
									console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
									message['Message'] = "Internal Server Error: " + JSON.stringify(err, null, 2);
									response['Body'] = message;
									response['Code'] = '500';

									ResponseMessageTo(incoming.Header.ResQ, response);
								} else {

									console.log("Added item:", JSON.stringify(dataToPut, null, 2));
									message['Message'] = 'OK: Student successfully updated';
									response['Body'] = message;
									response['Code'] = '200';
									ResponseMessageTo(incoming.Header.ResQ, response);
								}
							});
						}
					}
				});
			} else {
				message['Message'] = "Bad Request: Student with id " + incoming.Body.id + " not found";
				response['Body'] = message;

				//response['Code'] = '400 Bad Request';
				response['Code'] = '400';

				ResponseMessageTo(incoming.Header.ResQ, response);
			}
		}
	});
}

exports.DELETEhandler = function(incoming) {
	var schema = incoming.Header.SCHEMA_ACTION;
	var response = {};
	var header = {};
	var message = {};

	if (schema == undefined || schema == null) {
		message['Message'] = 'Bad Request: undefined SCHEMA_ACTION';
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	} else if (schema){
		deleteAttribute(incoming);
	} else {
		deleteStudent(incoming);
	} 
};

var deleteAttribute = function(incoming) {
	var response = {};
	var header = {};
	var message = {};

	header['CID'] = incoming.Header.CID;
	response['Header'] = header;

	var attribute = incoming.Body.attribute;
	if (attribute == undefined) {
		message = "Bad Request: undefined body field \'attribute\'";
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	}

	// Cannot delete firstname, lastname, id
	if (attribute == 'id' || 
		attribute == 'firstname' || 
		attribute == 'lastname') {
		message = "Bad Request: Attribute specified cannot be removed";
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	}

	var schema_params = {
		TableName : schema_table,
		KeyConditionExpression: "#key = :value",
		ExpressionAttributeNames:{
			"#key": "table_name"
		},
		ExpressionAttributeValues: {
			":value":"micro"
		}
	};

	dynamodbDoc.query(schema_params, function(err, data) {
		if (err) {
			console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
			message = JSON.stringify(err, null, 2);
			response['Body'] = message;
			response['Code'] = '500 Internal Server Error';
			ResponseMessageTo(incoming.Header.ResQ, response);
		} else {
			console.log("Schema query succeeded.");
			if (data.Count == 0) {
				console.log("Troubleshoot: Schema not found!");
				var message = "Internal server error";
				response['Body'] = message;
				response['Code'] = '500';
			} else {
				var schema = data.Items[0].attributes.values;
				if (_.indexOf(schema, attribute) == -1) {
					message = "Bad Request: Attribute specified does not exist";
					response['Body'] = message;
					response['Code'] = '400';
					ResponseMessageTo(incoming.Header.ResQ, response);
					return;
				} else {
					var update = _.without(data.Items[0].attributes.values, attribute);
					data.Items[0].attributes.values = update;
					var params = {
						TableName: schema_table,
						Item: data.Items[0]
					};
					dynamodbDoc.put(params, function(err, dataToPut) {
						if (err) {
							console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
							message['Message'] = "Internal Server Error: " + JSON.stringify(err, null, 2);
							response['Body'] = message;
							response['Code'] = '500';

							ResponseMessageTo(incoming.Header.ResQ, response);
						} else {
							console.log("Added item:", JSON.stringify(dataToPut, null, 2));
							message = 'OK: Schema attribute succesfully removed';
							response['Body'] = message;
							response['Code'] = '202';
							ResponseMessageTo(incoming.Header.ResQ, response);
						}

					});
				}
			}
		}
	}); 
};

var deleteStudent = function (incoming){

	var response = {};
	var header = {};
	var message = {};

	header['CID'] = incoming.Header.CID;
	response['Header'] = header;

	var params = {
		TableName:table,
		Key:{
			"id":incoming.Body.id
		}
	};

	if (incoming.Body.id == undefined) {
		message['Message'] = 'Bad Request: undefined id';
		response['Body'] = message;
		response['Code'] = '400';
		ResponseMessageTo(incoming.Header.ResQ, response);
		return;
	}

	console.log("Attempting a delete...");
	dynamodbDoc.delete(params, function(err, data) {
		if (err) {
			console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
			message['Message'] = JSON.stringify(err, null, 2);
			response['Body'] = message;
			response['Code'] = '500 Internal Server Error';
			ResponseMessageTo(incoming.Header.ResQ, response);
		} else {
			console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
			message['Message'] = 'Student successfully deleted';
			response['Body'] = message;
			response['Code'] = '202';
			ResponseMessageTo(incoming.Header.ResQ, response);
		}
	});
}


ResponseMessageTo = function(SQS_url, message){
		// Create an instance of our SQS Client.
		var sqs = new aws.SQS({
			region: config.aws.region,
			accessKeyId: config.aws.accessID,
			secretAccessKey: config.aws.secretKey,

			// For every request in this demo, I'm going to be using the same QueueUrl; so,
			// rather than explicitly defining it on every request, I can set it here as the
			// default QueueUrl to be automatically appended to every request.
			params: {
				QueueUrl: SQS_url
			}
		});

		// Proxy the appropriate SQS methods to ensure that they "unwrap" the common node.js
		// error / callback pattern and return Promises. Promises are good and make it easier to
		// handle sequential asynchronous data.
		var sendMessage = Q.nbind( sqs.sendMessage, sqs );


		// ---------------------------------------------------------- //
		// ---------------------------------------------------------- //


		// Now that we have a Q-ified method, we can forward the message.
		sendMessage({
			MessageBody: JSON.stringify(message)
		})
		.then(
			function handleSendResolve( data ) {
				console.log( chalk.green( "Response Sent")+"\n");//, data.MessageId ) +"\n");
	}
	)

		// Catch any error (or rejection) that took place during processing.
		.catch(
			function handleReject( error ) {

				console.log( chalk.red( "Unexpected Error:", error.message ) +"\n");

			}
			);
	}
