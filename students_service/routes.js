// Require the demo configuration. This contains settings for this demo, including
// the AWS credentials and target queue settings.
var awsConfig = require( "./config/credentials-Peter.json" );

// Require libraries.
var aws = require( "aws-sdk" );
var Q = require( "q" );
var chalk = require( "chalk" );

var express = require('express');
var router = express.Router();
var students = require('./students_controller');
var config = require('./config/config');

var subChannel = "students_micro_service";

// Create an instance of our SQS Client.
var sqs = new aws.SQS({
    region: awsConfig.aws.region,
    accessKeyId: awsConfig.aws.accessKeyId,
    secretAccessKey: awsConfig.aws.secretAccessKey,

    // For every request, I'm going to be using the same QueueUrl; so,
    // rather than explicitly defining it on every request, I can set it here as the
    // default QueueUrl to be automatically appended to every request.
    params: {
        QueueUrl: awsConfig.aws.queueUrl
    }
});

// Proxy the appropriate SQS methods to ensure that they "unwrap" the common node.js
// error / callback pattern and return Promises. Promises are good and make it easier to
// handle sequential asynchronous data.
var receiveMessage = Q.nbind( sqs.receiveMessage, sqs );
var deleteMessage = Q.nbind( sqs.deleteMessage, sqs );


// ---------------------------------------------------------- //
// ---------------------------------------------------------- //


module.exports = function(app) {
    app.route('/students')
        .get(students.find)
        .post(students.create);

    app.route('/students/attributes')
        .post(students.add_attribute)
        .delete(students.remove_attribute);

    app.route('/students/:uni')
        .get(students.show)
        .delete(students.remove)
        .put(students.update);

    app.route('/students/:uni/courses')
        .post(students.add_course)
        .delete(students.remove_course);

    function serviceActions (message) { // Listens for referential integrity channel JSON messgages
        console.log("Message: " + message);

        //Switch statement for three RI cases
        var obj = JSON.parse(message);
        var call_number = parseInt(obj.course_id);

        console.log("Action " + obj.service_action);

        switch (obj.service_action) {
            case "update student add course":
                var uni = obj.uni.toLowerCase();
                var firstChar = uni.charAt(0);
                if (firstChar < config.starting_uni || firstChar > config.ending_uni) {
                    console.log("UNI received from MQ is out of bounds: Char " + firstChar + " bounds (" + config.starting_uni + "," + config.ending_uni + ")");
                    return;
                }
                students.ref_add_course(call_number, uni, app, function(err) {
                    if (err != null) {
                        console.log(err);
                    } else {
                        //handle correct case
                    }
                });
                break;

            case "update student delete course":
                var uni = obj.uni.toLowerCase();
                var firstChar = uni.charAt(0);
                if (firstChar < config.starting_uni || firstChar > config.ending_uni) {
                    console.log("UNI received from MQ is out of bounds: Char " + firstChar + " bounds (" + config.starting_uni + "," + config.ending_uni + ")");
                    return;
                }
                students.ref_remove_course(call_number, uni, app, function(err) {
                    if (err != null) {
                        //error handling
                    } else {
                        //handle correct case
                    }
                });
                break;

            case "delete course":
                students.ref_remove_course_on_all_students(call_number, app, function(err) {
                    if (err != null) {
                        //error handling
                    } else {
                        //handle correct case
                    }
                });
                break;

            case "update student add course dne":
                students.ref_rollback_course(app, message, function(err) {
                    if (err != null) {
                        //error handling
                    } else {
                        //handle correct case
                    }
                });
                break;
            default :
                console.log("Service action not found or undefined :" + obj.service_action);
                break;
        }
    };

    // When pulling messages from Amazon SQS, we can open up a long-poll which will hold open
    // until a message is available, for up to 20-seconds. If no message is returned in that
    // time period, the request will end "successfully", but without any Messages. At that
    // time, we'll want to re-open the long-poll request to listen for more messages. To
    // kick off this cycle, we can create a self-executing function that starts to invoke
    // itself, recursively.
    (function pollQueueForMessages() {

        console.log( chalk.yellow( "Starting long-poll operation." ) );

        receiveMessage({
            WaitTimeSeconds: 3, // Enable long-polling (3-seconds).
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

                serviceActions (data.Messages[0].Body);
                // ---
                // TODO: Actually process the message in some way :P
                // ---
                console.log( chalk.green( "Deleting:", JSON.stringify(data.Messages[ 0 ] )) );

                // Now that we've processed the message, we need to tell SQS to delete the
                // message. Right now, the message is still in the queue, but it is marked
                // as "invisible". If we don't tell SQS to delete the message, SQS will
                // "re-queue" the message when the "VisibilityTimeout" expires such that it
                // can be handled by another receiver.
                return(
                    deleteMessage({
                        ReceiptHandle: data.Messages[0].ReceiptHandle
                    })
                );

            }
        )
        .then(
            function handleDeleteResolve( data ) {

                console.log( chalk.green( "Message Deleted!" ) );

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

    // When processing the SQS message, we will use errors to help control the flow of the
    // resolution and rejection. We can then use the error "type" to determine how to
    // process the error object.
    function workflowError( type, error ) {

        error.type = type;

        return( error );

    }
};