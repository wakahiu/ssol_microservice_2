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
4. Create Dynamo Tables using the online AWS console.  Be sure to name the tables in accordance with the ones listed in the `congif.json` file:
    * table schema must use primary key `id`
    * schema_table schema must use primary key `table_name` with field `attributes` with stringset values `id`, `firstname`, and `lastname`.

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
				"SCHEMA_ACTION":"<true|false>"		
			},
			"Body":"<REST_Body>"	
		}
}
```


## Installation

`npm install`

## Setup 

### Setup Script
In the working directory, a shell script can be executed to set up the environment.  Instructions on configuring the script are seen within the script.  Once configured, the script can be executed from the command line as follows:

#### For Linux Users with `gnome-terminal` installed

`$ source LINUX_setup_environment.sh`

#### For MAC Users with `iTerm` installed

`$ ./MAC_setup_environment.sh`


### Manual Setup (For Users who elected not to use the setup script)
1. `node ./studentsDynamoDB/app.js`
2. `node gateway.js`
3. `node client.js <client_name>`
4. To add another client repeat Step 3

### For the Example that has been pushed, execute the following in 4 separate terminals
1. `node ./studentsDynamoDB/app.js`
2. `node gateway.js`
3. `node client.js client0`
4. `node client.js client1`


