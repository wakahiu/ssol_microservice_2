#!/bin/bash


# BEFORE RUNNING 
# 	1. install iTerm
# 	2. set the working directory path variable
		WD=~/Desktop/ssol_microservices_2
# 	3. set file permissions (i.e $ chmod 711 setup_env.sh) 


# Function to open new iTerm terminal tabs from the command line
#
# Author: Justin Hileman (http://justinhileman.com)
#
# Installation:
#     Add the following function to your `.bashrc` or `.bash_profile`,
#     or save it somewhere (e.g. `~/.tab.bash`) and source it in `.bashrc`
#
# Usage:
#     tab                   Opens the current directory in a new tab
#     tab [PATH]            Open PATH in a new tab
#     tab [CMD]             Open a new tab and execute CMD
#     tab [PATH] [CMD] ...  You can prob'ly guess

# Only for teh Mac users
[ `uname -s` != "Darwin" ] && return

function tab () {
    local cmd=""
    local cdto="$PWD"
    local args="$@"

    if [ -d "$1" ]; then
        cdto=`cd "$1"; pwd`
        args="${@:2}"
    fi

    if [ -n "$args" ]; then
        cmd="; $args"
    fi

    osascript &>/dev/null <<EOF
        tell application "iTerm"
            tell current terminal
                launch session "Default Session"
                tell the last session
                    write text "cd \"$cdto\"$cmd"
                end tell
            end tell
        end tell
EOF
}




CLIENT_PATH=$WD/SQS_Dynamo
GATEWAY_PATH=$WD/SQS_Dynamo
STUDENTS_PATH=$WD/SQS_Dynamo/studentsDynamoDB


echo "Setting up environment..."

# CLIENTS SETUP
tab node $CLIENT_PATH/client.js client0
tab node $CLIENT_PATH/client.js client1

# GATEWAY SETUP
tab node $GATEWAY_PATH/gateway.js

# STUDENTS SETUP
tab node $STUDENTS_PATH/app.js


echo "DONE"
