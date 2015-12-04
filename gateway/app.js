var express = require('express');
var fs = require('fs');
var http = require('http');
var request = require('request');
var async = require('async');
//var Regex = require("regex");
var bodyParser = require('body-parser');

var app = express();
var config = require('./config/config');

var students_routes = require('./students_routes');
var courses_routes = require('./courses_routes');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use('/students', students_routes);
app.use('/courses', courses_routes);

app.get('/', function(req, res) {
console.log(req.url);
res.send('Router working\n');
});

app.listen(config.port);
console.log('Listening on port ' + config.port);

