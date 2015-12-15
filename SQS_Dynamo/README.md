# SQS & Dynamo Assignment


## AWS Configuration
1. Be sure to have an AWS account
2. Update `conf.json` in accordance with the AWS credentials of the account:
    * aws.accessID
    * aws.secretKey
    * aws.region
    * aws.queueUrl (this is the url path and does not include the Queue name)
3. Create SQS queues using the online AWS console.  Be sure to name the queues in accordance with the ones listed in the `congif.json` file:
    * clients.`<client_name>`.Qname_out
    * clients.`<client_name>`.Qname_in
    * gateway.`<client_name>`.Qname_out

## Additional Configuration
In addition to the AWS setup, each client must be configured in the `config.json` file using the following form:
```JSON
"clients":{
	"<client_name>":{
		"Qname_out"	: "<out_queue_name>",
		"Qname_in"	: "<in_queue_name>",
		"Req":{
			"Header":{
				"OP":"<REST_operation>",
				"ID": "<student_id_number>"			
			},
			"Body":"<REST_Body>"	
		}
}
```


## Installation

`npm install`

## Setup 

### Setup Script (For Users with gnome-terminal installed)
In the working directory, the `runAll.sh` shell script can be executed to set up the environment.  Instructions on configuring the script are seen within the script.  Once configured, the script can be executed from the command line as follows:

`$ source runAll.sh`

### Manual Setup (For Users without gnome-terminal installed)
1. `node ./studentsDynamoDB/app.js`
2. `node gateway.js`
3. `node client.js <client_name>` (can have more than one client)

### For the Example that has been pushed, execute the following in 4 separate terminals
1. `node ./studentsDynamoDB/app.js`
2. `node gateway.js`
3. `node client.js client0`
4. `node client.js client1`


