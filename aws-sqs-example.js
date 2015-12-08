npm install aws-sdk

var AWS = require('aws-sdk'),
    awsCredentialsPath = './aws.credentials.json',
    sqsQueueUrl = 'https://sqs.us-east-1.amazonaws.com/123455678/test-queue',
    sqs;

// Load credentials from local json file
AWS.config.loadFromPath(awsCredentialsPath);
// Instantiate SQS client
sqs = new AWS.SQS().client;