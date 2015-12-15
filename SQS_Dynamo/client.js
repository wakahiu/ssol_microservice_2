// Require the demo configuration. This contains settings for this demo, including
// the AWS credentials and target queue settings.
var config = require( "./config.json" );

// Require libraries.
var aws = require( "aws-sdk" );
var Q = require( "q" );
var chalk = require( "chalk" );
var uuid = require('node-uuid');

var clientID;
var clientQout;
// print process.argv
process.argv.forEach(function (val, index, array) {
  if (index > 2) throw(new Error( "Too many arguments" ) );
  clientID = val;

});

// make sure the client exists in the config file
var clientNames = Object.keys(config.clients);
var ind = clientNames.indexOf(clientID); 
if (ind < 0) throw(new Error(clientID+" not defined in config.json"));

// print out client and Qout to console
var clientQs = config.clients;//[Qname_out];
var Qout = clientQs[clientNames[ind]].Qname_out;
var Qin = clientQs[clientNames[ind]].Qname_in;
console.log("\nCLIENT\t\t:\t"+clientID);
console.log("QUEUE OUT\t:\t"+Qout);
console.log("QUEUE IN\t:\t"+Qin);
console.log();




// Wait for the user to press ENTER before sending
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.question("PRESS ENTER TO SEND THE MESSAGE: ", function(answer) {




		// Create Message to be sent
		var message = {};
		var header = {};

		header['OP'] = clientQs[clientNames[ind]].Req.Header.OP;
		header['ResQ'] = config.aws.queueUrl+Qin;
		header['ID'] = clientQs[clientNames[ind]].Req.Header.ID;
		header['CID'] = uuid.v4(); 
		message['Header'] = header;
		message['Body'] = clientQs[clientNames[ind]].Req.Body;

		console.log(chalk.green("Sending message..."))
		console.log(message)







		// Create Outgoing Queue
		var sqs = new aws.SQS({
			region: config.aws.region,
			accessKeyId: config.aws.accessID,
			secretAccessKey: config.aws.secretKey,

			params: {
				QueueUrl: config.aws.queueUrl+Qout
			}
		});

		// Proxy the appropriate SQS methods to ensure that they "unwrap" the common node.js
		// error / callback pattern and return Promises. Promises are good and make it easier to
		// handle sequential asynchronous data.
		var sendMessage = Q.nbind( sqs.sendMessage, sqs );


		// ---------------------------------------------------------- //
		// ---------------------------------------------------------- //


		// Now that we have a Q-ified method, we can send the message.
		sendMessage({
			MessageBody: JSON.stringify(message)
		})
		.then(
			function handleSendResolve( data ) {
				console.log( chalk.green( "Message sent!") +"\n");//, data.MessageId ) +"\n");


				// wait for response

				// Create an instance of our SQS Client.
				var sqs_in = new aws.SQS({
					region: config.aws.region,
					accessKeyId: config.aws.accessID,
					secretAccessKey: config.aws.secretKey,

					// For every request in this demo, I'm going to be using the same QueueUrl; so,
					// rather than explicitly defining it on every request, I can set it here as the
					// default QueueUrl to be automatically appended to every request.
					params: {
						QueueUrl: config.aws.queueUrl+Qin
					}
				});

				var receiveMessage = Q.nbind( sqs_in.receiveMessage, sqs_in );
				var deleteMessage = Q.nbind( sqs_in.deleteMessage, sqs_in );


				(function pollQueueForMessages() {

					console.log( chalk.yellow( "Starting long-poll operation for Queue : "+ Qin ));


					// Pull a message - we're going to keep the long-polling timeout short so as to
					// keep the demo a little bit more interesting.
					receiveMessage({
						WaitTimeSeconds: 2, // Enable long-polling (2-seconds).
						VisibilityTimeout: 10
					})
					.then(
						function handleMessageResolve( data ) {

							// If there are no message, throw an error so that we can bypass the
							// subsequent resolution handler that is expecting to have a message
							// delete confirmation.
							if ( ! data.Messages ) {

								throw(
								    workflowError(
								        "EmptyQueue",
								        new Error( "There are no messages to process." )
								    )
								);

							}


							// --- 
							//  PROCESS Response - Print to Console
							// ---
							console.log( "\n" + chalk.green( "Response..."));//, data.MessageId ) +"\n");
							var response = JSON.parse(data.Messages[ 0 ].Body);
							console.log(response)
							console.log()




							// Now that we've processed the message, we need to tell SQS to delete the
							// message. Right now, the message is still in the queue, but it is marked
							// as "invisible". If we don't tell SQS to delete the message, SQS will
							// "re-queue" the message when the "VisibilityTimeout" expires such that it
							// can be handled by another receiver.
							return(
								deleteMessage({
								    ReceiptHandle: data.Messages[ 0 ].ReceiptHandle
								})
							);

						}
					)
					.then(
						function handleDeleteResolve( data ) {

							console.log( chalk.green( "Deleted message from Queue" ) +"\n");

						}
					)

					// Catch any error (or rejection) that took place during processing.
					.catch(
						function handleError( error ) {

							// The error could have occurred for both known (ex, business logic) and
							// unknown reasons (ex, HTTP error, AWS error). As such, we can treat these
							// errors differently based on their type (since I'm setting a custom type
							// for my business logic errors).
							switch ( error.type ) {
								case "EmptyQueue":
								    console.log( chalk.cyan( "Expected Error:", error.message ) );
								break;
								default:
								    console.log( chalk.red( "Unexpected Error:", error.message ) );
								break;
							}

						}
					)

					// When the promise chain completes, either in success of in error, let's kick the
					// long-poll operation back up and look for moar messages.
					.finally( pollQueueForMessages );

				})();







			}
		)

		// Catch any error (or rejection) that took place during processing.
		.catch(
			function handleReject( error ) {

				console.log( chalk.red( "Unexpected Error:", error.message ) +"\n");

			}
		);


		// When processing the SQS message, we will use errors to help control the flow of the
		// resolution and rejection. We can then use the error "type" to determine how to
		// process the error object.
		function workflowError( type, error ) {

			error.type = type;

			return( error );

		}









  rl.close();
});



