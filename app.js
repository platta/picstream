
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');

var nconf = require('nconf');
nconf.env().file({file: 'config.json'});

var config = {};
config.title = nconf.get("TITLE");
config.storage_key = nconf.get("STORAGE_KEY");

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Load Controllers
var controllers = require('./controllers');

// Load Routes
require('./routes')(app, controllers);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
