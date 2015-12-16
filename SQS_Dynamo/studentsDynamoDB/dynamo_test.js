// Require the demo configuration. This contains settings for this demo, including
// the AWS credentials and target queue settings.
var config = require( "../config.json" );

// Require libraries.
var aws = require( "aws-sdk" );

aws.config.update({
			region: config.aws.region,
			accessKeyId: config.aws.accessID,
			secretAccessKey: config.aws.secretKey,
		});


// *********

var dynamodbDoc = new aws.DynamoDB.DocumentClient();

var table = "micro";

var sample_id = "jc4267";

var params = {
    TableName:table,
    Item:{
        "id": sample_id
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