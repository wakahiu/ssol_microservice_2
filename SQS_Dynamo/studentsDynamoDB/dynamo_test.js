// Require the demo configuration. This contains settings for this demo, including
// the AWS credentials and target queue settings.
var config = require( "../config.json" );

// Require libraries.
var aws = require( "aws-sdk" );

aws.config.update({
			region: config.aws.region,
			accessKeyId: config.aws.accessID,
			secretAccessKey: config.aws.secretKey,

			// For every request in this demo, I'm going to be using the same QueueUrl; so,
			// rather than explicitly defining it on every request, I can set it here as the
			// default QueueUrl to be automatically appended to every request.
			//params: {
				//QueueUrl: config.aws.queueUrl+K12_inQ
			//}
		});


// *********

var dynamodbDoc = new aws.DynamoDB.DocumentClient();

var table = "music";

var title = "The Big New Movie";

var params = {
    TableName:table,
    Item:{
        "artist": title
    }
};

console.log("Adding a new item...");
dynamodbDoc.put(params, function(err, data) {
    if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
    }
});
