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
 
/**
 * Socket.io logic
 */

io.configure(function() {
  io.set('authorization', function(handshake, callback) {
    parseCookie(handshake, null, function(err) {
      if (err) {
        callback(err);
      } else {
        sessionStore.get(handshake.signedCookies['connect.sid'], function(err, session) {
          if (err) {
            callback(err);
          } else {
            if (!session || !session.passport || !session.passport.user) {
              callback(null, false);
            } else {
              passportLib.deserializeUser(session.passport.user, function(err, user) {
                if (err) {
                  callback(err);
                } else {
                  if (user) {
                    // Tack the full user onto the handshake object so that the socket
                    // code can access it.
                    handshake.user = user;
                    callback(null, true);
                  } else {
                    callback(null, false);
                  }
                }
              });
            }
          }
        });
      }
    });
  });
});
 
 
io.sockets.on('connection', function(socket) {  
  // Create a variable here to let us reference the stream so we can close it later.
  var stream;
  
  // The authorization code will place the user in socket.handshake.user
  var tweeter = twitterLib.apiObject(app.locals.config.twitter.consumerKey,
    app.locals.config.twitter.consumerSecret,
    socket.handshake.user.twitterToken,
    socket.handshake.user.twitterTokenSecret);
  
  tweeter.stream('statuses/sample', function(s) {
    stream = s;
    stream.on('data', function(tweet) {
      console.log(tweet.text);
      socket.emit('list', {text: tweet.text});
    });
  });
  
  socket.on('disconnect', function() {
    if (stream) {
      stream.destroy();
    }
  });
});