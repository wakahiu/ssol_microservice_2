// Require the demo configuration. This contains settings for this demo, including
// the AWS credentials and target queue settings.
var config = require( "../config.json" );

// Require libraries.
var aws = require( "aws-sdk" );
var Q = require( "q" );
var chalk = require( "chalk" );

// K12 in Q = Gateway out Q
var K12_inQ = config.gateway.Qname_out;

// preallocate Queue arrays
var sqs = new aws.SQS({
			region: config.aws.region,
			accessKeyId: config.aws.accessID,
			secretAccessKey: config.aws.secretKey,

			// For every request in this demo, I'm going to be using the same QueueUrl; so,
			// rather than explicitly defining it on every request, I can set it here as the
			// default QueueUrl to be automatically appended to every request.
			params: {
				QueueUrl: config.aws.queueUrl+K12_inQ
			}
		});

var receiveMessage =  Q.nbind( sqs.receiveMessage, sqs ) ;
var deleteMessage = Q.nbind( sqs.deleteMessage, sqs ) ;


// Proxy the appropriate SQS methods to ensure that they "unwrap" the common node.js
// error / callback pattern and return Promises. Promises are good and make it easier to
// handle sequential asynchronous data.


// ---------------------------------------------------------- //
// ---------------------------------------------------------- //

// When pulling messages from Amazon SQS, we can open up a long-poll which will hold open
// until a message is available, for up to 20-seconds. If no message is returned in that
// time period, the request will end "successfully", but without any Messages. At that
// time, we'll want to re-open the long-poll request to listen for more messages. To
// kick off this cycle, we can create a self-executing function that starts to invoke
// itself, recursively.

	(function pollQueueForMessages() {


		console.log( chalk.yellow( "Starting long-poll operation for Queue : "+ K12_inQ ));


		// Pull a message - we're going to keep the long-polling timeout short so as to
		// keep the demo a little bit more interesting.
		receiveMessage({
		    WaitTimeSeconds: 2, // Enable long-polling (2-seconds).
		    VisibilityTimeout: 10
		})
		.then(
		    function handleMessageResolve( data ) {

		        // If there are no messages, throw an error so that we can bypass the
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

				var incoming = JSON.parse(data.Messages[ 0 ].Body);
				var controller = require("./controller");
				//controller.echoMessage(incoming);


				//  PROCESS MESSAGE - GET/PUT/POST/DELETE DYNAMO Service
				// DYNAMODB implementation:
				switch(incoming.Header.OP.toUpperCase()){
					case 'GET':
						controller.GEThandler(incoming);
						break;
					case 'PUT':
						controller.PUThandler(incoming);
						break;
					case 'POST':
						controller.POSThandler(incoming);
						break;
					case 'DELETE':
						controller.DELETEhandler(incoming);
						break;
				}


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
		// long-poll operation back up and look for more messages.
		.finally( pollQueueForMessages );

	})();



// When processing the SQS message, we will use errors to help control the flow of the
// resolution and rejection. We can then use the error "type" to determine how to
// process the error object.
function workflowError( type, error ) {

    error.type = type;

    return( error );

}
