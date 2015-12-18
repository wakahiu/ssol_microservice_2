
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
					message['message'] = JSON.stringify(err, null, 2);
					response['Body'] = message;
					response['Code'] = '500 Internal Server Error';
					ResponseMessageTo(incoming.Header.ResQ, response);
	    } else {
	        console.log("Query succeeded.");
					message['message'] = JSON.stringify(data);
					response['Body'] = message;

					if(data.Count == 0) {
						console.log("Troubleshoot: Item not found!")
						response['Code'] = '404 Not Found';
					}

					else {
						response['Code'] = '200 OK';
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
	    TableName:table,
	    Item:incoming.Body
	};

	console.log("Adding a new item...");
	dynamodbDoc.put(params, function(err, data) {
	    if (err) {
	        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
					message['message'] = JSON.stringify(err, null, 2);
					response['Body'] = message;

					//response['Code'] = '400 Bad Request';
					response['Code'] = '500 Internal Server Error';

					ResponseMessageTo(incoming.Header.ResQ, response);
	    } else {
	        console.log("Added item:", JSON.stringify(data, null, 2));
					message['message'] = 'Student successfully added';
					response['Body'] = message;
					ResponseMessageTo(incoming.Header.ResQ, response);
	    }
	});

}

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

	console.log("Adding a new item...");
	dynamodbDoc.put(params, function(err, data) {
			if (err) {
					console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
					message['message'] = JSON.stringify(err, null, 2);
					response['Body'] = message;
					response['Code'] = '500 Internal Server Error';
					ResponseMessageTo(incoming.Header.ResQ, response);
			} else {
					console.log("Added item:", JSON.stringify(data, null, 2));
					message['message'] = 'Student successfully added';
					response['Body'] = message;
					ResponseMessageTo(incoming.Header.ResQ, response);
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

	console.log("Attempting a delete...");
	dynamodbDoc.delete(params, function(err, data) {
	    if (err) {
	        console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
					message['message'] = JSON.stringify(err, null, 2);
					response['Body'] = message;
					response['Code'] = '500 Internal Server Error';
					ResponseMessageTo(incoming.Header.ResQ, response);
	    } else {
	        console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
					message['message'] = 'Student successfully deleted';
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
