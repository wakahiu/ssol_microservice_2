
var aws = require( "aws-sdk" );
var Q = require( "q" );
var chalk = require( "chalk" );
var config = require( "../config.json" );

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

