var nconf = require('nconf');

var config_dir = './config/';
var config_filename = 'config.json';
var pathToConfig = config_dir + config_filename;


function getOptionsFromConfigFile () {
  nconf.env(['USER'])
       .file('options', pathToConfig);
  var options = {}
  
  var user = nconf.get('USER')
  if (user) options.user = user
  
  options.host = nconf.get('mongo:host')
  options.port = nconf.get('mongo:port')
  return options
}

module.exports = { DEFAULTS:getOptionsFromConfigFile () }
