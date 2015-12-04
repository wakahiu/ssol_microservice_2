var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');
var http = require('http');
var redis = require('redis');


// Database-related dependencies
var Promise = require('bluebird');
var MongoDB = Promise.promisifyAll(require('mongodb'));
var MongoClient = Promise.promisifyAll(MongoDB.MongoClient);

clientRISub = redis.createClient()  // Subscribes to ri channel
clientRIPub = redis.createClient() // Publishes to ri channel

var init = require('./config/init')();
var config = require('./config/config');
var routes = require('./routes');

var app = express();
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('showStackError', true);

// Environment dependent middleware
if (process.env.NODE_ENV === 'development') {
  // Enable logger (morgan)
  app.use(logger('dev'));

  // Disable views cache
  app.set('view cache', false);
} else if (process.env.NODE_ENV === 'production') {
  app.locals.cache = 'memory';
}

MongoClient.connect(config.db, { promiseLibrary: Promise }, (err, db) => {
  if (err) {
    logger.warn("Failed to connect to the database. ${err.stack}");
  }
  app.locals.db = db;
});

require('./routes')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handlers
// development error handler
// will print stacktrace
if (process.env.NODE_ENV === 'development') {
  app.use(function(err, req, res, next) {
    console.log(err.message);
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message,
    error: {}
  });
});


server.listen(config.port);
module.exports = app;
console.log('Server has started on port ' + config.port);


