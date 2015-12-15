# This script will set up the testing environment on Ubuntu 14.04

# Dependencies
# 1. make sure gnome-terminal is installed -> sudo apt-get install gnome-terminal

# INSTRUCTIONS:
# 2. get file permisisons -> chmod u+x setUpSSOL.sh
# 3. SET THE WORKING DIRECTORY
WD=~/Desktop/ssol_microservices_2/SQS_Dynamo
# 4. run "source setUpSSOL.sh" to execute the script as a TCL

STUDENTS="		
	cd $WD/studentsDynamoDB;  
	node app.js;
"

GATEWAY="		
	cd $WD;  
	node gateway.js;
"

CLIENT0="	
	cd $WD;
	node client.js client0;
"

CLIENT1="	
	cd $WD;
	node client.js client1;
"


gnome-terminal 	--tab -e "bash -c \" $STUDENTS exec bash\"" \
				--tab -e "bash -c \" $GATEWAY exec bash\"" \
				--tab -e "bash -c \" $CLIENT0 exec bash\"" \
				--tab -e "bash -c \" $CLIENT1 exec bash\"" 






