/**
 * Module Dependencies
 */
var express = require('express');
var http = require('http');
var path = require('path');
var azure = require('azure');
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  InstagramStrategy = require('passport-instagram').Strategy;
var nconf = require('nconf');
var io = require('socket.io');

// Helper libraries
var twitterLib = require('./lib/twitter');
var instagramLib = require('./lib/instagram');
var passportLib = require('./lib/passport');


/**
 * Load Configuration Values
 * If on Azure we will take from environment variables which are populated based on the
 * App Settings.  If running locally, we will provide the configuration values in a
 * config.json file.
 */
 
nconf.env().file({file: 'config.json'});

var config = {};
config.title = nconf.get("TITLE");
config.root_url = nconf.get("ROOT_URL");
config.cookie_secret = nconf.get("COOKIE_SECRET");

// Load credentials for connecting to azure storage
config.storage_account = nconf.get("STORAGE_ACCOUNT");
config.storage_key = nconf.get("STORAGE_KEY");
config.partition_key = nconf.get("PARTITION_KEY");


/**
 * Create and configure Express app object
 */
 
var app = express();

// Instantiate the session store manually so that we can get session info out of it
var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();

// Instantiate our own cookie parser so that we can use it manually for socket.io
var parseCookie = express.cookieParser(config.cookie_secret);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(parseCookie);

// TODO: Default session provider gives a memory leak warning - look into using something
// else for Azure/Production
app.use(express.session({
  store: sessionStore,
  secret: config.cookie_secret,
  key: 'connect.sid'
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));

 // TODO: Check where this belongs in the middleware stack.  Read something about passport
 // deserializing user for every request because of bad order.
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Load data into app.locals so all Jade templates can use it
app.locals.config = config;


/**
 * Instantiate entities so we can retrieve data from the database.
 */
 
// Create TableService instance
var storageInfo = {
  tableService: azure.createTableService(config.storage_account, config.storage_key),
  partitionKey: config.partition_key
}

// Load entities
var User = new (require('./models/user'))(storageInfo);
var Setting = new(require('./models/setting'))(storageInfo);

// Store references in app.locals
app.locals.entities = {};
app.locals.entities.User = User;
app.locals.entities.Setting = Setting;


/**
 * Configure Passport - this is for site login as well as OAuth calls to social media
 * sites.
 */

// Local strategy
passport.use(new LocalStrategy(passportLib.loginFunction(User)));
passport.serializeUser(passportLib.serializeUser);
passport.deserializeUser(passportLib.deserializeUser);

// Twitter keys/strategy
twitterLib.getKeys(Setting, function(err, data) {
  if (err) {
    throw err;
  } else {
    config.twitter = data;
    passport.use('twitter-auth', twitterLib.PassportStrategy(User, config));
  }
});

// Instagram keys/strategy
instagramLib.getKeys(Setting, function(err, data) {
  if (err) {
    throw err;
  } else {
    config.instagram = data;
    passport.use('instagram-auth', instagramLib.PassportStrategy(User, config));
  }
});


/**
 * Load Controllers
 */
var controllers = require('./controllers');


/**
 * Load Routes
 */
require('./routes')(app);


/**
 * Start server
 */
var server = http.createServer(app);

// Attach socket.io
io = io.listen(server);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


/**
 * Socket.io logic
 */
 
 // TODO: Write io.set('authorization' ...); function.
 
io.sockets.on('connection', function(socket) {
  console.log(socket.handshake.headers);
  
  var counter = 0;
  setInterval(function() {
      socket.emit('list', {text: 'List item ' + counter++});
  }, 2500);
  
  parseCookie(socket.handshake, null, function(err) {
    if (err) {
      console.log('Error');
      console.log(err);
    } else {
      console.log('yay!');
      console.log(socket.handshake.signedCookies);
      sessionStore.get(socket.handshake.signedCookies['connect.sid'], function(err, s) {
        if (err) {
          console.log('error getting session');
          console.log(err);
        } else {
          console.log('yay again');
          console.log(s);
          
          passportLib.deserializeUser(s.passport.user, function(err, user) {
            console.log(user.username);
          });
        }
      });
    }
  });  
});