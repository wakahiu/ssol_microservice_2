// Require the demo configuration. This contains settings for this demo, including
// the AWS credentials and target queue settings.
var config = require( "./credentials-Peter.json" );

console.log(config);

// Require libraries.
var aws = require( "aws-sdk" );
var Q = require( "q" );
var chalk = require( "chalk" );

// Create an instance of our SQS Client.
var sqs = new aws.SQS({
    region: config.aws.region,
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,

    // For every request in this demo, I'm going to be using the same QueueUrl; so,
    // rather than explicitly defining it on every request, I can set it here as the
    // default QueueUrl to be automatically appended to every request.
    params: {
        QueueUrl: config.aws.queueUrl
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
    MessageBody: "This is my first ever SQS request... evar!"
})
.then(
    function handleSendResolve( data ) {

        console.log( chalk.green( "Message sent:", data.MessageId ) );

    }
)

// Catch any error (or rejection) that took place during processing.
.catch(
    function handleReject( error ) {

        console.log( chalk.red( "Unexpected Error:", error.message ) );

    }
);