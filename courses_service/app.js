/**
 * Module dependencies.
 */


var express        = require( 'express' );
var http           = require( 'http' );
var path           = require( 'path' );
var cookieParser   = require( 'cookie-parser' );
var bodyParser     = require( 'body-parser' );
var methodOverride = require( 'method-override' );
var logger         = require( 'morgan' );
var errorHandler   = require( 'errorhandler' );
var static         = require( 'serve-static' );

var app = express();


// load the config file, get and set the port
var loadconfig = require('./config/loadconfig.js')
var defaultOptions = loadconfig.DEFAULTS
//console.log("Configuration read from the JSON file using nconf is :")
//console.log(defaultOptions)
app.set( 'port', defaultOptions.port );


app.use( methodOverride() );
app.use( cookieParser() );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended : true }));
app.set('json spaces', 5); //auto formats res.json({})
app.use( static( path.join( __dirname, 'public' )));


var server =  http.createServer( app );

// Set the Routes
require('./src/routes')( app );


// listen on server
server.listen( app.get( 'port' ), function (){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
});

