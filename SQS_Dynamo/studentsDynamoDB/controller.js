
var aws = require( "aws-sdk" );
var Q = require( "q" );
var chalk = require( "chalk" );
var config = require( "../config.json" );

aws.config.update({
			region: config.aws.region,
			accessKeyId: config.aws.accessID,
			secretAccessKey: config.aws.secretKey,
		});
var dynamodbDoc = new aws.DynamoDB.DocumentClient();
var table = "micro";

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
exports.GEThandler = function (incoming){

	var response = {};
	var header = {};
	var message = {};

	header['CID'] = incoming.Header.CID;
	response['Header'] = header;

	var params = {
	    TableName : table,
	    KeyConditionExpression: "#key = :value",
	    ExpressionAttributeNames:{
	        "#key": "id"
	    },
	    ExpressionAttributeValues: {
	        ":value":incoming.Body.id
	    }
	};

	console.log("troubleshoot body id: " + incoming.Body.id)

	dynamodbDoc.query(params, function(err, data) {
	    if (err) {
	        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
					message['Message'] = JSON.stringify(err, null, 2);
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
					}

					else {
						returnObj.Message = "OK: Found " + data.Items.length + " Items";
						message = JSON.stringify(returnObj);
						response['Body'] = message;
						response['Code'] = '200';
					}

					ResponseMessageTo(incoming.Header.ResQ, response);
	    }
	});
		// echo the same message back to the client
	//ResponseMessageTo(incoming.Header.ResQ, response)
}

exports.POSThandler = function (incoming){

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

	console.log(Object.keys(incoming.Body));

	console.log(incoming.Body == {});
	console.log(params);

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
		        dynamodbDoc.put(params, function(err, dataToPut) {
				    if (err) {
				        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
								message['Message'] = JSON.stringify(err, null, 2);
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
							response['Code'] = '200';
							ResponseMessageTo(incoming.Header.ResQ, response);
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
	    		console.log("Adding a new item...");
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

exports.DELETEhandler = function (incoming){

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
					response['Code'] = '200 OK';
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
