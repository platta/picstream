
/**
 * Module dependencies.
 */

var azure = require('azure'),
	nconf = require('nconf');

nconf.env().file({file: 'config.json'});

var tableName = nconf.get("TABLE_NAME"),
	partitionKey = nconf.get("PARTITION_KEY"),
	accountName = nconf.get("STORAGE_NAME"),
	accountKey = nconf.get("STORAGE_KEY");

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

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
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// TODO: More stuff with authorization eventually...
//var auth = express.basicAuth('testUser', 'testPass');
//app.get('/', auth, routes.index);

app.get('/', routes.index);
app.get('/users', user.list);

// Token stuff
var TokenList = require('./routes/tokenlist');
var Token = require('./models/token');
var token = new Token(azure.createTableService(accountName, accountKey), tableName, partitionKey);
var tokenList = new TokenList(token);

app.get('/tokenlist', tokenList.showTokens.bind(tokenList));
app.post('/tokenlist/addtoken', tokenList.addToken.bind(tokenList));
app.post('/tokenlist/deletetoken', tokenList.deleteToken.bind(tokenList));
// End token stuff

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
