'use strict';

module.exports = {
    port: process.env.ROUTER_PORT || 5000,
    partitions: [{
        "port": "3001",
        "starting_letter": "a",
        "ending_letter": "h"
    }, {
        "port": "3002",
        "starting_letter": "i",
        "ending_letter": "q"
    }, {
        "port": "3003",
        "starting_letter": "r",
        "ending_letter": "z"
    }],
    courses_port: process.env.COURSES_PORT || 4000,
    //db: 'mongodb://0.0.0.0/students_service'
};
